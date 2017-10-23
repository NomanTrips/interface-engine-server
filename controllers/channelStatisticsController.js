var ChannelStatistics = require('../models/channelstatistics');

// Display list of all ChannelInstance
exports.channel_stats_get = function(req, res) {
    console.log('stat grab');
    console.log(req.params.id);
    ChannelStatistics.find({channel: req.params.id}, 'sent received error_count')
    //.populate('channel')
    .exec(function (err, stats) {
        if (err) { return next(err); }
        //Successful, so render
        res.json(stats);
    });
};