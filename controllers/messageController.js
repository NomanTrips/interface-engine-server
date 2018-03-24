var Channel = require('../models/channel');
var Message = require('../models/message');

var async = require('async');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

// Display list of all Channels
exports.message_list = function (req, res, next) {

    Message.find({channel: req.query.channel}, 'raw_data transformed_data received_date status')
        //.populate('channel')
        .exec(function (err, list_messages) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_messages);
        });

};

// Display detail page for a specific message
exports.message_detail = function (req, res) {

    Message.findById(req.params.id)
        .populate('channel')
        .exec(function (err, message_detail) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(message_detail);
        });

};

// Display message delete form on GET
exports.message_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete GET');
};

// Handle message delete on POST
exports.message_delete_post = function (req, res) {
    Message.remove({ channel: req.params.channelId }, function (err) {
        if (err) {
            res.status(500).send('Failed to remove messages.');
        } else {
            res.status(200).send('Succesfully removed messages.');
        }
      });
};