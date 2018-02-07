'use strict';
var Channel = require('../models/channel');
var messages = require('../modules/messages');

exports.runTransformers = function (message, channel, callback) {
    var modifiedMessage = '';
    Channel.findById(channel._id)
        .exec(function (err, channel_detail) {
            //transformers.forEach(transformer => {
             //   console.log(transformer.script);
             //   eval(transformer.script);
             //   console.log('after eval... ' + transformedMessage);
            //})
            eval(channel_detail.message_modifier_script);
            callback(modifiedMessage)
        })
}