'use strict'
var https = require('https');
var fs = require('fs');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var mockHttpsServer = require('../modules/mockHttpsServer');

var httpPost = function (httpAddress, body, callback) {
    axios.post(httpAddress, body)
        .then(function (response) {
            callback(response);
        })
        .catch(function (error) {
            callback(error);
        });
}


exports.httpsSender = function (transformedMessage, channel, filePath) {
    mockHttpsServer.startServer(443, function (resp) {
        console.log('Body received by mock https server: ' + resp);
    })

    var options = {
        host: channel.https_dest_host
        , port: channel.https_dest_port
        , method: channel.https_dest_method
        };

    var ca = null;
    var cert = null;
    if (channel.https_dest_ca != '') {
        ca = fs.readFileSync(channel.https_dest_ca, 'utf8');
        options['ca'] = ca; 
    }
    if (channel.https_dest_cert != '') {
        cert = fs.readFileSync(channel.https_dest_cert, 'utf8');
        options['cert'] = cert; 
    }
    //console.log('z options: ' + options);
    options.agent = new https.Agent(options);

    var req = https.request (options, function(res) {
        if (res.status == 200) {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
            console.log('https client sent the message...');
            if (channel.inbound_type == 'File directory') {
                if (channel.post_processing_action == 'delete') {
                    postProcessing.deleteFile(filePath, function (success) {
                    });
                } else if (channel.post_processing_action == 'move') {
                    postProcessing.moveFile(filePath, (channel.move_destination + postProcessing.parseFileName(filePath)), function (success) {  
                    });
                } else if (channel.post_processing_action == 'copy') {
                    postProcessing.copyFile(filePath, (channel.copy_destination + postProcessing.parseFileName(filePath)), function (success) {   
                    });
                }
            }
        } else {
            console.log('da response: ' + res);
            channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
        }
        //res.pipe(process.stdout);
      });
      
      req.write(transformedMessage);
      req.end();

}