/*!
# Conservus - A fast blob store
# Copyright (c) 2011, Kevin Bortis
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#    1. Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#    2. Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#    3. Neither the names of the copyright holders nor the names of any
#       contributors may be used to endorse or promote products derived
#       from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
*/

var blob_store = '/srv/conservus/blobs/';
var blob_temp = '/tmp';
var PORT = 23;

var formidable = require('formidable'),
    http = require('http'),
    sys = require('sys'),
    crypto = require('crypto'),
    fs = require('fs');

http.createServer(function(req, res) {
  // Store a new blob
  if(req.url == '/blob' && req.method.toLowerCase() == 'post') {
    var form = new formidable.IncomingForm();
    form.uploadDir = blob_temp;
    form.keepExtensions = false;

    var shasum = crypto.createHash('sha1')

    form
      .on('file', function(name, file) {
        var s = fs.ReadStream(file.path);
        s.on('data', function(d) {
          shasum.update(d);
        });

        var file_hash = shasum.digest('hex').toLowerCase();
        var file_dir = blob_store + '/' + file_hash.substring(0,2);
        var file_name = file_dir + '/' + file_hash.substring(2);

        fs.rename(file.path, file_name, function (err) {
          if(err) throw err;
          console.log('rename complete');
        });
      })
      .on('error', function(err) {
        console.log('Error ocured');
        console.log(err)
        res.writeHead(500, {'content-type': 'application/json'});
        res.end("{'status': 'failed', 'error': 'ErrorOnProcessing'}");
      })
      .on('end', function() {
        var file_hash = shasum.digest('hex').toLowerCase();
        console.log('-> upload done');
        console.log('key: ' + file_hash);
        res.writeHead(200, {'content-type': 'application/json'});
        res.end("{'status': 'success', 'key': '" + file_hash +"'}");
      });

    form.parse(req);
  } else {
    res.writeHead(404, {'content-type': 'application/json'});
    res.end("{'status': 'failed', 'error': 'URLNotFound'}");
  }
}).listen(PORT);

console.log('listening on http://localhost:' + PORT + '/');

