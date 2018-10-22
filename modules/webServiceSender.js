'use strict'
var http = require('http');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var mockWebServiceListener = require('../modules/mockWebServiceListener');
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

var composeSoapMessage = function (transformedMessage, envelope){
    var resultStr = '';
    envelope = "`" + envelope + "`"; // add string literal ticks
    try {
        resultStr = eval(envelope); // runs string interpolation to insert variables
    } catch (err) {
        console.log('---catch error' + err);
    } finally {
    }
    return resultStr;
}

exports.webServiceSender = function (transformedMessage, channel, filePath) {
    //mockWebServiceListener.startMockWebServiceListener();
    var soapEnvelope = composeSoapMessage(transformedMessage, channel.web_service_sender_envelope);
    httpPost(channel.web_service_sender_service_url, soapEnvelope, function (resp) {
        if (resp.status == 200) {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
            console.log('web service sender sent the message...');
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