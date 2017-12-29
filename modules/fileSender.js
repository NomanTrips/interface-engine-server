'use strict';
var fs = require('fs');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');

var writeFile = function (dest_path, message, callback) {
    fs.writeFile(dest_path, message, function (err) {
        if (err) {
            console.log(err);
            callback(false);
        }
        console.log("The file was saved!");
        callback(true);
    });
}

exports.FileSender = function (transformedMessage, channel, fileName) {

    var destFilePath = channel.outbound_location + fileName;
    
    writeFile(destFilePath, transformedMessage, function (success) {
        if (success) {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
        } else {
            channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
        }

        /*
        if (filePath != null) {
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
        */

    })
}