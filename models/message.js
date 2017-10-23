var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelSchema = Schema({
  channel: {type: Schema.ObjectId, ref: 'Channel', required: true},
  raw_data: {type: String, required: true},
  transformed_data: {type: String, required: true},
});

// Virtual for book's URL
ChannelSchema
.virtual('url')
.get(function () {
  return '/message/' + this._id;
});

//Export model
module.exports = mongoose.model('Message', ChannelSchema);