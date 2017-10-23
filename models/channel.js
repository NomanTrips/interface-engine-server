var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelSchema = Schema({
  name: {type: String, required: true},
  user: {type: Schema.ObjectId, ref: 'User', required: true},
  description: {type: String, required: true},
  inbound_type: {type: String, required: true},
  outbound_type: {type: String, required: true},
  inbound_location: {type: String, required: true},
  outbound_location: {type: String, required: true},
});

// Virtual for book's URL
ChannelSchema
.virtual('url')
.get(function () {
  return '/channel/' + this._id;
});

//Export model
module.exports = mongoose.model('Channel', ChannelSchema);