'use strict'
var http = require('http');
var soap = require('soap');

exports.startMockWebServiceListener = function () {
    var service = {
        ProcessMessageService: {
            ProcessMessagePort: {

                ProcessMessage: function(args, callback) {
                    console.log('Processing message web services... ');
                    return {
                        name: args.message
                    };
                    
                },

                MyFunction: function(args, callback) {
                //    return 'jubba'
                    return {
                        name: args.message
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
  
    var appRoot = process.cwd()
    var xml = require('fs').readFileSync(appRoot + '/default-wsdl/wsdl.wsdl', 'utf8');
  
    //http server example
    var server = http.createServer(function(request,response) {
        response.end('404: Not Foundz: ');
    });
  
    server.listen(10300);
    soap.listen(server, '/wsdl', service, xml);

    server.on('error', function (err) {
        // Handle your error here
        //callback(err, null);
        console.log(err);
    });
    
    server.on('listening', function() {
        console.log('Mock Web services server listening on: 10300');
        //callback(null, server)
    })

    server.on('request', (req, res) => {
        console.log('Web services request recieved.' + req);
    });

}