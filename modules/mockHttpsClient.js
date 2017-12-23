'use strict';

var https = require('https')
  , fs = require('fs')
  , path = require('path')
  , ca = fs.readFileSync('C:\certs\root\my-private-root-ca.cert.pem')
  , port = 8443
  , hostname = 'localhost'
  ;

var options = {
  host: hostname
, port: port
, path: '/'
, ca: ca
};
options.agent = new https.Agent(options);

https.request (options, function(res) {
  res.pipe(process.stdout);
}).end();