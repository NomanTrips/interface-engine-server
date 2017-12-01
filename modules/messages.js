'use strict';
var Message = require('../models/message');

exports.addMessageToMessageTable = function (message, transformedMessage, channel) {
    var messageDetail = {
        channel: channel._id,
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