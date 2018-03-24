'use strict';
var Message = require('../models/message');

exports.addMessageToMessageTable = function (message, transformedMessage, channel, status, err, callback) {
    var messageDetail = {
        channel: channel._id,
        raw_data: message,
        transformed_data: transformedMessage,
        received_date: Date.now(),
        status: status,
        err: err
    }
    var message = new Message(messageDetail);
    message.save(function (err, message) {
        if (err) {
            console.log(err);
            callback(err, null)
            return
        }
        console.log('New Message added');
        callback(null, message);
    });
}

exports.updateMessage = function(message, callback) {
    console.log('update running ' + message);
    console.dir(message);
    Message.findByIdAndUpdate(message._id, message, {}, function (err, updatedMessage) {
        if (err) {
            console.log(err);
            callback(err, null)
            return
        }
        console.log('Updated message');
        callback(null, updatedMessage);
    });
}