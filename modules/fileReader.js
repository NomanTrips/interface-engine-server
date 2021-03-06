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
            callback(err, null);
        } else {
            files.forEach(file => {
                filePaths.push(sourceDirectory + file);
            })
            callback(null, filePaths);
        }

    });
}

var fileRead = function (sourceFile, callback) {
    var message = null;
    fs.readFile(sourceFile, 'utf8', function (err, data) {
        callback(err, data);
        /*
         if (err) {
             callback(err);
             return console.log(err);
         } else { // save message about file
             message = data;
             callback(message);
         }
         */
    });
}

var setMessage = function (err, newMessage) {
    if (!err) {
        message = newMessage;
    }
}

exports.startFileListener = function (channel, senderFunc, callback) {
    var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
    
    var timer = setInterval(function() {
        directoryRead(channel.inbound_location, function (err, filePaths) {
            if (err) {
                messages.addMessageToMessageTable(channel, null, null, 'Source error', err, function (err, newMessage){});
                callback(err, null);
            } else {
                filePaths.forEach(filePath => {
                    fileRead(filePath, function (err, rawMessage) {
                        if (err) {
                            messages.addMessageToMessageTable(channel, null, null, 'Source error', err, function (err, newMessage){});
                            callback(err, null);
                        } else {
                            messages.messageReceived(rawMessage, channel, senderFunc, callback);   
                        }
    
                    })
                })
            }
        })
    }, intervalInMilliseconds);
    callback(null, timer);

}

var messageReceived = function (rawMessage, channel, senderFunc, callback) {
    channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
    // write message to messages table
    messages.addMessageToMessageTable(channel, rawMessage, null, 'Received', null, function (err, newMessage) {
        transformers.runTransformers(rawMessage, channel, function (err, transformedMessage) {
            if (err) {
                newMessage.status = 'Transformer error';
                newMessage.err = err;
                messages.updateMessage(newMessage, function (err, updatedMessage) {
                });
                callback(err, null);
            } else {
                newMessage.status = 'Transformed';
                newMessage.transformed_data = transformedMessage;
                messages.updateMessage(newMessage, function (err, updatedMessage) {
                    senderFunc(transformedMessage, channel, null, updatedMessage)
                })

            }

        })
    });
}

var connectToFTP = function (host, port, username, password, use_tls) {
    var ftpConnection = new ftp();
    ftpConnection.connect({
        host: host,
        port: port,
        user: username,
        password: password,
        secure: use_tls,
        secureOptions: { rejectUnauthorized: false }
    });
    return ftpConnection; 
}

exports.startFTPListener = function(channel, senderFunc, callback) {
    var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
    var timer = setInterval(function() {
        console.log('running set interval');
        var ftpConnection = connectToFTP(
            channel.ftp_host, 
            channel.ftp_port, 
            channel.ftp_username, 
            channel.ftp_password,
            channel.ftp_use_tls
        );
        ftpConnection.on('ready', function () {
            ftpConnection.list(function (err, list) {
                if (err) throw err;
                list.forEach(file => {
                    if (file.type == '-') {
                        ftpConnection.get(file.name, function (err, stream) {
                            if (err) {
                                console.log(err);
                            };
                            var message = ''
                            stream.on('data', chunk => message += chunk);
    
                            stream.on('end', function () {

                                messages.messageReceived(message, channel, senderFunc, callback);

                                //post processing
                                if (channel.post_processing_action == 'Delete') {
                                    ftpConnection.delete(file.name, function (err) {
                                        console.log(err);
                                    })
                                } else if (channel.post_processing_action == 'Move') {
                                    ftpConnection.rename(file.name, channel.move_destination + file.name, function (err) {
                                        console.log(err);
                                    })
                                } else if (channel.post_processing_action == 'Copy') {
                                    ftpConnection.put(message, channel.copy_destination + file.name, function (err) {
                                        console.log(err);
                                    })
                                }
                            });

                        });
                    }
                })
            });
        });
        ftpConnection.on('error', function (err) {
            callback(err, null);
            console.log(err);
        });
    }, intervalInMilliseconds);
    //return timer;
    callback(null, timer);
}

