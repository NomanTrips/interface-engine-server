'use strict';

var https = require('https');
var fs = require('fs');

var ca = fs.readFileSync('C:\\certs\\trusted\\my-private-root-ca.cert.pem', 'utf8')
, port = 8443
, hostname = 'localhost'
, rejectUnauthorized= true
, requestCert= true
, agent= false
;

var options = {
host: hostname
, port: port
, ca: ca
};
options.agent = new https.Agent(options);

exports.mockHttpsRequest = function () {
  https.request (options, function(res) {
    res.pipe(process.stdout);
  }).end();
}