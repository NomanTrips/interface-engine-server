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
            var error = null;
            try {
                eval(channel_detail.message_modifier_script); 
            } catch (err) {
                console.log('---catch error' + err);
                error = err
            }
            callback(error, modifiedMessage)
            //eval(channel_detail.message_modifier_script);
            
        })
}