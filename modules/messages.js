'use strict';
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var Message = require('../models/message');

// Take raw message from listener and run tranformers on it
// Send output to writer func (file sender, db writer etc.)
exports.messageReceived = function (rawMessage, channel, senderFunc, callback) {
    var thisModule = this;
    channelStats.getChannelStats(channel, channelStats.updateReceivedMessageStat);
    // write message to messages table
    //console.log('the raw message ' +  rawMessage);
    thisModule.addMessageToMessageTable(channel, rawMessage, null, 'Received', null, function (err, newMessage) {
        transformers.runTransformers(rawMessage, channel, function (err, transformedMessage) {
            if (err) {
                newMessage.status = 'Transformer error';
                newMessage.err = err;
                thisModule.updateMessage(newMessage, function (err, updatedMessage) {
                })
                callback(err, null);
            } else {
                newMessage.status = 'Transformed';
                newMessage.transformed_data = transformedMessage;
                thisModule.updateMessage(newMessage, function (err, updatedMessage) {
                    senderFunc(transformedMessage, channel, null, updatedMessage)
                })
                callback(null, newMessage);
            }

        })
    });
}

exports.addMessageToMessageTable = function (channel, rawData, transformedData, status, err, callback) {
    console.log('Raw data');
    console.log(rawData);
    console.log('endRaw data---------');
    var messageDetail = {
        channel: channel._id,
        raw_data: rawData,
        transformed_data: transformedData,
        received_date: Date.now(),
        status: status,
        err: err,
        inbound_file_format: channel.inbound_file_format,
        outbound_file_format: channel.outbound_file_format,
    }
    var message = new Message(messageDetail);
    message.save(function (err, newmessage) {
        if (err) {
            console.log(err);
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