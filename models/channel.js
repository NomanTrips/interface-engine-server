var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelSchema = Schema({
  name: {type: String, required: true},
  user: {type: Schema.ObjectId, ref: 'User', required: false},
  description: {type: String, required: true},
  inbound_type: {type: String, required: true},
  outbound_type: {type: String, required: true},
  inbound_location: {type: String, required: true},
  outbound_location: {type: String, required: true},
  http_destination: {type: String, required: false},
  move_destination: {type: String, required: false},
  post_processing_action: {type: String, required: false},
  copy_destination: {type: String, required: false},
  schedule_type: {type: String, required: false},
  schedule_interval: {type: String, required: false},
  schedule_unit: {type: String, required: false},
  status: {type: String, required: false}, 
});

// Virtual for book's URL
ChannelSchema
.virtual('url')
.get(function () {
  return '/channel/' + this._id;
});

//Export model
module.exports = mongoose.model('Channel', ChannelSchema);