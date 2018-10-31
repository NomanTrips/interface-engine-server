'use strict';

var Channel = require('../models/channel');
var Message = require('../models/message');
var User = require('../models/user');
var Messages = require('../modules/messages');
var ChannelInstance = require('../models/channelinstance');
var ChannelStatistics = require('../models/channelstatistics');
var Transformers = require('../models/transformer');

var fileReader = require('../modules/fileReader');
var httpListener = require('../modules/httpListener');
var httpsListener = require('../modules/httpsListener');
var tcpListener = require('../modules/tcpListener');
var databaseReader = require('../modules/databaseReader');
var webServiceListener = require('../modules/webserviceListener');

var logging = require('../modules/logging');

var fileSender = require('../modules/fileSender');
var httpSender = require('../modules/httpSender');
var httpsSender = require('../modules/httpsSender');
var tcpSender = require('../modules/tcpSender');
var databaseWriter = require('../modules/databaseWriter');
var webServiceSender = require('../modules/webServiceSender');
var serverErrors = require('../modules/servererrors');

var UserController = require('../controllers/userController');

var messageStorageDaemon = require('../daemons/messageStorage');

var async = require('async');
var http = require('http');
var _ = require('lodash');
var axios = require('axios');
//var libxmljs = require('libxmljs');
//var parseString = require('xml2js').parseString;

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

var getUserViewPermissions = function(userid, callback) {
    UserController.user_channel_permissions_get(userid, function (permissions){
        var channelViewPermissions = [];
        _.forEach(permissions, function(value, key) {
            if (value.view) {
                channelViewPermissions.push(key); 
            }
          });
        callback(channelViewPermissions);
    });
}

// Display list of all Channels
exports.channel_list = function (req, res, next) {
    getUserViewPermissions(req.user._id, function (permissions){
        Channel.find({}, 'name user description inbound_type, outbound_type, inbound_location, outbound_location, status, is_running')
        .where('_id')
        .in(permissions) // only return channels the user has permissions to view
        .populate('user')
        .exec(function (err, list_channels) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_channels);
        });
    })
};

// Display detail page for a specific channel
exports.channel_detail = function (req, res) {
    //res.send('NOT IMPLEMENTED: channel detail: ' + req.params.id);
    Channel.findById(req.params.id)
        .populate('user')
        .exec(function (err, channel_detail) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(channel_detail);
        });

};

// Display channel create form on GET
exports.channel_create_get = function (req, res) {
    res.send('NOT IMPLEMENTED: channel create GET');
};

// Handle channel create on POST
exports.channel_create_post = function (req, res) {
    console.log('running create');
    var channel = new Channel({
        name: 'Enter new channel name',
        //user: '',
        description: 'Enter new channel description',
        inbound_type: '',
        outbound_type: '',
        inbound_location: '',
        outbound_location: '',
        http_destination: '',
        move_destination: '',
        post_processing_action: '',
        copy_destination: '',
        schedule_type: '',
        schedule_interval: '',
        schedule_unit: '',
        status: 'Stopped',
    })
    console.log(channel);
    channel.save(function (err) {
        if (err) {
            console.log(err);
            //callback(false)
            res.status(500).send('Failed to create channel.');
            return
        }
        console.log('New channel added: ' + channel);
        res.status(200).send(channel);
    });
};

// Display channel delete form on GET
exports.channel_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: channel delete GET');
};

// Handle channel delete on POST
exports.channel_delete_post = function (req, res) {
    Channel.remove({ _id: req.params.id }, function (err) {
        if (!err) {
            console.log('Succesfully deleted channel.');
            res.status(200).send('Succesfully deleted channel.');
        }
        else {
            console.log('Failed to delete channel.');
            res.status(500).send('Failed to delete channel.');
        }
    });
};

// Display channel update form on GET
exports.channel_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: channel update GET');
};

var fs = require('fs');

var httpPost = function (httpAddress, body, callback) {
    axios.post(httpAddress, body)
        .then(function (response) {
            callback(response);
        })
        .catch(function (error) {
            callback(error);
        });
}

