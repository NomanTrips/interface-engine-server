'use strict'
var net = require('net');
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');

var createTcpListener = function (port, host, callback) {
    var server = net.createServer((connection) => {
        // 'connection' listener
        console.log('client connected');
        connection.on('end', () => {
          console.log('client disconnected');
        });
        connection.write('hello\r\n');
        //var data = connection.pipe(connection);
        
        let body = [];
        connection.on('data', (chunk) => {
          body.push(chunk);
        }).on('end', () => {
          body = Buffer.concat(body).toString();
          // at this point, `body` has the entire request body stored in it as a string
          callback(body);
        });

      });

      server.on('error', (err) => {
        throw err;
      });
      server.listen(port, host, () => {
        console.log('server bound');
      });
}

exports.startTcpListener = function(channel, senderFunc) {
    createTcpListener(channel.tcp_port, channel.tcp_host, function (message) {
        channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
        // write message to messages table
        transformers.runTransformers(message, channel, function (transformedMessage) {
            messages.addMessageToMessageTable(message, transformedMessage, channel);
            senderFunc(transformedMessage, channel);
        })
    });

    // mock client for testing
    var client = new net.Socket();
    client.connect(channel.tcp_port, channel.tcp_host, function() {
        console.log('Connected');
        client.write('<?xml version="1.0" encoding="UTF-8"?><note><to>ftps sender...</to><from>jan 15th 8:15</from><heading>Where lies the strangling fruit from the hands of the sinner</heading><body>Southern reach</body></note>');
    });
      
    client.on('data', function(data) {
        console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
    });
      
    client.on('close', function() {
        console.log('Connection closed');
    });

}