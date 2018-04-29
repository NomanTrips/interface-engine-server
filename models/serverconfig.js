var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ServerConfigSchema = Schema({
  isDarkTheme: {type: Boolean, required: false},
  globalVariables: {type: Array, required: false},
});

// Virtual for book's URL
ServerConfigSchema
.virtual('url')
.get(function () {
  return '/serverconfig/' + this._id;
});

//Export model
module.exports = mongoose.model('ServerConfig', ServerConfigSchema);