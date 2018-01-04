var fs = require('fs');
var crypto = require('crypto');
var inspect = require('util').inspect;

var buffersEqual = require('buffer-equal-constant-time');
var ssh2 = require('ssh2');
var OPEN_MODE = ssh2.SFTP_OPEN_MODE;
var STATUS_CODE = ssh2.SFTP_STATUS_CODE;
var utils = ssh2.utils;

var pubKey = utils.genPublicKey(utils.parseKey(fs.readFileSync('C:\\certs\\ssh\\ssh2.pub')));

exports.startMockSftpServer = function (){
    new ssh2.Server({
        hostKeys: [fs.readFileSync('C:\\certs\\ssh\\ssh2-private.ppk')]
      }, function(client) {
        console.log('Client connected!');
      
        client.on('authentication', function(ctx) {
          if (ctx.method === 'password'
              // Note: Don't do this in production code, see
              // https://www.brendanlong.com/timing-attacks-and-usernames.html
              // In node v6.0.0+, you can use `crypto.timingSafeEqual()` to safely
              // compare two values.
              && ctx.username === 'foo'
              && ctx.password === 'bar')
            ctx.accept();
          else if (ctx.method === 'publickey'
                   && ctx.key.algo === pubKey.fulltype
                   && buffersEqual(ctx.key.data, pubKey.public)) {
            if (ctx.signature) {
              var verifier = crypto.createVerify(ctx.sigAlgo);
              verifier.update(ctx.blob);
              if (verifier.verify(pubKey.publicOrig, ctx.signature))
                ctx.accept();
              else
                ctx.reject();
            } else {
              // if no signature present, that means the client is just checking
              // the validity of the given public key
              ctx.accept();
            }
          } else
            ctx.reject();
        }).on('ready', function() {
          console.log('Client authenticated!');
      
          client.on('session', function(accept, reject) {
            var session = accept();
            
            session.on('sftp', function(accept, reject) {
                console.log('Client SFTP session');
                var openFiles = {};
                var handleCount = 0;
                // `sftpStream` is an `SFTPStream` instance in server mode 
                // see: https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md 
                var sftpStream = accept();
                sftpStream.on('OPEN', function(reqid, filename, flags, attrs) {
                  console.log('OPEN', filename);
                  // only allow opening /tmp/foo.txt for writing
                  if (filename !== '/tmp/foo.txt' || !(flags & OPEN_MODE.READ))
                    return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                  // create a fake handle to return to the client, this could easily
                  // be a real file descriptor number for example if actually opening
                  // the file on the disk
                  var handle = new Buffer(4);
                  openFiles[handleCount] = { read: false };
                  handle.writeUInt32BE(handleCount++, 0, true);
                  sftpStream.handle(reqid, handle);
                  console.log('Opening file for read')
                }).on('READ', function(reqid, handle, offset, length) {
                  if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
                    return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                  // fake the read
                  var state = openFiles[handle.readUInt32BE(0, true)];
                  if (state.read)
                    sftpStream.status(reqid, STATUS_CODE.EOF);
                  else {
                    
                    /* var readStream = fs.createReadStream( "/proc/meminfo" );
                    var writeStream = sftp.createWriteStream( "/tmp/meminfo.txt" );
     
                    // what to do when transfer finishes
                    writeStream.on(
                        'close',
                        function () {
                            console.log( "- file transferred" );
                            sftp.end();
                            process.exit( 0 );
                        }
                    );
     
                    // initiate transfer of file
                    readStream.pipe( writeStream );
*/
                    state.read = true;
                    sftpStream.data(reqid, 'bar');
                    console.log('Read from file at offset %d, length %d', offset, length);
                  }
                }).on('WRITE', function(reqid, handle, offset, data) {
                  if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
                    return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                  // fake the write 
                  sftpStream.status(reqid, STATUS_CODE.OK);
                  var inspected = require('util').inspect(data);
                  console.log('Write to file at offset %d: %s', offset, inspected);
                }).on('CLOSE', function(reqid, handle) {
                  var fnum;
                  if (handle.length !== 4 || !openFiles[(fnum = handle.readUInt32BE(0, true))])
                    return sftpStream.status(reqid, STATUS_CODE.FAILURE);
                  delete openFiles[fnum];
                  sftpStream.status(reqid, STATUS_CODE.OK);
                  console.log('Closing file');
                }).on('READDIR', function(reqid, handle) {
                    sftpStream.name(reqid);
                    console.log('READDIR running');
                  });
            });

            session.once('exec', function(accept, reject, info) {
              console.log('Client wants to execute: ' + inspect(info.command));
              var stream = accept();
              stream.stderr.write('Oh no, the dreaded errors!\n');
              stream.write('Just kidding about the errors!\n');
              stream.exit(0);
              stream.end();
            });
          });
        }).on('end', function() {
          console.log('Client disconnected');
        });
      }).listen(22, '127.0.0.1', function() {
        console.log('Listening on port ' + this.address().port);
      });
}