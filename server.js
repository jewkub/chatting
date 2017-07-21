'use strict';

var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');
app.set('port', 8080);
app.set('ip', '0.0.0.0');

// route
app.use(favicon(__dirname + '/favicon.ico'));
app.get('/', (req, res, next) => {
  res.send('aa');
});
app.get('/chat', (req, res, next) => {
  res.sendFile(__dirname + '/chat.html');
});
app.get('/monitor', (req, res, next) => {
  res.sendFile(__dirname + '/monitor.html');
});
app.get('/draw', (req, res, next) => {
  res.sendFile(__dirname + '/draw.html');
});

// error handle
app.all('*', (req, res, next) => {
	let err = new Error('Cannot GET "' + req.path + '".');
	err.status = 404;
	next(err);
});
app.use((err, req, res, next) => {
  console.error(err.message);
  res.send('' + err.stack);
});

// socket.io
let users = {};
let monio = io.of('/monitor');
let monSocket;
let updateMonitor = name => {
  monio.emit('userChange', {
    img: users[name],
    name,
  });
  //console.log(users);
};
io.on('connection', socket => {
  let name = 'Anonymous';

  socket.emit('connect', true);
  socket.on('name', data => {
    name = data.name;
    users[name] = '';
    updateMonitor(name);
    console.log(name + ' has joined');
  });
  /*socket.on('message', text => {
    console.log('message: "' + text + '" emitted by ' + name);
    io.emit('message', {
      text,
      name,
    });
  });*/
  socket.on('imageSend', img => {
    console.log('image: (image) emitted by' + name);
    io.emit('image', {
      img,
      name,
    });
  });
  /*socket.on('typing', text => {
    console.log('typing: "' + text + '" emitted by ' + name);
    users[name] = text;
    updateMonitor(name);
  });*/
  socket.on('drawing', data => {
    console.log('drawing: (image) emitted by ' + name);
    users[name] = data;
    updateMonitor(name);
  });
  // removing user on "disconnect"
  socket.on('disconnect', () => {
    console.log(name + ' has left');
    if (users[name] !== undefined){
      delete users[name];
      updateMonitor(name);
    }
  });
});
monio.on('connection', socket => {
  monSocket = socket;
  socket.emit('allUsers', users);
});

// listen
http.listen(app.get('port'), app.get('ip'), () => {
	console.log('%s: Node server started on %s:%d ...', Date(Date.now()), app.get('ip'), app.get('port'));
});