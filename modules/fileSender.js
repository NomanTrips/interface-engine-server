'use strict';
var fs = require('fs');
var channelStats = require('../modules/channelStats');
var postProcessing = require('../modules/postProcessing');
var sftpClient = require('ssh2').Client;
var ftp = require('ftp');

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

exports.writeToFtp = function(transformedMessage, channel, fileName) {  
    var ftpConnection = new ftp();
    var destFilePath = channel.ftp_dest_path + fileName;
    var buffer = Buffer.from(transformedMessage, 'utf8');

    ftpConnection.on('ready', function() {
      console.log('Client :: ready');
      ftpConnection.put(buffer, destFilePath, function(err) {
        if (err) {
            channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
            throw err;
        } else {
            channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
        }
        ftpConnection.end();
      })
    })
    ftpConnection.connect({
        host: channel.ftp_dest_host,
        port: channel.ftp_dest_port,
        user: channel.ftp_dest_username,
        password: channel.ftp_dest_password,
        secure: channel.ftp_dest_use_tls,
        secureOptions: { rejectUnauthorized: false }
    });    
}

exports.writeToSFTP = function (transformedMessage, channel, fileName) {
    var options = {
        host: channel.sftp_dest_host,
        port: channel.sftp_dest_sftp_port,
        username: channel.sftp_dest_username,    
    }
    if (channel.sftp_auth_type == true){
        options['privateKey'] = channel.sftp_dest_private_key;
    } else {
        options['password'] = channel.sftp_dest_password;
    }
    
    var destFilePath = channel.sftp_dest_path + fileName;
    var buffer = Buffer.from(transformedMessage, 'utf8');

    var conn = new sftpClient();
    conn.on('ready', function() {
      console.log('Client :: ready');

      conn.sftp(function(err, sftp) {
        if (err) throw err;
        sftp.open(destFilePath, 'w', function(err, handle) {
            if (err) throw err;
            sftp.write(handle, buffer, 0, buffer.byteLength, 0, function (err) {
                if (err) {
                    channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
                    throw err;
                }
                channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
                sftp.close(handle, function () {
                    if (err) throw err;
                });
                conn.end();
            })
        })
      })
    }).connect(options);
    
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