var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GlobalVariableSchema = Schema({
  script: {type: String, required: true},
});

// Virtual for book's URL
GlobalVariableSchema
.virtual('url')
.get(function () {
  return '/globalvars/' + this._id;
});

//Export model
module.exports = mongoose.model('GlobalVariable', GlobalVariableSchema);