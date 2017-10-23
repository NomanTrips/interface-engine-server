var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    username: {type: String, required: true, max: 100},
    password: {type: String, required: true, max: 100}
  }
);

// Virtual for user's full name
UserSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for user's URL
UserSchema
.virtual('url')
.get(function () {
  return '/user/' + this._id;
});

//Export model
module.exports = mongoose.model('User', UserSchema);