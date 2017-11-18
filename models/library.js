var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var LibrarySchema = Schema({
  name: {type: String, required: true},
  description: {type: String, required: false},
});

// Virtual for book's URL
LibrarySchema
.virtual('url')
.get(function () {
  return '/library/' + this._id;
});

//Export model
module.exports = mongoose.model('Library', LibrarySchema);