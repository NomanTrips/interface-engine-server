'use strict'
var http = require('http');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var axios = require('axios');

var httpPost = function (httpAddress, body, callback) {
    axios.post(httpAddress, body)
        .then(function (response) {
            callback(response);
        })
        .catch(function (error) {
            callback(error);
        });
}

var mockHttpServer = function (port) {
    http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('Success!');
        res.end();
    }).listen(port);
}

exports.httpSender = function (transformedMessage, channel, filePath) {
    mockHttpServer(9080);
    httpPost(channel.http_destination, transformedMessage, function (resp) {
        if (resp.status == 200) {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
            console.log('http client sent the message...');
            if (channel.inbound_type == 'File directory'){
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
            console.log(resp);
            channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
        }
    });
}