'use strict'
var net = require('net');
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');

var messageReceived = function (rawMessage, channel, senderFunc) {
    channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
    // write message to messages table
    messages.addMessageToMessageTable(channel, rawMessage, null, 'Received', null, function (err, newMessage) {
        transformers.runTransformers(rawMessage, channel, function (err, transformedMessage) {
            if (err) {
                newMessage.status = 'Transformer error';
                newMessage.err = err;
                messages.updateMessage(newMessage, function (err, updatedMessage) {
                })
            } else {
                newMessage.status = 'Transformed';
                newMessage.transformed_data = transformedMessage;
                messages.updateMessage(newMessage, function (err, updatedMessage) {
                    senderFunc(transformedMessage, channel, null, updatedMessage)
                })

            }

        })
    });
}

var createTcpListener = function (port, host) {
    var server = net.createServer();
    server.listen(port, host, () => {
        console.log('tcp server bound to port: ' + port);
    });
    return server;
}

var composeAckMessage = function (SendingApplication, SendingFacility, ReceivingApplication, ReceivingFacility, MessageId){
    var TimeStamp = Date.now();
    var ackMessage = `MSH|^~\\&|${SendingApplication}|${SendingFacility}|${ReceivingApplication}|${ReceivingFacility}|${TimeStamp}||ACK^O01|${MessageId}|P|2.3\nMSA|AA|${MessageId}`;
    return ackMessage;
}

exports.startTcpListener = function(channel, senderFunc, callback) {
    var tcpListener = createTcpListener(channel.tcp_port, channel.tcp_host);

    tcpListener.on('connection', function(conn) {
        let body = [];
        conn.on('data', (chunk) => {
          body.push(chunk);
        }).on('end', () => {
          body = Buffer.concat(body).toString();
          // at this point, `body` has the entire request body stored in it as a string
          //callback(body);
          messages.messageReceived(body, channel, senderFunc, callback); 
        });
    
        conn.on('end', () => {
            console.log('client disconnected');
        });
        if (channel.is_send_ack){
            var ackMessage= composeAckMessage(
                channel.sending_application,
                channel.sending_facility,
                channel.receiving_application,
                channel.receiving_facility,
                1561651);
            conn.write(ackMessage);
        } else {
            conn.write("Message received.");           
        }

    });
        
    tcpListener.on('error', (err) => {
        //throw err;
        callback(err, null);
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

    callback(null, tcpListener);
}