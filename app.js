var express = require('express');

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb://admin:waterbury@127.0.0.1/INTERFACE_ENGINE';
mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var index = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog');  //Import routes for "catalog" area of site

var channelController = require('./controllers/channelController');
var Channel = require('./models/channel');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator() ); // Add this after the bodyParser middleware!
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);  // Add catalog routes to middleware chain.

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
        channelController.channel_start({'params':{'id':channel._id}});
      }
    })
  })

module.exports = app;
