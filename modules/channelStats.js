'use strict';
var ChannelStatistics = require('../models/channelstatistics');

exports.updateReceivedMessageStat = function (messageStats) {
    ChannelStatistics.update({ _id: messageStats._id }, {
        received: messageStats.received + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

exports.updateSentMessageStat = function (messageStats) {
    ChannelStatistics.update({ _id: messageStats._id }, {
        sent: messageStats.sent + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

exports.updateErrorsMessageStat = function (messageStats) {
    ChannelStatistics.update({ _id: messageStats._id }, {
        error_count: messageStats.error_count + 1
    }, function (err, affected, resp) {
        console.log(resp);
    })
}

exports.getChannelStats = function (channel, callback) {
    ChannelStatistics.find({ channel: channel._id }, 'received sent error_count')
        .exec(function (err, message_stats) {
            if (err) { return next(err); }
            callback(message_stats[0]);
        })
}