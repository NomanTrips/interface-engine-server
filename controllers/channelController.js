'use strict';

var Channel = require('../models/channel');
var Message = require('../models/message');
var User = require('../models/user');
var ChannelInstance = require('../models/channelinstance');
var ChannelStatistics = require('../models/channelstatistics');

var async = require('async');
var http = require('http');

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

// Display detail page for a specific boochannelk
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
var logTheError = function (err) {
    console.log(err);
}

var mover = function (oldPath, newPath, channelId) {
    var received = 0;
    var errors = 0;
    var sent = 0;

    fs.readdir(oldPath, (err, files) => {
        files.forEach(file => {
            var oldPathWithFileName = oldPath + file;
            var newPathWithFileName = newPath + file;
            var fileContents = '';

            fs.readFile(oldPathWithFileName, 'utf8', function (err, data) {
                if (err) {
                    return console.log(err);
                } else { // save message about file
                    received = 1;
                    fileContents = data;

                    messageDetail = {
                        channel: channelId,
                        raw_data: fileContents,
                        transformed_data: 'STUB TRANSFORMED DATA.....',
                    }
                    var message = new Message(messageDetail);
                    message.save(function (err) {
                        if (err) {
                            console.log(err);
                            //cb(err, null)
                            return
                        }
                        console.log('New Message added: ' + message);
                        //cb(null, message)
                    });

                    fs.rename(oldPathWithFileName, newPathWithFileName, function (err) {
                        if (err) {
                            errors = 1;
                            if (err.code === 'EXDEV') {
                                copy();
                            } else {
                                //callback(err);
                                console.log(err);
                            }
                            return;
                        } else { // file moved succesfully 
                            sent = 1;

                            ChannelStatistics.findOne({ channel: channelId }, 'channel received sent error_count')
                                .populate('channel')
                                .exec(function (err, channel_stats) {
                                    //var channelStats;
                                    if (err) { return next(err); }
                                    //Successful, so render
                                    if (channel_stats != null) {
                                        console.log('found our stats');
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

                                    } else { // no stats for the channel yet... create them and save...
                                        channelStats = {
                                            channel: channelId,
                                            sent: sent,
                                            received: received,
                                            error_count: errors
                                        }
                                        var stats = new ChannelStatistics(channelStats);
                                        stats.save(function (err, statObj) {
                                            if (err) {
                                                console.log(err);
                                                //cb(err, null)
                                                return
                                            }
                                            console.log('Created stats in db: ' + statObj);
                                            //cb(null, message)
                                        });
                                    }
                                })
                        }
                    });
                }

            });

        });
    })

    /** 
function copy() {
    var readStream = fs.createReadStream(oldPathWithFileName);
    var writeStream = fs.createWriteStream(newPathWithFileName);
 
    readStream.on('error', console.log('error or readStream'));
    writeStream.on('error', console.log('error or writeStream'));
 
    readStream.on('close', function () {
        fs.unlink(oldPath, console.log('fs unlink'));
    });
 
    readStream.pipe(writeStream);
}
*/
}
var readMessage = function () {

}

var addMessageToMessageTable = function (message, channelId) {
    var messageDetail = {
        channel: channelId,
        raw_data: message,
        transformed_data: 'STUB TRANSFORMED DATA.....',
    }
    var message = new Message(messageDetail);
    message.save(function (err) {
        if (err) {
            console.log(err);
            //cb(err, null)
            return
        }
        console.log('New Message added: ' + message);
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

var timer = null;

var moveFile = function (inbound_path, outbound_path) {
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

exports.channel_start = function (req, res) {
    console.log('running start...');
    // get channel in db via req id
    Channel.findById(req.params.id)
        .exec(function (err, channel_detail) {
            if (err) {
                return next(err);
                res.status(500).send('Failed to start the channel!');
            }
            // Successful find, so attempt to start the process -- start job
            if (channel_detail.inbound_type == 'File directory') {
                var inbound_path = channel_detail.inbound_location;
                console.log(inbound_path);
                var outbound_path = channel_detail.outbound_location;
                timer = setInterval(mover, 30000, inbound_path, outbound_path, req.params.id);
                res.status(200).send('Started channel succesfully!');
            } else if (channel_detail.inbound_type == 'http') {

                http.createServer(function (req, res) {
                    console.log(req.data);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write('Success!');
                    res.end();

                    let body = [];
                    req.on('data', (chunk) => {
                        body.push(chunk);
                    }).on('end', () => {
                        body = Buffer.concat(body).toString();
                        // at this point, `body` has the entire request body stored in it as a string
                        console.log('da body: ' + body);
                        if (channel_detail.outbound_type == 'http'){
                            httpTransfer(body, channel_detail.outbound_location, channel_detail._id);
                        } else if (channel_detail.inbound_type == 'File directory') {
    
                        }
                    });

                    

                }).listen(9090);
                res.status(200).send('Started http channel succesfully!');
            }

        });

    // if success set db status to started and return success
    // if fail send error to client
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
            _id: req.params.id
        });
    var errors = req.validationErrors();

    if (errors) {
        res.status(500).send('Failed to update!');
        //Channel.find({},'title')
        //.exec(function (err, books) {
        //if (err) { return next(err); }
        //Successful, so render
        //res.render('bookinstance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors, bookinstance:bookinstance });
        //});
        //return;
    }
    else {
        // Data from form is valid
        Channel.findByIdAndUpdate(req.params.id, channel, {}, function (err, thechannel) {
            if (err) { return next(err); }
            //successful - redirect to genre detail page.
            //res.redirect(thechannel.url);
            res.status(200).send('Success!');
        });
    }
};