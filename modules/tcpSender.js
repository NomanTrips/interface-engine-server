'use strict'

var net = require('net');

exports.tcpSender = function (channel) {
    var client = new net.Socket();
    client.connect(channel.tcp_port, channel.tcp_ip_address, function() {
        console.log('Connected');
        client.write('Hello, server! Love, Client.');
    });
    
    client.on('data', function(data) {
        console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
    });
    
    client.on('close', function() {
        console.log('Connection closed');
    });
}