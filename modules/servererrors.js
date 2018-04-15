'use strict';
var ServerError = require('../models/servererror');

exports.addServerError = function (err, channel, type, timestamp) {
    var errDetail = {
        err: err,
        channel: channel._id,
        type: type,
        timestamp: timestamp,
    }
    var servererror = new ServerError(errDetail);
    servererror.save(function (err, success) {
        if (err) {
            console.log(err);
        } else {
            console.log('Saved server error.');
        }
    });
}