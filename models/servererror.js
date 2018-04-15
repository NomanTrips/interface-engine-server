var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ServerErrorSchema = Schema({
  err: {type: String, required: true},
  channel: {type: Schema.ObjectId, ref: 'Channel', required: false},
  type: {type: String, required: false},
  timestamp: {type: Date, required: false},
});

// Virtual for book's URL
ServerErrorSchema
.virtual('url')
.get(function () {
  return '/servererror/' + this._id;
});

//Export model
module.exports = mongoose.model('ServerError', ServerErrorSchema);