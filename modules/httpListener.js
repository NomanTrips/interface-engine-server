'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var http = require('http');

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

var createHttpListener = function (port) {
    return http.createServer(function (req, res) {
    }).listen(port);
}

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

exports.startHttpListener = function (channel, senderFunc, callback) {
    var server = createHttpListener(channel.http_port);
    
    server.on('request', (req, res) => {    
        // parse the body out of the http request
        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // at this point, `body` has the entire request body stored in it as a string
            messages.messageReceived(body, channel, senderFunc, callback);
        });
        if (channel.is_send_ack){
            var messageId = Math.floor((Math.random() * 10000) + 1);
            var ackMessage= composeAckMessage(channel.ack_message, messageId);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(ackMessage);
            res.end();
        } else {  
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('Message received.');
            res.end();        
        }
    });
    
    server.on('error', function (err) {
        // Handle your error here
        callback(err, null);
        console.log(err);
    });
    
    server.on('listening', function() {
        console.log('HTTP server listening on: ' + channel.http_port);
        callback(null, server)
    })
}