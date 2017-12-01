'use strict';
var fs = require('fs');
var channelStats = require('../modules/channelStats');

var parseFileName = function (fullPath) {
    // some string trickery to get the file name
    var reversedPath = fullPath.split("").reverse().join("");
    var fileName = reversedPath.substring(0, reversedPath.indexOf('\\'));
    fileName = fileName.split("").reverse().join("");
    return fileName;
}

var copyFile = function (inbound_path, outbound_path, callback) {
    fs.copyFile(inbound_path, outbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        console.log('successfully copied file');
        callback(true);
    });
}

var moveFile = function (inbound_path, outbound_path, callback) {
    fs.rename(inbound_path, outbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false)
        }
        console.log('successfully moved file');
        callback(true);
    });
}

var deleteFile = function (inbound_path, callback) {
    fs.unlink(inbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        callback(true);
        console.log('successfully deleted file');
    });
}

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

exports.FileSender = function (transformedMessage, channel, filePath) {
    console.log('getting here');
    var destFilePath = channel.outbound_location + parseFileName(filePath);
    
    writeFile(destFilePath, transformedMessage, function (success) {
        if (success) {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
        } else {
            channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
        }

        if (channel.post_processing_action == 'delete') {
            deleteFile(filePath, function (success) {

            });
        } else if (channel.post_processing_action == 'move') {
            moveFile(filePath, (channel.move_destination + parseFileName(filePath)), function (success) {

            });
        } else if (channel.post_processing_action == 'copy') {
            copyFile(filePath, (channel.copy_destination + parseFileName(filePath)), function (success) {

            });
        }

    })
}