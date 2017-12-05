'use strict';
var Transformers = require('../models/transformer');
var messages = require('../modules/messages');

exports.runTransformers = function (message, channel, callback) {
    var transformedMessage = message;
    Transformers.find({ channel: channel._id }, 'script')
        .exec(function (err, transformers) {
            transformers.forEach(transformer => {
                console.log(transformer.script);
                eval(transformer.script);
                console.log('after eval... ' + transformedMessage);
            })
            callback(transformedMessage)
        })
}