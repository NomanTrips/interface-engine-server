'use strict';
var Channel = require('../models/channel');
var messages = require('../modules/messages');
var GlobalVars = require('../models/globalvars');

var getGlobalVars = function (callback){
    GlobalVars.findOne({}, function (err, globals) {
        if (err) {
            callback(err, null); 
        } else {
            callback(null, globals);
        }
    });
}

exports.runTransformers = function (message, channel, callback) {
    var modifiedMessage = '';
    getGlobalVars(function (err, globals){
        if (err){
            callback(error, modifiedMessage)
        } else {
            Channel.findById(channel._id)
            .exec(function (err, channel_detail) {
                var error = null;
                try {
                    var script = globals.script.concat(channel_detail.message_modifier_script); // add global vars script to xformer script
                    eval(script);
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
    })

}