var addMessageToMessageTable = function (message, transformedMessage, channelId) {
    var messageDetail = {
        channel: channelId,
        raw_data: message,
        transformed_data: transformedMessage,
        received_date: Date.now()
    }
    var message = new Message(messageDetail);
    message.save(function (err) {
        if (err) {
            console.log(err);
            //cb(err, null)
            return
        }
        console.log('New Message added');
        //cb(null, message)
    });
}

var updateMessageStats = function (channelId, received, sent, errors) {
    ChannelStatistics.findOne({ channel: channelId }, 'channel received sent error_count')
        .populate('channel')
        .exec(function (err, channel_stats) {
            if (err) { return next(err); }
            if (channel_stats != null) {
                channel_stats.error_count = channel_stats.error_count + errors;
                channel_stats.received = channel_stats.received + received;
                channel_stats.sent = channel_stats.sent + sent;
                ChannelStatistics.findByIdAndUpdate(channel_stats._id, channel_stats, {}, function (err, stats) {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                    console.log('Updated stats in db: ' + stats);
                });

            }
        })
}

/* probably vestigal code
var httpTransfer = function (message, destination, channelId) {
    var received = 0;
    var errors = 0;
    var sent = 0;
    console.log('message --- ' + message);
    addMessageToMessageTable(message, channelId);
    received = received + 1;

    fs.writeFile(destination + Date.now(), message, function (err) {
        if (err) {
            // add to error count
            errors = errors + 1;
            return console.log(err);
        }
        // add to sent count
        sent = sent + 1;
        console.log("Wrote the http stream to file.");
        // update channel message stats in the db
        updateMessageStats(channelId, received, sent, errors);
    });

}
*/

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

/* vestigal code
var directoryMove = function (oldFilePath, newFilePath, callback) {
    fs.rename(oldFilePath, newFilePath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                //copy();
            } else {
                //callback(err);
                console.log(err);
            }
            callback(err);
        } else { // file moved succesfully 
            callback(true);
        }
    });
}
*/

var createHttpListener = function (port, callback) {
    http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('Success!');
        res.end();

        // parse the body out of the http request
        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // at this point, `body` has the entire request body stored in it as a string
            callback(body);
        });

    }).listen(port);
}

var mockHttpServer = function (port) {
    http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('Success!');
        res.end();
    }).listen(port);
}

var timer = null;

/* vestigal code
var moveFile = function (inbound_path, outbound_path, callback) {
    console.log('doing move file');
    fs.rename(inbound_path, outbound_path, (err) => {
        if (err) {
            throw err;
            res.status(500).send('Failed to start!');
        }
        console.log('successfully moved file');
        res.status(200).send('Started!');
    });
}
*/

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

var parseFileName = function (fullPath) {
    // some string trickery to get the file name
    var reversedPath = fullPath.split("").reverse().join("");
    var fileName = reversedPath.substring(0, reversedPath.indexOf('\\'));
    fileName = fileName.split("").reverse().join("");
    return fileName;
}


