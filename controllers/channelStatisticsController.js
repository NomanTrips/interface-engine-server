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

exports.channel_stats_delete_post = function (req, res) {
    ChannelStatistics.remove({ channel: req.params.id }, function (err) {
        if (err) {
            res.status(500).send('Failed to remove channel stats.');
        } else {
            res.status(200).send('Succesfully removed channel stats.');
        }
      });
};