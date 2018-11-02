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

/*
var composeAckMessage = function (SendingApplication, SendingFacility, ReceivingApplication, ReceivingFacility, MessageId){
    var TimeStamp = Date.now();
    var ackMessage = `MSH|^~\\&|${SendingApplication}|${SendingFacility}|${ReceivingApplication}|${ReceivingFacility}|${TimeStamp}||ACK^O01|${MessageId}|P|2.3\nMSA|AA|${MessageId}`;
    return ackMessage;
}
*/
var composeAckMessage = function (ackMessage, MessageId){
    var TimeStamp = Date.now();
    var message = "`" + ackMessage + "`";
    try {
        message = eval(message); // runs string interpolation to insert variables
    } catch (err) {
        console.log('---catch error' + err);
    } finally {
    }
    console.log('interoplated ack: ' + message);
    return message;
}

exports.startTcpListener = function(channel, senderFunc, callback) {
    var tcpListener = createTcpListener(channel.tcp_port, channel.tcp_host);

    tcpListener.on('connection', function(conn) {
        let body = [];
        var newmessage;
        conn.on('data', (chunk) => {
          body.push(chunk);
        }).on('end', () => {
          body = Buffer.concat(body).toString();
          // at this point, `body` has the entire request body stored in it as a string
          //callback(body);
          messages.messageReceived(body, channel, senderFunc, function(err, newmessage){
            newmessage = newmessage;
            console.log(newmessage._id);
          }); 
        });
    
        conn.on('end', () => {
            console.log('client disconnected');
        });

        if (channel.is_send_ack){
            var messageId = Math.floor((Math.random() * 10000) + 1);
            var ackMessage= composeAckMessage(channel.ack_message, messageId);
            console.log(ackMessage);
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