'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var http = require('http');

var createHttpListener = function (port, callback) {
    http.createServer(function (req, res) {
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
            callback(body);
        });

    }).listen(port);
}


var httpListener = function (channel, senderFunc) {
    createHttpListener(9090, function (message){
        channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
        // write message to messages table
        transformers.runTransformers(message, channel, function (transformedMessage) {
            messages.addMessageToMessageTable(message, transformedMessage, channel);
            senderFunc(transformedMessage, channel);
        })
    })
}


exports.startHttpListener = function (channel, senderFunc){
    httpListener(channel, senderFunc);
}