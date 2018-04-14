var Channel = require('../models/channel');
var ServerError = require('../models/servererror');

var async = require('async');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

exports.server_error_list = function (req, res, next) {
    ServerError.find({}, 'err channel type')
        //.populate('channel')
        .exec(function (err, list_errors) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_errors);
        });
};

// Display message delete form on GET
exports.server_error_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete GET');
};

// Handle message delete on POST
exports.server_error_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete POST');
};