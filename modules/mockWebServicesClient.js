var soap = require('soap');
var url = 'http://localhost:10200/wsdl?wsdl';
var args = {name: 'value'};

exports.createMockWebServicesClient = function (){
    soap.createClient(url, function(err, client) {
        //console.dir(client)
        //console.log(client.describe());
        client.MyFunction(args, function(err, result) {
            console.log('client running');
            console.dir(result);
            console.log(err);
        });
      });
}