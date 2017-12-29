'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var fileSender = require('../modules/fileSender');
var httpSender = require('../modules/httpSender');
var httpsSender = require('../modules/httpsSender');
//var mockClient = require('../modules/mockHttpsClient');
var https = require('https');
var fs = require('fs');

var createHttpsListener = function (credentials, port, callback) {
    return https.createServer(credentials, function (req, res) {
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


var httpsListener = function (channel, senderFunc) {
    var privateKey  = fs.readFileSync(channel.https_privateKey, 'utf8');
    var certificate = fs.readFileSync(channel.https_certificate, 'utf8');    
    var credentials = {key: privateKey, cert: certificate};

    return createHttpsListener(credentials, channel.https_port, function (message) {
        channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
        // write message to messages table
        transformers.runTransformers(message, channel, function (transformedMessage) {
            messages.addMessageToMessageTable(message, transformedMessage, channel);
            var fileName = Date.now().toString();//toString('mm-dd-yyyy:hh:mm:ss');
            senderFunc(transformedMessage, channel, fileName);
        })
    })
}


exports.startHttpsListener = function (channel){
    var senderFunc;

    if (channel.outbound_type == 'File directory') {
        senderFunc = fileSender.FileSender;
    } else if (channel.outbound_type == 'http') {
        senderFunc = httpSender.httpSender;
    } else if (channel.outbound_type == 'https') {
        senderFunc = httpsSender.httpsSender;
    }

    return httpsListener(channel, senderFunc);
}