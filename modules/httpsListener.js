'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var fileSender = require('../modules/fileSender');
var httpSender = require('../modules/httpSender');
//var mockClient = require('../modules/mockHttpsClient');
var https = require('https');
var fs = require('fs');

var https = require('https')
//, path = require('path')
, ca = fs.readFileSync('C:\\certs\\root\\my-private-root-ca.cert.pem', 'utf8')
, port = 8443
, hostname = 'localhost'
, rejectUnauthorized= true
, requestCert= true
, agent= false
;

var options = {
host: hostname
, port: port
//, path: '/'
, ca: ca
};
options.agent = new https.Agent(options);

var createHttpsListener = function (credentials, port, callback) {
    //console.log('key: ' + credentials.key);
    https.createServer(credentials, function (req, res) {
        console.log('getting to create 13');
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

    https.request (options, function(res) {
        res.pipe(process.stdout);
      }).end();
}


var httpsListener = function (channel, senderFunc) {
    var privateKey  = fs.readFileSync(channel.https_privateKey, 'utf8');
    var certificate = fs.readFileSync(channel.https_certificate, 'utf8');    
    var credentials = {key: privateKey, cert: certificate};

    createHttpsListener(credentials, channel.https_port, function (message) {
        channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
        // write message to messages table
        transformers.runTransformers(message, channel, function (transformedMessage) {
            messages.addMessageToMessageTable(message, transformedMessage, channel);
            senderFunc(transformedMessage, channel);
        })
    })
}


exports.startHttpsListener = function (channel){
    var senderFunc;

    if (channel.outbound_type == 'File directory') {
        senderFunc = fileSender.FileSender;
    } else if (channel.outbound_type == 'http') {
        senderFunc = httpSender.httpSender;
    }

    httpsListener(channel, senderFunc);
}