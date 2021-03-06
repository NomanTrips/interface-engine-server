var User = require('../models/user');
var passport = require('passport');
const jwt = require('jsonwebtoken');
//var auth = require('../modules/passport');


exports.list_users_get = function(req, res){
    User.find({})
    .exec(function (err, list_users) {
        if (err) { return next(err); }
        res.json(list_users);
    });
}

exports.user_authenticate_token = function(req, res){
    //console.log(req.headers);
    passport.authenticate('jwt', { session: false }),
    function(req, res) {
        res.send('token authed...');
    }
    /*
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
        console.log('09');
        if (err) {
            return res.status(400).send(err);
        }
        res.status(200).send('Token authenticated successfully.');
    });
    */
    }

exports.user_login_post = function(req, res) {
    console.log('runnin login post');
    /*
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user) {
            res.status(400).send(err);
            //return res.status(400).json({
            //    message: 'Login error.',
            //    user   : user
            //});
        }
       req.login(user, {session: false}, (err) => {
           if (err) {
               res.send(err);
           }
           // generate a signed json web token with the contents of user object and return it in the response
           const token = jwt.sign(user, 'your_jwt_secret');
           return res.json({user, token});
        });
    })(req, res);
    */
    
    passport.authenticate('local',{ session: false, failureRedirect: '/loginfailed' })(req, res, function () {
        //res.redirect('/loginsuccess');
        //var user = req.user;
        //console.log('40: '+req.user);
        req.login(req.user, {session: false}, (err) => {
            if (err) {
                console.log( 'de error' + err);
                res.send(err);
            }
            //console.log(req.user);
            console.log(req.user._doc);
            if (req.user._doc.is_active == false) {             
                res.status(401).send('User account is inactive.');
            } else {
            // generate a signed json web token with the contents of user object and return it in the response
            //console.log(req.user);
            //const token = jwt.sign(req.user.toJSON(), 'secret');
            var secretOrKey = 'secret';
            var payload = {};
            payload.iss = 'accounts.examplesoft.com';
            payload.aud= 'yoursite.net';
            payload.id = req.user._id;
            //var token = jwt.sign(payload, secretOrKey, { expiresIn: '2 days' });
            //console.log(token);
            //return res.json({user, token});
            //res.status(200).send({user: req.user.username, token: token});
            const body = { _id : req.user._id };
            //Sign the JWT token and populate the payload with the user email and id
            const token = jwt.sign({ user : body },'top_secret');
            //Send back the token to the user
            return res.json({ token });
            }

         });
        //res.status(200).send('login successful');
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

exports.update_user_post = function(req, res) {
    var userdetails = new User(
        {
            hash: req.body.hash,
            salt: req.body.salt,
            channel_permissions: req.body.channel_permissions,
            username: req.body.username,
            is_active: req.body.is_active,
            is_admin: req.body.is_admin,
            _id: req.body._id
        })
    User.findByIdAndUpdate(req.params.id, userdetails, {}, function (err, theuser) {
        if (err) { 
            console.log(err);
            res.status(500).send(err);
        }
        res.status(200).send('Success!');
    });
};

exports.user_set_password = function(req, res){
    User.findByUsername(req.body.user.username).then(function(sanitizedUser) {
        if (sanitizedUser) {
            sanitizedUser.setPassword(req.body.newPass, function() {
                sanitizedUser.save();
                res.send('password reset successful');
            });
        } else {
            res.send('user does not exist');
        }
    }, function(err) {
        console.error(err);
    })
}

exports.getUser = function(userid, callback){
    User.findById(userid)
        .exec(function (err, userdetails) {
            if (err) {
                console.log(err);
            }
            callback(err, userdetails);
        });
}

exports.user_channel_permissions_get = function(userid, callback) {
    //req.user.username
    //console.log('printing the id: ' + req.user._id);
    User.findById(userid)
        .exec(function (err, userdetails) {
            if (err) {
                console.log(err);
            }
            var permissions = userdetails.channel_permissions;
            callback(permissions);
        });
}

