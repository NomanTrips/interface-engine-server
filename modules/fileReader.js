'use strict';
var fs = require('fs');
let Client = require('ssh2-sftp-client');
let ftp = require('ftp');
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');


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
                    var fileName = postProcessing.parseFileName(filePath);
                    senderFunc(transformedMessage, channel, fileName)
                })
            })
        })
    })    
}

var readFromFtp = function(args) {
    var channel = args[0];
    var senderFunc = args[1];   
    var ftpConnection = new ftp();

    ftpConnection.on('ready', function() {
        ftpConnection.list(function(err, list) {
            if (err) throw err;
            list.forEach(file => {
                if (file.type == '-') {
                    ftpConnection.get(file.name, function(err, stream) {
                        if (err) {
                            console.log(err);
                        };
                        var message = ''
                        stream.on('data', chunk => message += chunk);

                        stream.on('end', function () {
                            channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
                            // write message to messages table
                            transformers.runTransformers(message, channel, function (transformedMessage) {
                                messages.addMessageToMessageTable(message, transformedMessage, channel);
                                senderFunc(transformedMessage, channel, file.name)
                            })
                            if (channel.post_processing_action == 'Delete') {
                                ftpConnection.delete(file.name, function(err) {
                                    console.log(err);
                                })
                            } else if (channel.post_processing_action == 'Move') {
                                ftpConnection.rename(file.name, channel.move_destination + file.name, function(err) {
                                    console.log(err);
                                })
                            } else if (channel.post_processing_action == 'Copy') {
                                ftpConnection.put(message, channel.copy_destination + file.name, function(err) {
                                    console.log(err);
                                })
                            }
                        });

                        //stream.once('close', function() { ftpConnection.end(); });
                        //stream.pipe(fs.createWriteStream('foo.local-copy.txt'));
                    });
                }
            })
        //ftpConnection.end();
      });
    });
    // connect to localhost:21 as anonymous 
    ftpConnection.connect({
        host: channel.sftp_host,
        port: channel.sftp_port,
        user: channel.sftp_username,
        password: channel.sftp_password       
    });    
}

var readFromSFTP = function (args) {
    var channel = args[0];
    var senderFunc = args[1];    
    var sftp = new Client();
    sftp.connect({
        host: channel.sftp_host,
        port: channel.sftp_port,
        username: channel.sftp_username,
        password: channel.sftp_password
    }).then(() => {
        return sftp.list('/pathname');
    }).then((data) => {
        console.log(data, 'the data info');
    }).catch((err) => {
        console.log(err, 'catch error');
    }); 
}

exports.startFileReader = function (channel, senderFunc) {
    var readerFunc;

    if (channel.inbound_type == 'File directory') {
        readerFunc = readFromDirectory;
    } else if (channel.inbound_type == 'SFTP') {
        readerFunc = readFromSFTP
    } else if (channel.inbound_type == 'FTP') {
        readerFunc = readFromFtp
    }

    if (channel.schedule_type == 'Periodic') {
        var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
        console.log(intervalInMilliseconds);
        var timer = setInterval(readerFunc, intervalInMilliseconds, [channel, senderFunc]);
        return timer;
    }

}