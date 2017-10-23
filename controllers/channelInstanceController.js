var ChannelInstance = require('../models/channelinstance');

// Display list of all ChannelInstance
exports.channelinstance_list = function(req, res) {
    ChannelInstance.find({}, 'channel status ')
    .populate('channel')
    .exec(function (err, list_channel_instances) {
      if (err) { return next(err); }
      //Successful, so render
      res.json(list_channel_instances);
    });
};

// Display detail page for a specific ChannelInstance
exports.channelinstance_detail = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance detail');
};

// Display ChannelInstance create form on GET
exports.channelinstance_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance create GET');
};

// Handle ChannelInstance create on POST
exports.channelinstance_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance create POST');
};

// Display ChannelInstance delete form on GET
exports.channelinstance_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance delete GET');
};

// Handle ChannelInstance delete on POST
exports.channelinstance_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance delete POST');
};

// Display ChannelInstance update form on GET
exports.channelinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance update GET');
};

// Handle ChannelInstance update on POST
exports.channelinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: ChannelInstance update on POST');
};