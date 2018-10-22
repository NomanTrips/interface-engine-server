var soap = require('soap');
var url = 'http://localhost:10200/wsdl?wsdl';
var args = {name: 'value', message:'jubba is king and commander.'};
var fs = require('fs');

exports.createMockWebServicesClient = function (){
    fs.readFile('C:\\inbound\\xml-test.xml', 'utf8', function (err, data) {
        var sampleMessage = data;
        args.message = sampleMessage;
    
        soap.createClient(url, function(err, client) {
            //console.dir(client)
            console.log(client.describe());
            client.ProcessMessage(args, function(err, result) {
                console.log('client running');
                console.dir(result);
                console.log(err);
            });
          });
    })

}