var updateReceivedMessageStat = function (messageStats) {
    ChannelStatistics.update({ _id: messageStats.id }, {
        received: messageStats.received + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

var updateSentMessageStat = function (messageStats, sent_count) {
    ChannelStatistics.update({ _id: messageStats._id }, {
        sent: messageStats.sent + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

var updateErrorsMessageStat = function (messageStats, err_count) {
    ChannelStatistics.update({ _id: messageStats._id }, {
        error_count: messageStats.error_count + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

var getChannelStats = function (channelStatId, callback) {
    ChannelStatistics.find({ channel: channelStatId }, 'received sent error_count')
        .exec(function (err, message_stats) {
            if (err) { return next(err); }
            callback(message_stats[0]);
        })
}

var runTransformers = function (message, channelId, callback) {
    var transformedMessage = message;
    Transformers.find({ channel: channelId }, 'script')
        .exec(function (err, transformers) {
            transformers.forEach(transformer => {
                console.log(transformer.script);
                eval(transformer.script);
                console.log('after eval... ' + transformedMessage);
            })
            callback(transformedMessage)
        })
}

var timer = null;
var server = null;

var sendServerStartResp = function (res, isStartSuccess, err) {
    if (res == null) { // start from client
        //continue;
    } else { // start from browser send response
        if (isStartSuccess) {
            res.status(200).send('Started channel succesfully!');
        } else {
            res.status(500).send(err);
        }
    }


}

var updateServerStatus = function (channelId, isStartSuccess) {
    Channel.update({ _id: channelId }, {
        is_running: isStartSuccess
    }, function (err, affected, resp) {
        if (err) {

        } else {
            logging.Logger.info(`Channel ${channelId} started: ${isStartSuccess}`);
        }
        console.log(resp);
    })
}

// for manually sending a message to the channel
exports.channel_send_message_post = function (req, res){
    var message = req.body.message;
    Channel.findById(req.params.id)
    .exec(function (err, channel) {
        var senderFunc;
        if (channel.outbound_type == 'File directory') {
            senderFunc = fileSender.FileSender;
        } else if (channel.outbound_type == 'http') {
            senderFunc = httpSender.httpSender;
        } else if (channel.outbound_type == 'https') {
            senderFunc = httpsSender.httpsSender;
        } else if (channel.outbound_type == 'SFTP') {
            senderFunc = fileSender.writeToSFTP;
        } else if (channel.outbound_type == 'FTP') {
            senderFunc = fileSender.writeToFtp;
        } else if (channel.outbound_type == 'TCP') {
            senderFunc = tcpSender.tcpSender;
        }

        databaseReader
        Messages.messageReceived(message, channel, senderFunc);
    })
}

exports.channel_message_storage_config_get = function (req, res){
    Channel.find({'_id': req.params.id}, 'message_storage_limit message_cleanup_enabled')
    .exec(function (err, config) {
        if (err){
            res.status(500).send(err);
        } else {
            res.json(config);
        }
    })
}

exports.channel_message_storage_config_post = function (req, res){
    Channel.findOne({ _id: req.params.id }, function (err, channel) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        channel.message_storage_limit = req.body.message_storage_limit;
        channel.message_cleanup_enabled = req.body.message_cleanup_enabled;
        channel.save(function (err) {
            if (err) {
                res.status(500).send(err);
                return;
            } else {
                res.status(200).send("Succesfully updated channel " + req.params.id + "config.");
            }
        });
    });    
}

var appendChannelInfo = function (channel, message){
    return `Channel: ${channel._id} ${channel.name}: ${message}`;
}

exports.channel_start = function (req, res) {
    Channel.findById(req.params.id)
        .exec(function (err, channel) {

            var senderFunc;

            if (channel.outbound_type == 'File directory') {
                senderFunc = fileSender.FileSender;
            } else if (channel.outbound_type == 'http') {
                senderFunc = httpSender.httpSender;
            } else if (channel.outbound_type == 'https') {
                senderFunc = httpsSender.httpsSender;
            } else if (channel.outbound_type == 'SFTP') {
                senderFunc = fileSender.writeToSFTP;
            } else if (channel.outbound_type == 'FTP') {
                senderFunc = fileSender.writeToFtp;
            } else if (channel.outbound_type == 'TCP') {
                senderFunc = tcpSender.tcpSender;
            } else if (channel.outbound_type == 'Database writer') {
                senderFunc = databaseWriter.databaseWriter;
            } else if (channel.outbound_type == 'Web service sender') {
                senderFunc = webServiceSender.webServiceSender;
            }

            //webServiceSender

            if (channel.inbound_type == 'File directory') {
                fileReader.startFileListener(channel, senderFunc, function(err, newtimer){
                    if (err) {
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        timer = newtimer;
                    }
                });
            } 
            else if (channel.inbound_type == 'FTP') {
                
                fileReader.startFTPListener(channel, senderFunc, function (err, newtimer){
                    if (err) {
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                        //sendServerStartResp(res, false, err);
                        //updateServerStatus(channel._id, false);
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        timer = newtimer;
                    }
                });
                
            }
            else if (channel.inbound_type == 'SFTP') {       
               
                fileReader.startSFTPListener(channel, senderFunc, function (err, newtimer){
                    if (err) {
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        timer = newtimer;
                    }
                });
            
            }
            else if (channel.inbound_type == 'http') {
                httpListener.startHttpListener(channel, senderFunc, function (err, newServer){                   
                    if (err){
                        sendServerStartResp(res, false, err);
                        updateServerStatus(channel._id, false);
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        server = newServer;
                    }
                });
            } else if (channel.inbound_type == 'https') {
                httpsListener.startHttpsListener(channel, senderFunc, function (err, newServer){              
                    if (err){
                        sendServerStartResp(res, false, err);
                        updateServerStatus(channel._id, false);
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        server = newServer;
                    }
                });
            } else if (channel.inbound_type == 'TCP') {
                tcpListener.startTcpListener(channel, senderFunc, function(err, newServer){
                    if (err){
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        server = newServer;
                    }                   
                });
            } else if (channel.inbound_type == 'Database reader') {
                databaseReader.startDBreader(channel, senderFunc, function(err, newtimer){
                    if (err) {
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        timer = newtimer;
                    }
                });
            } else if (channel.inbound_type == 'Web service listener'){
                webServiceListener.startWebServiceListener(channel, senderFunc, function(err, newServer){
                    if (err){
                        serverErrors.addServerError(err, channel, null, Date.now());
                        logging.Logger.error(appendChannelInfo(channel, err));
                    } else {
                        sendServerStartResp(res, true, null);
                        updateServerStatus(channel._id, true);
                        server = newServer;
                    }                   
                });               
            }
            if (channel.message_cleanup_enabled){
                messageStorageDaemon.startMessageStorageDaemon(channel);
            }
            
        })
};

exports.channel_stop = function (req, res) {
    if (timer != null) {
        console.log('clearing timer.....');
        clearInterval(timer);
        updateServerStatus(req.params.id, false);
        res.status(200).send('Stopped channel succesfully!');
    } else if (server != null) {
        server.close();
        updateServerStatus(req.params.id, false);
        res.status(200).send('Stopped server succesfully!');
    } else {
        res.status(500).send('Failed to stop the channel!');
    }

};

// Handle channel update on POST
exports.channel_update_post = function (req, res) {
    //res.send('NOT IMPLEMENTED: channel update POST');
    //req.sanitize('id').escape();
    //req.sanitize('id').trim();

    req.checkBody('name', 'name must be specified').notEmpty(); //We won't force Alphanumeric, because people might have spaces.
    req.checkBody('description', 'description must be specified').notEmpty();
    //req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();
    req.sanitize('name').escape();
    //req.sanitize('user').escape();
    req.sanitize('description').escape();
    req.sanitize('inbound_type').escape();
    req.sanitize('outbound_type').trim();
    //req.sanitize('inbound_location').trim();
    //req.sanitize('outbound_location').trim();

    var channel = new Channel(
        {
            name: req.body.name,
            user: req.body.user,
            description: req.body.description,
            inbound_type: req.body.inbound_type,
            outbound_type: req.body.outbound_type,
            inbound_location: req.body.inbound_location,
            outbound_location: req.body.outbound_location,
            http_destination: req.body.http_destination,
            move_destination: req.body.move_destination,
            post_processing_action: req.body.post_processing_action,
            copy_destination: req.body.copy_destination,
            schedule_type: req.body.schedule_type,
            schedule_interval: req.body.schedule_interval,
            schedule_unit: req.body.schedule_unit,
            sftp_host: req.body.sftp_host,
            sftp_port: req.body.sftp_port,
            sftp_username: req.body.sftp_username,
            sftp_password: req.body.sftp_password,
            sftp_path: req.body.sftp_path,
            sftp_private_key: req.body.sftp_private_key,
            sftp_auth_type: req.body.sftp_auth_type,
            http_port: req.body.http_port,
            https_privateKey: req.body.https_privateKey,
            https_certificate: req.body.https_certificate,
            https_port: req.body.https_port,
            https_dest_host: req.body.https_dest_host,
            https_dest_port: req.body.https_dest_port,
            https_dest_method: req.body.https_dest_method,
            https_dest_cert: req.body.https_dest_cert,
            https_dest_ca: req.body.https_dest_ca,
            sftp_dest_host: req.body.sftp_dest_host,
            sftp_dest_port: req.body.sftp_dest_port,
            sftp_dest_username: req.body.sftp_dest_username,
            sftp_dest_password: req.body.sftp_dest_password,
            sftp_dest_path: req.body.sftp_dest_path,
            sftp_dest_private_key: req.body.sftp_dest_private_key,
            sftp_dest_auth_type: req.body.sftp_dest_auth_type,
            ftp_host: req.body.ftp_host,
            ftp_port: req.body.ftp_port,
            ftp_username: req.body.ftp_username,
            ftp_password: req.body.ftp_password,
            ftp_path: req.body.ftp_path,
            ftp_use_tls: req.body.ftp_use_tls,
            ftp_dest_host: req.body.ftp_dest_host,
            ftp_dest_port: req.body.ftp_dest_port,
            ftp_dest_username: req.body.ftp_dest_username,
            ftp_dest_password: req.body.ftp_dest_password,
            ftp_dest_path: req.body.ftp_dest_path,
            ftp_dest_use_tls: req.body.ftp_dest_use_tls,
            tcp_port: req.body.tcp_port,
            tcp_host: req.body.tcp_host,
            tcp_dest_port: req.body.tcp_dest_port,
            tcp_dest_host: req.body.tcp_dest_host,
            message_modifier_script: req.body.message_modifier_script,
            message_modifier_script_name: req.body.message_modifier_script_name,
            db_reader_user: req.body.db_reader_user,
            db_reader_password: req.body.db_reader_password,
            db_reader_host: req.body.db_reader_host,
            db_reader_database: req.body.db_reader_database,
            db_reader_port: req.body.db_reader_port,
            db_reader_query: req.body.db_reader_query,
            db_reader_type: req.body.db_reader_type,
            is_running: req.body.is_running,
            db_reader_post_process_query: req.body.db_reader_post_process_query,
            db_reader_use_post_process_query: req.body.db_reader_use_post_process_query,
            db_writer_user: req.body.db_writer_user,
            db_writer_password: req.body.db_writer_password,
            db_writer_host: req.body.db_writer_host,
            db_writer_database: req.body.db_writer_database,
            db_writer_port: req.body.db_writer_port,
            db_writer_query: req.body.db_writer_query,
            db_writer_type: req.body.db_writer_type,
            message_storage_limit: req.body.message_storage_limit,
            message_cleanup_enabled: req.body.message_cleanup_enabled,
            inbound_file_format: req.body.inbound_file_format,
            outbound_file_format: req.body.outbound_file_format,
            web_service_listener_port: req.body.web_service_listener_port,
            web_service_sender_wsdl: req.body.web_service_sender_wsdl,
            web_service_sender_envelope: req.body.web_service_sender_envelope,
            web_service_sender_service_url: req.body.web_service_sender_service_url,
            is_send_ack: req.body.is_send_ack,
            ack_message: req.body.ack_message,
            _id: req.params.id
        });
    var errors = req.validationErrors();

    if (errors) {
        res.status(500).send('Failed to update!');
    }
    else {
        Channel.findByIdAndUpdate(req.params.id, channel, {}, function (err, thechannel) {
            if (err) { return next(err); }
            res.status(200).send('Success!');
        });
    }
};

exports.channel_message_modifier_get = function (req, res) {
    //Channel.SomeValue.find({ _id: req.params.id }, 'message_modifier_script', function (err, messageModifier) {
      //  if (err) {
        //    res.status(500).send(err);
        //}
        //res.status(200).send(messageModifier);
    //});

    Channel.findById(req.params.id)
        .exec(function (err, channel_detail) {
            if (err) {
                res.status(500).send(err);
            }
            res.status(200).send({'script':channel_detail.message_modifier_script, 'name':channel_detail.message_modifier_script_name });
        });

}

exports.channel_message_modifier_post = function (req, res) {
    Channel.findOne({ _id: req.params.id }, function (err, channel) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        channel.message_modifier_script = req.body.message_modifier_script;
        channel.message_modifier_script_name = req.body.message_modifier_script_name;
        channel.save(function (err) {
            if (err) {
                res.status(500).send(err);
                return;
            } else {
                res.status(200).send("Succesfully updated modifier script.");
            }
        });
    });
}