import React from 'react';
import { View, Text, AsyncStorage } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { GiftedChat } from 'react-native-gifted-chat';

const USER_ID = '@userId';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      userId: null
    };

    this.determineUser = this.determineUser.bind(this);
    this.onReceivedMessage = this.onReceivedMessage.bind(this);
    this.onSend = this.onSend.bind(this);
    this._storeMessages = this._storeMessages.bind(this);

    this.socket = SocketIOClient('http://localhost:3000');
    this.socket.on('CHAT', this.onReceivedMessage);
    this.determineUser();
  }


  //Kiem tra User
  determineUser() {
    AsyncStorage.getItem(USER_ID)
      .then((userId) => {
        // If there isn't a stored userId, then fetch one from the server.
        if (!userId) {
          this.socket.emit('CHAT', null);
          this.socket.on('CHAT', (userId) => {
            AsyncStorage.setItem(USER_ID, userId);
            this.setState({ userId });
          });
        } else {
          this.socket.emit('CHAT', userId);
          this.setState({ userId });
        }
      })
      .catch((e) => alert(e));
  }

 //Nhan tin nhan
  onReceivedMessage(messages) {
    this._storeMessages(messages);
  }

  //gui tin nhan
  onSend(messages=[]) {
    this.socket.emit('MESSAGE', messages[0]);
    this._storeMessages(messages);
  }

  render() {
    var user = { _id: this.state.userId || -1 };

    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={this.onSend}
        user={user}
      />
    );
  }

  
  _storeMessages(messages) {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, messages),
      };
    });
  }
}

module.exports = Main;