var connectToSFTP = function(host, port, username, password, isPrivateKeyAuth, private_key) {
    var options = {
        host: host,
        port: port,
        username: username,
    }
    if (isPrivateKeyAuth) {
        options['privateKey'] = private_key;
    } else {
        options['password'] = password;
    }
    console.log(options);
    var conn = new sftpClient();
    conn.connect(options);
    return conn;
}

exports.startSFTPListener = function(channel, senderFunc, callback) {
    mockSftpServer.startMockSftpServer();
    var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
    var timer = setInterval(function() {
        var sftpConnection = connectToSFTP(
            channel.sftp_host,
            channel.sftp_port,
            channel.sftp_username,
            channel.sftp_password,
            channel.sftp_auth_type,
            channel.sftp_private_key       
        );
        sftpConnection.on('ready', function () {
            console.log('Client :: ready');
            sftpConnection.sftp(function (err, sftp) {
                if (err) { callback(err, null); }
                sftp.readdir(channel.sftp_path, function (err, list) {
                    if (err) { callback(err, null); }
                    if (list != undefined && list.length > 0){
                        list.forEach(function (file, index, arr) {
                            var sftpFileName = channel.sftp_path + file.filename;
                            sftp.stat(sftpFileName, function (err, stats) {
                                console.log('Stats: ' + stats);
                                sftp.open(sftpFileName, 'r', function (err, handle) {
                                    if (err) { callback(err, null); }
                                    var buff = new Buffer(stats.size);
                                    console.log('file length- ' + stats.size);
                                    sftp.read(handle, buff, 0, stats.size, 0, function (err, data, buffer) {
                                        if (err) { callback(err, null); }
                                        console.log('showing data: ' + buffer);
                                        var fileName = Date.now().toString();
                                        //senderFunc(buffer, channel, fileName);
                                        messages.messageReceived(buffer, channel, senderFunc, callback);
                                        sftp.close(handle, function () {
                                            if (err) { callback(err, null); }
                                        });
                                        if (index == arr.length - 1) {
                                            sftpConnection.end();
                                        }
                                    })
                                })
                            })
        
                        })
                    }

                    //
                })
            })
    
        })
    }, intervalInMilliseconds);
    callback(null, timer);
    
}

/*
exports.readFromSFTP = function (channel, senderFunc) {
    mockSftpServer.startMockSftpServer();   
    //var sftp = new Client();
    var options = {
        host: channel.sftp_host,
        port: channel.sftp_port,
        username: channel.sftp_username,
    }
    if (channel.sftp_auth_type == true) {
        options['privateKey'] = channel.sftp_private_key;
    } else {
        options['password'] = channel.sftp_password;
    }

    var conn = new sftpClient();
    conn.on('ready', function () {
        console.log('Client :: ready');
        conn.sftp(function (err, sftp) {
            if (err) throw err;
            sftp.readdir(channel.sftp_path, function (err, list) {
                if (err) throw err;
                list.forEach(function (file, index, arr) {
                    var sftpFileName = channel.sftp_path + file.filename;
                    sftp.stat(sftpFileName, function (err, stats) {
                        console.log('Stats: ' + stats);
                        sftp.open(sftpFileName, 'r', function (err, handle) {
                            if (err) throw err;
                            var buff = new Buffer(stats.size);
                            console.log('file length- ' + stats.size);
                            sftp.read(handle, buff, 0, stats.size, 0, function (err, data, buffer) {
                                if (err) throw err;
                                console.log('showing data: ' + buffer);
                                var fileName = Date.now().toString();
                                senderFunc(buffer, channel, fileName);
                                sftp.close(handle, function () {
                                    if (err) throw err;
                                });
                                if (index == arr.length - 1) {
                                    conn.end();
                                }
                            })
                        })
                    })

                })
                //
            })
        })
        /*
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
        });
     
    }).connect(options);

}
*/

/*
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
*/