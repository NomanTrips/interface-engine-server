'use strict';
var fs = require('fs');
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var fileSender = require('../modules/fileSender');
var httpSender = require('../modules/httpSender');


var intervalToMilliseconds = function (interval, units) {
    var intervalMultiplier;
    switch (units) {
        case 'milliseconds':
            intervalMultiplier = 1;
            break;
        case 'seconds':
            intervalMultiplier = 1000;
            break;
        case 'minutes':
            intervalMultiplier = 60000;
            break;
        case 'hours':
            intervalMultiplier = 3600000; // 3.6e+6
            break;
        case 'days':
            intervalMultiplier = 86400000; //8.64e+7
    }
    return intervalMultiplier * interval;
}

var directoryRead = function (sourceDirectory, callback) {
    var filePaths = []; // array of the file paths in the source dir
    fs.readdir(sourceDirectory, (err, files) => {
        if (err) {
            callback(err);
        }
        files.forEach(file => {
            filePaths.push(sourceDirectory + file);
        })
        callback(filePaths);
    });
}

var fileRead = function (sourceFile, callback) {
    var message = null;
    fs.readFile(sourceFile, 'utf8', function (err, data) {
        if (err) {
            callback(err);
            return console.log(err);
        } else { // save message about file
            message = data;
            callback(message);
        }
    });
}

var readFromDirectory = function (args) {
    var channel = args[0];
    var senderFunc = args[1];

    directoryRead(channel.inbound_location, function (filePaths) {
        filePaths.forEach(filePath => {
            fileRead(filePath, function (message) {
                channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
                // write message to messages table
                transformers.runTransformers(message, channel, function (transformedMessage) {
                    messages.addMessageToMessageTable(message, transformedMessage, channel);
                    senderFunc(transformedMessage, channel, filePath)
                })
            })
        })
    })    
}

exports.startFileReader = function (channel) {
    var readerFunc;
    var senderFunc;

    if (channel.inbound_type == 'File directory') {
        readerFunc = readFromDirectory;
    } else if (channel.inbound_type == 'sftp') {

    }

    if (channel.outbound_type == 'File directory') {
        senderFunc = fileSender.FileSender;
    } else if (channel.outbound_type == 'http') {
        senderFunc = httpSender.httpSender;
    }

    if (channel.schedule_type == 'Periodic') {
        var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
        console.log(intervalInMilliseconds);
        var timer = setInterval(readerFunc, intervalInMilliseconds, [channel, senderFunc]);
        return timer;
    }

}