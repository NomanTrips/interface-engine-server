// Firstly we'll need to import the fs library
var fs = require('fs');

// next we'll want make our Logger object available
// to whatever file references it.
var Logger = exports.Logger = {};

var infoStream = 'logs/info.txt';//fs.createWriteStream('logs/info.txt');
var errorStream = 'logs/error.txt';//fs.createWriteStream('logs/error.txt');
var debugStream = 'logs/debug.txt';//fs.createWriteStream('logs/debug.txt');


Logger.info = function(msg) {
  var message = new Date().toISOString() + " : " + msg + "\n";
  //infoStream.write(message);
  fs.appendFile(infoStream, message, function (err) {
    if (err) throw err;
  });
};

Logger.debug = function(msg) {
  var message = new Date().toISOString() + " : " + msg + "\n";
  //debugStream.write(message);
  fs.appendFile(debugStream, message, function (err) {
    if (err) throw err;
  });
};

Logger.error = function(msg) {
  var message = new Date().toISOString() + " : " + msg + "\n";
  //errorStream.write(message);
  fs.appendFile(errorStream, message, function (err) {
    if (err) throw err;
  });
};