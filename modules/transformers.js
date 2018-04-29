'use strict';
var Channel = require('../models/channel');
var messages = require('../modules/messages');

exports.runTransformers = function (message, channel, callback) {
    var modifiedMessage = '';
    Channel.findById(channel._id)
        .exec(function (err, channel_detail) {
            var error = null;
            try {
                eval(channel_detail.message_modifier_script); 
            } catch (err) {
                console.log('---catch error' + err);
                callback(error, modifiedMessage)
                error = err
            } finally {
                if (error == null){
                    callback(null, modifiedMessage)
                }
            }
            
        })
}