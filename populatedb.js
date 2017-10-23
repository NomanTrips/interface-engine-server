#! /usr/bin/env node

console.log('This script populates a some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

//Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}

var async = require('async')
var Channel = require('./models/channel')
var User = require('./models/user')
var ChannelInstance = require('./models/channelinstance')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB);
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = []
var channels = []
var channelinstances = []


function userCreate(first_name, family_name, username, password, cb) {
  userdetail = {first_name:first_name , family_name: family_name, username: username, password: password, }
  
  var user = new User(userdetail);
       
  user.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New User: ' + user);
    users.push(user)
    cb(null, user)
  }  );
}

function channelCreate(name, user, description, inbound_type, outbound_type, inbound_location, outbound_location, cb) {
  channeldetail = { 
    name: name,
    user: user,
    description: description,
    inbound_type: inbound_type,
    outbound_type: outbound_type,
    inbound_location: inbound_location,
    outbound_location: outbound_location
  }
    
  var channel = new Channel(channeldetail);    
  channel.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New Channel: ' + channel);
    channels.push(channel)
    cb(null, channel)
  }  );
}


function channelInstanceCreate(channel, status, received, sent, error_count, cb) {
  channelinstancedetail = {
    channel: channel,
    status: status,
    received: received,
    sent: sent,
    error_count: error_count
  }    
  if (status != false) channelinstancedetail.status = status
    
  var channelinstance = new ChannelInstance(channelinstancedetail);    
  channelinstance.save(function (err) {
    if (err) {
      console.log('ERROR CREATING ChannelInstance: ' + channelinstance);
      cb(err, null)
      return
    }
    console.log('New ChannelInstance: ' + channelinstance);
    channelinstances.push(channelinstance)
    cb(null, channel)
  }  );
}

function createUsers(cb) {
  async.parallel([
      function(callback) {
        userCreate('Brian', 'Scott', 'bscott', 'waterbury', callback);
      },
      function(callback) {
        userCreate('Danielle', 'Skyes', 'dskyes', 'waterbury', callback);
      }
      ],
      // optional callback
      cb);
}

function createChannels(cb) {
    async.parallel([
        function(callback) {
          channelCreate('Inbound patient portal', users[0], 'Polls pt portal sftp for qx data', 'File directory', 'File directory', 'C:\inbound\portal', 'C:\outbound\portal', callback);
        },
        function(callback) {
          channelCreate('Outbound ADT SIU', users[0], 'New appt. bookings', 'File directory', 'File directory', 'C:\inbound\SIU', 'C:\outbound\SIU', callback);
        },
        function(callback) {
          channelCreate('FHIR person out', users[0], 'Copy of new appt. bookings', 'File directory', 'File directory', 'C:\inbound\FHIR', 'C:\outbound\FHIR', callback);
        },
        function(callback) {
          channelCreate('Inbound transcription', users[0], 'Polls transcrtiption sftp', 'File directory', 'File directory', 'C:\inbound\transcription', 'C:\outbound\transcription', callback);
        }
        ],
        // optional callback
        cb);
}

function createChannelInstances(cb) {
    async.parallel([
        function(callback) {
          channelInstanceCreate(channels[0], 'Running', 10, 10, 0, callback)
        },
        function(callback) {
          channelInstanceCreate(channels[1], 'Stopped', 50, 10, 40, callback)
        },
        function(callback) {
          channelInstanceCreate(channels[2], 'Running', 1000, 999, 1, callback)
        },
        ],
        // optional callback
        cb);
}


async.series([
    createUsers,
    createChannels,
    createChannelInstances
],
// optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('ChannelInstances: '+channelinstances);
        
    }
    //All done, disconnect from database
    mongoose.connection.close();
});