const { Pool, Client } = require('pg')
var messages = require('../modules/messages');

var intervalToMilliseconds = function (interval, units) {
    var intervalMultiplier;
    switch (units) {
        case 'milliseconds':
            intervalMultiplier = 1;
            break;
        case 'seconds':
            intervalMultiplier = 1000;
            break;
        case 'minutes':
            intervalMultiplier = 60000;
            break;
        case 'hours':
            intervalMultiplier = 3600000; // 3.6e+6
            break;
        case 'days':
            intervalMultiplier = 86400000; //8.64e+7
    }
    return intervalMultiplier * interval;
}

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

exports.startDBreader = function (channel, senderFunc, callback){
    var intervalInMilliseconds = intervalToMilliseconds(channel.schedule_interval, channel.schedule_unit);
    var user = channel.db_reader_user;
    var password = channel.db_reader_password;
    var host = channel.db_reader_host;
    var port = channel.db_reader_port;
    var database = channel.db_reader_database;
    var timer = setInterval(function() {
        if (channel.db_reader_type == 'Postgres'){
            connectToPostgresDb(user, host, database, password, port, function(err, client){
                if (err){
                    //callback(err, null);
                } else {
                    executePostgresQuery(client, channel.db_reader_query, function(err, result){
                        if (err){

                        } else {
                            result.rows.forEach(row => {
                                if (channel.db_reader_use_post_process_query){
                                    // run post process query
                                    var id = row.ID;
                                    // trickery to insert variables from first query result
                                    var evalStr = 'var queryStr = \'' + String(channel.db_reader_post_process_query) + '\'';
                                    eval(evalStr);//`${channel.db_reader_post_process_query}`;
                                    // end trickery
                                    executePostgresQuery(client, queryStr, function(err, result){
                                        if (err){
    
                                        } else {
                                            console.log('db reader post process query executed successfully.');
                                        }
                                    })
                                }
                                messages.messageReceived(row, channel, senderFunc);
                            });
                        }
                    })
                }
            })      
        }
    }, intervalInMilliseconds);
    callback(null, timer);

}