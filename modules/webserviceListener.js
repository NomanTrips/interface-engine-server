'use strict'
var messages = require('../modules/messages');
var transformers = require('../modules/transformers');
var channelStats = require('../modules/channelStats');
var mockWebServicesClient = require('../modules/mockWebServicesClient');
var http = require('http');
var soap = require('soap');

exports.startWebServiceListener = function (channel, senderFunc, callback) {
    var myService = {
        MyService: {
            MyPort: {
            
                MyFunction: function(args, callback) {
                    console.log('runnin the func');
                //    return 'jubba'
                    return {
                        name: args.name
                    };
                    //callback(null, 'jubba');
                },

                // This is how to define an asynchronous function.
                MyAsyncFunction: function(args, callback) {
                    // do some work
                    callback({
                        name: args.name
                    });
                },
  
                // This is how to receive incoming headers
                HeadersAwareFunction: function(args, cb, headers) {
                    return {
                        name: headers.Token
                    };
                },
  
                // You can also inspect the original `req`
                reallyDetailedFunction: function(args, cb, headers, req) {
                    console.log('SOAP `reallyDetailedFunction` request from ' + req.connection.remoteAddress);
                    return {
                        name: headers.Token
                    };
                }
            }
        }
    };
  
    var xml = require('fs').readFileSync('C:\\wsdls\\wsdl.wsdl', 'utf8');
  
    //http server example
    var server = http.createServer(function(request,response) {
        response.end('404: Not Foundz: ' + request.url);
    });
  
    server.listen(10200);
    soap.listen(server, '/wsdl', myService, xml);
    
    server.on('error', function (err) {
        // Handle your error here
        callback(err, null);
        //console.log(err);
    });
    
    server.on('listening', function() {
        console.log('Web services server listening on: ' + '10200');
        callback(null, server)
    })

    server.on('request', (req, res) => {
        console.log('Web services request recieved.');
    });
    
    mockWebServicesClient.createMockWebServicesClient();
}