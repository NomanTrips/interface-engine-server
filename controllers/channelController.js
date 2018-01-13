'use strict';

var Channel = require('../models/channel');
var Message = require('../models/message');
var User = require('../models/user');
var ChannelInstance = require('../models/channelinstance');
var ChannelStatistics = require('../models/channelstatistics');
var Transformers = require('../models/transformer');

var fileReader = require('../modules/fileReader');
var httpListener = require('../modules/httpListener');
var httpsListener = require('../modules/httpsListener');

var fileSender = require('../modules/fileSender');
var httpSender = require('../modules/httpSender');
var httpsSender = require('../modules/httpsSender');

var async = require('async');
var http = require('http');
var _ = require('lodash');
var axios = require('axios');
//var libxmljs = require('libxmljs');
//var parseString = require('xml2js').parseString;

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all Channels
exports.channel_list = function (req, res, next) {

    Channel.find({}, 'name user description inbound_type, outbound_type, inbound_location, outbound_location, status')
        .populate('user')
        .exec(function (err, list_channels) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_channels);
        });

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
    var channel = new Channel ({
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
    Channel.remove({ _id: req.params.id }, function(err) {
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

exports.channel_start = function (req, res) {
    console.log(req.params.id);
    Channel.findById(req.params.id)
    .exec(function (err, channel) {

        Channel.update({ _id: channel._id }, {
            status: 'Running'
        }, function (err, affected, resp) {
            console.log(resp);
        })

        var senderFunc;
        
        if (channel.outbound_type == 'File directory') {
            senderFunc = fileSender.FileSender;
        } else if (channel.outbound_type == 'http') {
            senderFunc = httpSender.httpSender;
        } else if (channel.outbound_type == 'https') {
            senderFunc = httpsSender.httpsSender;
        } else if (channel.outbound_type == 'SFTP'){
            senderFunc = fileSender.writeToSFTP;
        }

        if (channel.inbound_type == 'File directory' || channel.inbound_type == 'SFTP' || channel.inbound_type == 'FTP') {
            timer = fileReader.startFileReader(channel, senderFunc);
        } else if (channel.inbound_type == 'http') {
            httpListener.startHttpListener(channel, senderFunc);
        } else if (channel.inbound_type == 'https') {
            server = httpsListener.startHttpsListener(channel, senderFunc);
        }
    })
    /*
    Channel.findById(req.params.id)
        .exec(function (err, channel_detail) {
            if (err) {
                return next(err);
                res.status(500).send('Failed to start the channel!');
            }

            if (channel_detail.inbound_type == 'File directory') {
                timer - setInterval(function () {

                    directoryRead(channel_detail.inbound_location, function (filePaths) {
                        filePaths.forEach(filePath => {
                            fileRead(filePath, function (message) {
                                getChannelStats(channel_detail._id, updateReceivedMessageStat);
                                // write message to messages table

                                runTransformers(message, channel_detail._id, function (transformedMessage) {
                                    addMessageToMessageTable(message, transformedMessage, channel_detail._id);
                                    if (channel_detail.outbound_type == 'File directory') {
                                        var destFilePath = channel_detail.outbound_location + parseFileName(filePath);

                                        writeFile(destFilePath, transformedMessage, function (success) {
                                            if (success) {
                                                getChannelStats(channel_detail._id, updateSentMessageStat);
                                            } else {
                                                getChannelStats(channel_detail._id, updateErrorsMessageStat);
                                            }
                                        })

                                    } else if (channel_detail.outbound_type == 'http') {
                                        mockHttpServer(9080);
                                        httpPost(channel_detail.http_destination, transformedMessage, function (resp) {
                                            if (resp.status == 200) {
                                                getChannelStats(channel_detail._id, updateSentMessageStat);
                                                console.log('http client sent the message...');
                                            } else {
                                                console.log(resp);
                                                getChannelStats(channel_detail._id, updateErrorsMessageStat);
                                            }
                                        });

                                    }
                                });
                            })
                            if (channel_detail.post_processing_action == 'delete') {
                                deleteFile(filePath, function (success) {

                                });
                            } else if (channel_detail.post_processing_action == 'move') {
                                moveFile(filePath, (channel_detail.move_destination + parseFileName(filePath)), function (success) {

                                });
                            } else if (channel_detail.post_processing_action == 'copy') {
                                copyFile(filePath, (channel_detail.copy_destination + parseFileName(filePath)), function (success) {

                                });
                            }
                        })

                    })
                },
                    10000
                );
            }

            if (channel_detail.inbound_type == 'http') {
                // mock http server for testing
                //createHttpListener(9080, function () {
                //    console.log('starting the mock server...');
                //});

                // start the http listener
                createHttpListener(9090, function (message) {
                    getChannelStats(channel_detail._id, updateReceivedMessageStat);

                    runTransformers(message, channel_detail._id, function (transformedMessage) {
                        addMessageToMessageTable(message, transformedMessage, channel_detail._id);
                        if (channel_detail.outbound_type == 'File directory') {
                            var destFilePath = channel_detail.outbound_location + Date.now();
                            fs.writeFile(destFilePath, message, function (err) {
                                if (err) {
                                    getChannelStats(channel_detail._id, updateErrorsMessageStat)
                                    return console.log(err);
                                }
                                getChannelStats(channel_detail._id, updateSentMessageStat)
                                console.log("Wrote the http stream to file.");
                            });
                        } else if (channel_detail.outbound_type == 'http') {
                            httpPost(channel_detail.http_destination, message, function (resp) {
                                if (resp.status == 200) {
                                    getChannelStats(channel_detail._id, updateSentMessageStat);
                                    console.log('http client sent the message...');
                                } else {
                                    console.log(resp);
                                    getChannelStats(channel_detail._id, updateErrorsMessageStat);
                                }
                            });
                        }
                    })
                });

            }
            res.status(200).send('Started channel succesfully!');

        });
*/
};

exports.channel_stop = function (req, res) {
    
    Channel.update({ _id: req.params.id }, {
        status: 'Stopped'
    }, function (err, affected, resp) {
        console.log(resp);
    })

    if (timer != null) {
        console.log('clearing timer.....');
        clearInterval(timer);
        res.status(200).send('Stopped channel succesfully!');
    } else if (server != null) {
        server.close();
        res.status(200).send('Stopped https server succesfully!');
    } else {
        res.status(500).send('Failed to stop the channel!');
    }

};

// Handle channel update on POST
exports.channel_update_post = function (req, res) {
    console.log('running');
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