'use strict';
var Message = require('../models/message');

exports.addMessageToMessageTable = function (channel, rawData, transformedData, status, err, callback) {
    console.log('being args');
    console.log(status);
    console.log(err);
    var messageDetail = {
        channel: channel._id,
        raw_data: rawData,
        transformed_data: transformedData,
        received_date: Date.now(),
        status: status,
        err: err
    }
    var message = new Message(messageDetail);
    message.save(function (err, newmessage) {
        if (err) {
            callback(err, null)
        } else {
            callback(null, newmessage);
        }
    });
}

exports.updateMessage = function(message, callback) {
    Message.findByIdAndUpdate(message._id, message, {new: true}, function (err, updatedMessage) {
        if (err) {
            console.log(err);
            callback(err, null)
            return
        } else {
            callback(null, updatedMessage);
        }

    });
}