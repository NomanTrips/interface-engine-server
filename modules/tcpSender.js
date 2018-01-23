'use strict'
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var net = require('net');

var mockTcpServer = function (){
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
          console.log('--mock server received body' + body);
        });

      });

    server.on('error', (err) => {
        throw err;
    });
    server.listen(9092, '127.0.0.1', () => {
        console.log('mock server bound');
    });
}

exports.tcpSender = function (transformedMessage, channel) {
    //mockTcpServer(); for testing
    var client = new net.Socket();
    client.connect(channel.tcp_dest_port, channel.tcp_dest_host, function() {
        console.log('Connected');
        client.write(transformedMessage);
    });
    
    client.on('data', function(data) {
        console.log('Received: ' + data);
        channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
        client.destroy(); // kill client after server's response
    });

    client.on('error', function(err) {
        throw err;
        channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
    });

    client.on('close', function() {
        console.log('Connection closed');
    });
}