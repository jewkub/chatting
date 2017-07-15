var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.set('port', 8080);
app.set('ip', '0.0.0.0');

// route
app.get('/', (req, res, next) => {
  res.send('aa');
});
app.get('/chat', (req, res, next) => {
  res.sendFile(__dirname + '/chat.html');
});
app.get('/monitor', (req, res, next) => {
  res.sendFile(__dirname + '/monitor.html');
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
let changeTyping = () => {
  monio.emit('userChange', users);
  //console.log(users);
};
io.on('connection', socket => {
  let name = 'Anonymous';
  console.log('user connected');

  socket.emit('connect', true);
  socket.on('name', data => {
    name = data.name;
    users[name] = '';
    changeTyping();
  });
  socket.on('message', text => {
    console.log('message: "' + text + '" emitted by ' + name);
    io.emit('message', {
      text,
      by: name,
    });
  });
  socket.on('typing', text => {
    console.log('typing: "' + text + '" emitted by ' + name);
    users[name] = text;
    changeTyping();
  });

  socket.on('check-presence', username => {
      let isUserPresent = users[username] === undefined;
      socket.emit('presence', isUserPresent);
  });

  // removing user on "disconnect"
  socket.on('disconnect', () => {
    if (users[name] !== undefined){
      delete users[name];
      changeTyping();
    }
  });
});
monio.on('connection', socket => {
  monSocket = socket;
  changeTyping();
});

// listen
http.listen(app.get('port'), app.get('ip'), () => {
	console.log('%s: Node server started on %s:%d ...', Date(Date.now()), app.get('ip'), app.get('port'));
});