var express = require('express');
var http = require('http')
var socketio = require('socket.io');
var mongojs = require('mongojs');

var ObjectID = mongojs.ObjectID;
var db = mongojs(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/local');
var app = express();
var server = http.Server(app);
var websocket = socketio(server);
server.listen(3000, () => console.log('listening on *:3000'));


var clients = {};
var users = {};

// chon ChatRoom có Id = 1
var RoomId = 1;
console.log('RoomId:'+ RoomId);

websocket.on('connection', (socket) => {
    clients[socket.id] = socket;
    socket.on('CHAT', (userId) => {
      console.log('Chat la gi:' + userId);
      onUserJoined(userId, socket)
    });
    socket.on('MESSAGE', (message) => {
      console.log('Message la gi: '+ JSON.stringify(message))
      onMessageReceived(message, socket)
    });
});

// lănng nghe sự kiện từ username
function onUserJoined(userId, socket) {
  try {
    
    if (!userId) {
      var user = db.collection('users').insert({}, (err, user) => {
        socket.emit('CHAT', user._id);
        users[socket.id] = user._id;
        _sendExistingMessages(socket);
      });
    } else {
      users[socket.id] = userId;
      _sendExistingMessages(socket);
    }
  } catch(err) {
    console.err(err);
  }
}

// Khi user gửi tin nhắn
function onMessageReceived(message, senderSocket) {
  var userId = users[senderSocket.id];
  if (!userId) return;

  _sendAndSaveMessage(message, senderSocket);
}


function _sendExistingMessages(socket) {
  var messages = db.collection('messages')
    .find({ RoomId })
    .sort({ createdAt: 1 })
    .toArray((err, messages) => {
      // Nếu không có tin nhắn
      if (!messages.length) return;
      socket.emit('MESSAGE', messages.reverse());
  });
}

// lưu vào database và gửi vào room
function _sendAndSaveMessage(message, socket, fromServer) {
  var messageData = {
    text: message.text,
    user: message.user,
    createdAt: new Date(message.createdAt),
    RoomId: RoomId
  };

  db.collection('messages').insert(messageData, (err, message) => {
    // neu có tin nhan thì gửi dến mọi user
    var emitter = fromServer ? websocket : socket.broadcast;
    emitter.emit('message', [message]);
  });
}

// // Allow the server to participate in the chatroom through stdin.
// var stdin = process.openStdin();
// stdin.addListener('data', function(d) {
//   _sendAndSaveMessage({
//     text: d.toString().trim(),
//     createdAt: new Date(),
//     user: { _id: 'robot' }
//   }, null /* no socket */, true /* send from server */);
// });
