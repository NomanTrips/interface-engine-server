var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelInstanceSchema = Schema({
  channel: { type: Schema.ObjectId, ref: 'Channel', required: true }, //reference to the associated channel
  status: {type: String, required: true, enum: ['Running', 'Stopped', 'Processing', 'Paused'], default: 'Running'},
  received: {type: Number, required: true},
  sent: {type: Number, required: true},
  error_count: {type: Number, required: true},
});

// Virtual for bookinstance's URL
ChannelInstanceSchema
.virtual('url')
.get(function () {
  return '/channelinstance/' + this._id;
});

//Export model
module.exports = mongoose.model('ChannelInstance', ChannelInstanceSchema);