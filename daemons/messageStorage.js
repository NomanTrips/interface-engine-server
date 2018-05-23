var mongoose = require('mongoose');
var sizeof = require('object-sizeof');
var Message = require('../models/message');

var deleteDocument = function (){
    
}

var checkCollectionSize = function (channel, callback){
    Message.find({channel: channel})
    .exec(function (err, messages) {
        if (err) { return next(err); }
        var messagesObj = JSON.stringify(messages);
        callback(err, sizeof(messagesObj), messages);
    });
}

var recursiveRemove = function (messagesSize, storageLimit, channel, channelMessages, i){
    console.log('Recursive remove...' + i);
    var oldestMessageId = channelMessages[i]._id;
    Message.findOneAndRemove({_id: oldestMessageId}, function(err) {
        if (err) {
            console.log(err);
        }
    });
    checkCollectionSize(channel, function(err, size, messages) {
        messagesSize = size;
        if (messagesSize > (storageLimit * 1000000) && channelMessages.length > 0){ // 1000000 bytes = 1 MB
            i = i + 1;
            recursiveRemove(messagesSize, storageLimit, channel, channelMessages, i);
        }
    })

}

exports.startMessageStorageDaemon = function (channel){
    // set interval for channel message scrub interval
    setInterval(function() {
        console.log('Running message storage cleanup daemon...');
        // query messages where channel = channel
        var messagesSize = 0;
        var channelMessages = [];
        checkCollectionSize(channel, function (err, size, messages){
            console.log('messages size '+size);
            messagesSize = size;
            channelMessages = messages;
            if (messagesSize > (channel.message_storage_limit * 1000000) && channelMessages.length > 0){
                recursiveRemove(messagesSize, channel.message_storage_limit, channel, channelMessages, 0);
            }
        });

    }, 10000);

}