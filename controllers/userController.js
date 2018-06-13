var User = require('../models/user');
var passport = require('passport');

exports.user_login_post = function(req, res) {
    //console.log("body parsing", req.body);
    passport.authenticate('local',{ failureRedirect: '/loginfailed' })(req, res, function () {
        //res.redirect('/loginsuccess');
        res.status(200).send('login successful');
      });
};

exports.user_logout_post = function(req, res) {
    res.send('NOT IMPLEMENTED: User detail: ' + req.params.id);
};

// Display User create form on GET
exports.user_profile_get = function(req, res) {
    res.send('NOT IMPLEMENTED: User create GET');
};

exports.user_create_post = function(req, res) {
    User.register(new User({ username : req.body.username, name: req.body.name }), req.body.password, function(err, user) {
        if (err) {
          return res.status(500).send('Err: ' + err);
        }
    
        passport.authenticate('local')(req, res, function () {
            res.status(200).send('User account created: ' + user.username);
        });
      });

};
