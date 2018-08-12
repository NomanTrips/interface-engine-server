var express = require('express');

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb://admin:waterbury@127.0.0.1/INTERFACE_ENGINE?authSource=admin';
mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//const passportJWT = require("passport-jwt");
//const JwtStrategy   = passportJWT.Strategy;
//const ExtractJwt = passportJWT.ExtractJwt;

//var JWTStrategy = require('passport-jwt').Strategy,
//ExtractJWT = require('passport-jwt').ExtractJwt;

var passportJWT = require('passport-jwt');
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var index = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog');  //Import routes for "catalog" area of site

var channelController = require('./controllers/channelController');
var Channel = require('./models/channel');
var app = express();

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //res.header("Content-Type", "*");
  //res.header("Content-type", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
/*
  console.log(req.url);
  if (req.url != '/catalog/login'){
    console.log('getting to auth...');
    passport.authenticate('jwt', { session: false }),
    function(req, res) {
      next();
    }
  } else {
    next(); 
  }
*/
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser);
app.use(expressValidator() ); // Add this after the bodyParser middleware!
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);  // Add catalog routes to middleware chain.



app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
//app.use(passport.initialize());
//app.use(passport.session());

var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const JWTstrategy = require('passport-jwt').Strategy;
//We use this to extract the JWT sent by the user
const ExtractJWT = require('passport-jwt').ExtractJwt;

//This verifies that the token sent by the user is valid
passport.use(new JWTstrategy({
  //secret we used to sign our JWT
  secretOrKey : 'top_secret',
  //we expect the user to send the token as a query paramater with the name 'secret_token'
  jwtFromRequest : ExtractJWT.fromUrlQueryParameter('secret_token')
}, async (token, done) => {
  try {
    //Pass the user details to the next middleware
    return done(null, token.user);
  } catch (error) {
    done(error);
  }
}));


/*
var JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
opts.issuer = 'accounts.examplesoft.com';
opts.audience = 'yoursite.net';
opts.ignoreExpiration = true;
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  console.log('running the find.................');
User.findOne({id: jwt_payload.id}, function(err, user) {
    if (err) {
        return done(err, false);
    }
    if (user) {
        return done(null, user);
    } else {
        return done(null, false);
        // or you could create a new account
    }
});
}));
*/

/*
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey   : 'your_jwt_secret'
},
function (jwtPayload, cb) {
  cb(null, user);
}
));
*/

/*
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';
opts.issuer = 'accounts.examplesoft.com';
opts.audience = 'yoursite.net';
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  console.log('running jwt check');
    User.findOne({id: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
          console.log('the user');
            return done(null, user);
        } else {
            console.log('the else');
            return done(null, false);
            // or you could create a new account
        }
    });
}));
*/
/*
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'tasmanianDevil';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  User.findOneById(jwt_payload.id)
  .then(user => {
      return cb(null, user);
  })
  .catch(err => {
      return cb(err);
  });
});

passport.use(strategy);
*/
/*
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),//ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey   : 'jwt_secret_key'
},
function (jwtPayload, cb) {
  console.log('jwtPayload', jwtPayload)
}
));
*/
/*
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : 'secret'
    },
    function (jwtPayload, cb) {
      console.log('passport config code going...');
        //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
        return User.findOneById(jwtPayload.id)
            .then(user => {
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
    }
));
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
/*
const fs = require('fs');
fs.unlink('C:/Users/user/Desktop/express-library/express-locallibrary-tutorial/tmp/hello.txt', (err) => {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});
*/

// start any channels that should be running
Channel.find()
  .exec(function (err, channels) {
    channels.forEach(channel => {
      if (channel.is_running) {
        channelController.channel_start({'params':{'id':channel._id}}, null);
      }
    })
  })

module.exports = app;