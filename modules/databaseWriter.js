'use strict';
const { Pool, Client } = require('pg');
var channelStats = require('../modules/channelStats');
var messages = require('../modules/messages');

var connectToPostgresDb = function (user, host, database, password, port, callback){   
    const client = new Client({
      user: user,
      host: host,
      database: database,
      password: password,
      port: port,
    })
    
    client.connect((err) => {
        if (err) {
          console.error('PG connection error', err.stack)
          callback(err, null);
        } else {
          console.log('PG connected.')
          callback(null, client);
        }
    })

}

var executePostgresQuery = function(client, query, callback) {
    client.query(query, (err, res) => {
        if (err) {
          console.log(err.stack)
          callback(err, null);
        } else {
          console.log(res.rows[0])
          callback(null, res);
        }
    })
}

exports.databaseWriter = function (transformedMessage, channel, fileName, messageDetails) {
    var user = channel.db_writer_user;
    var password = channel.db_writer_password;
    var host = channel.db_writer_host;
    var port = channel.db_writer_port;
    var database = channel.db_writer_database;
    var query = channel.db_writer_query;
    if (channel.db_writer_type == 'Postgres'){
        connectToPostgresDb(user, host, database, password, port, function(err, client){
            if (err){
                //callback(err, null);
            } else {
                var message = transformedMessage;
                
                // string and eval trickery to get the sql string
                var queryStr = eval('\''+ channel.db_writer_query + '\'');
                // end trickery

                executePostgresQuery(client, queryStr, function(err, result){
                    if (err){
                        messageDetails.status = 'Send error';
                        messageDetails.err = err;
                        channelStats.getChannelStats(channel, channelStats.updateErrorsMessageStat);
                    } else {
                        messageDetails.status = 'Sent';
                        channelStats.getChannelStats(channel, channelStats.updateSentMessageStat);
                    }
                })
            }
            messages.updateMessage(messageDetails, function (err, updatedMessage) {
            })
        })      
    }

}