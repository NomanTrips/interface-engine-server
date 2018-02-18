var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScriptTemplatesSchema = Schema({
  name: {type: String, required: true},
  script: {type: String, required: false},
});

// Virtual for book's URL
ScriptTemplatesSchema
.virtual('url')
.get(function () {
  return '/scripttemplates/' + this._id;
});

//Export model
module.exports = mongoose.model('ScriptTemplates', ScriptTemplatesSchema);