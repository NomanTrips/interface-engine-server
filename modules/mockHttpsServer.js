'use strict'

var https = require('https');
var fs = require('fs');

exports.startServer = function (port, callback) {
    var privateKey  = fs.readFileSync('C:\\certs\\trusted\\privkey.pem', 'utf8');
    var certificate = fs.readFileSync('C:\\certs\\trusted\\server\\fullchain.pem', 'utf8');    
    var credentials = {key: privateKey, cert: certificate};

    https.createServer(credentials, function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('Success!');
        res.end();

        // parse the body out of the http request
        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // at this point, `body` has the entire request body stored in it as a string
            console.log(body)
            callback(body);
        });

    }).listen(port);
}