'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
//var mockClient = require('../modules/mockHttpsClient');
var https = require('https');
var fs = require('fs');

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

var createHttpsListener = function (credentials, port) {
    return https.createServer(credentials, function (req, res) {
    }).listen(port);
}


exports.startHttpsListener = function (channel, senderFunc, callback) {
    var privateKey  = fs.readFileSync(channel.https_privateKey, 'utf8');
    var certificate = fs.readFileSync(channel.https_certificate, 'utf8');    
    var credentials = {key: privateKey, cert: certificate};

    var server = createHttpsListener(credentials, channel.https_port);

    server.on('request', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('Success!');
        res.end();

        // parse the body out of the http request
        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // at this point, `body` has the entire request body stored in it as a string
            messageReceived(body, channel, senderFunc);
        });
      });

    server.on('error', function (err) {
        // Handle your error here
        callback(err, null);
        console.log(err);
    });

    server.on('listening', function() {
        console.log('HTTPS server listening on: ' + channel.https_port);
        callback(null, server)
    })
}