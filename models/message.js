var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelSchema = Schema({
  channel: {type: Schema.ObjectId, ref: 'Channel', required: true},
  raw_data: {type: {}, required: false},
  transformed_data: {type: String, required: false},
  received_date: {type: Date, required: false},
  status: {type: String, required: false},
  err: {type: String, required: false},
});

// Virtual for book's URL
ChannelSchema
.virtual('url')
.get(function () {
  return '/message/' + this._id;
});

//Export model
module.exports = mongoose.model('Message', ChannelSchema);