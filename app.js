
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , Tail = require('tail').Tail;

var app = express();

var filename = '/private/var/log/system.log';

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req,res){
  res.render('index', { title: 'Way2Health Log Viewer' });
});


var server = http.createServer(app),
    sto = false,
    prevSize = 0;


server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
var io = require('socket.io').listen(server);

io.on('connection', function(client){
  console.log('Client connected');
  
  var stats = fs.statSync(filename);
  var start = stats.size-(stats.size/5);
  prevSize = stats.size;

  var stream = fs.createReadStream(filename,{encoding: 'utf8', start: start});
  stream.on('data', function(data){
    client.send(data);
  });
  stream.on('end', function(){
    if (!sto){
      sto = setTimeout(checkFile,500);
    }
  });
 
});

function checkFile(){
  console.log('test');
  if (Object.keys(io.sockets.sockets).length > 0){
    var stats = fs.statSync(filename);
    if (stats.size > prevSize){
      var stream = fs.createReadStream(filename,{encoding: 'utf8', start: prevSize});
      prevSize = stats.size;
      stream.on('data', function(data){
        io.sockets.emit('addLog',data);
      });
      stream.on('end', function(){
        sto = setTimeout(checkFile,500);
      });
    } else {
      sto = setTimeout(checkFile,500);
    }
  } else {
    sto = false;
  }
}