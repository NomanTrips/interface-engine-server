var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TransformerSchema = Schema({
  channel: {type: Schema.ObjectId, ref: 'Channel', required: true},
  title: {type: String, required: true},
  script: {type: String, required: false},
});

// Virtual for book's URL
TransformerSchema
.virtual('url')
.get(function () {
  return '/transformer/' + this._id;
});

//Export model
module.exports = mongoose.model('Transformer', TransformerSchema);