'use strict';
var fs = require('fs');
//let Client = require('ssh2-sftp-client');
let ftp = require('ftp');
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var mockSftpServer = require('../modules/mockSftpServer');
var sftpClient = require('ssh2').Client;


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
    //mockSftpServer.startMockSftpServer();   
    //var sftp = new Client();
     
    var conn = new sftpClient();
    conn.on('ready', function() {
      console.log('Client :: ready');
      
      conn.sftp(function(err, sftp) {
        if (err) throw err;
        sftp.stat('testfile.txt', function (err, stats){
            console.log('Stats: ' + stats);
            sftp.open('testfile.txt', 'r', function(err, handle){
                if (err) throw err;
                var buff = new Buffer(stats.size);
                console.log('handle length- '+ handle.byteLength);
                sftp.read(handle, buff, 0, stats.size, 0, function(err, data, buffer) {
                    if (err) throw err;
                    console.log('showing data: ' + buffer);
                    sftp.close(handle, function (){
                        if (err) throw err;
                    });
                    conn.end();
                    var fileName = Date.now().toString();
                    senderFunc(buffer, channel, fileName)
                })
            })
        })

        //sftp.readdir('\\', function (err, list){
          //  if (err) throw err;
           // console.log(list); 
        //})
        sftp.lstat('', function (err, stats) {
            console.dir(stats); 
        })
        //sftp.open('foo', function(err, list) {
          //  if (err) throw err;
            //console.dir(list);
            //conn.end();
          //});
      });
   
    }).connect({
      host: '127.0.0.1',
      port: 22,
      username: 'tester',
      password: 'password'
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
        //var timer = setInterval(readerFunc, intervalInMilliseconds, [channel, senderFunc]);
        readerFunc([channel, senderFunc]);
        //return timer;
    }

}