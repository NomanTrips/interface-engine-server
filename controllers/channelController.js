'use strict';

var Channel = require('../models/channel');
var Message = require('../models/message');
var User = require('../models/user');
var ChannelInstance = require('../models/channelinstance');
var ChannelStatistics = require('../models/channelstatistics');

var async = require('async');
var http = require('http');
var _ = require('lodash');
var axios = require('axios');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all Channels
exports.channel_list = function (req, res, next) {

    Channel.find({}, 'name user description inbound_type, outbound_type, inbound_location, outbound_location')
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
    res.send('NOT IMPLEMENTED: channel create POST');
};

// Display channel delete form on GET
exports.channel_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: channel delete GET');
};

// Handle channel delete on POST
exports.channel_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: channel delete POST');
};

// Display channel update form on GET
exports.channel_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: channel update GET');
};

var fs = require('fs');

var httpPost = function (httpAddress, body, callback) {
    axios.post(httpAddress, body)
    .then(function(response) {
        callback(response);
    })
    .catch(function(error) {
        callback(error);
    });
}

var addMessageToMessageTable = function (message, channelId) {
    var messageDetail = {
        channel: channelId,
        raw_data: message,
        transformed_data: 'STUB TRANSFORMED DATA.....',
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

exports.channel_start = function (req, res) {
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
                                addMessageToMessageTable(message, channel_detail._id);
                                if (channel_detail.outbound_type == 'File directory') {
                                    var destFilePath = channel_detail.outbound_location + parseFileName(filePath);

                                    directoryMove(filePath, destFilePath, function (status) {
                                        if (status == true) {
                                            getChannelStats(channel_detail._id, updateSentMessageStat);
                                        } else {
                                            getChannelStats(channel_detail._id, updateErrorsMessageStat);
                                        }
                                    });
                                }  else if (channel_detail.outbound_type == 'http') {
                                    //mockHttpServer(9080);
                                    httpPost(channel_detail.http_destination, message, function (resp){
                                        console.log( 'mock http server resp: ' + resp.status);
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
                    addMessageToMessageTable(message, channel_detail._id);
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
                        httpPost(channel_detail.http_destination, message, function (resp){
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

            }
            res.status(200).send('Started channel succesfully!');

        });

};

exports.channel_stop = function (req, res) {
    if (timer != null) {
        console.log('clearing timer.....');
        clearInterval(timer);
        res.status(200).send('Stopped channel succesfully!');
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