var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelStatisticsSchema = Schema({
  channel: {type: Schema.ObjectId, ref: 'Channel', required: true},
  received: {type: Number, required: true},
  sent: {type: Number, required: true},
  error_count: {type: Number, required: true},
});

// Virtual for book's URL
ChannelStatisticsSchema
.virtual('url')
.get(function () {
  return '/channelstatistics/' + this._id;
});

//Export model
module.exports = mongoose.model('ChannelStatistics', ChannelStatisticsSchema);