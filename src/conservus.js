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

var blob_store = '/tmp/conservus/blobs';
var blob_temp = '/tmp/conservus/temp';
var PORT = 8023;

var formidable = require('formidable'),
    http = require('http'),
    router = require('choreographer').router(),
    static = require('node-static'),
    fs = require('fs'),
    path = require('path');

router.get('/blob/*', function(req, res, key) {
  var path = key.substring(0,2) + '/' + key.substring(2);
  console.log(path);
  var file = new static.Server(blob_store);
  file.serveFile(path, 200, {}, req, res);
})
.post('/blob', function(req, res) {
  // Store a new blob
    var form = new formidable.IncomingForm();
    form.uploadDir = blob_temp;
    form.keepExtensions = false;
    form.checksum = 'sha1';

    form
      .on('file', function(name, file) {
          console.log('hashing complete');
          console.log('key: ' + file.checksum);
          var file_dir = blob_store + '/' + file.checksum.substring(0,2);
          var file_name = file_dir + '/' + file.checksum.substring(2);

          if(!path.existsSync(file_dir)) {
            console.log(file.checksum.substring(0,2) + ' does not exist');
            fs.mkdirSync(file_dir);
          }

          console.log(file_name);
          fs.rename(file.path, file_name, function (err) {
            if(err) throw err;
            console.log('rename complete');
          });

          res.writeHead(200, {'content-type': 'application/json'});
          res.end("{'status': 'success', 'key': '" + file.checksum +"'}");
      })
      .on('error', function(err) {
        console.log('Error ocured');
        console.log(err);
        res.writeHead(500, {'content-type': 'application/json'});
        res.end("{'status': 'failed', 'error': 'ErrorOnProcessing'}");
      });

    form.parse(req);
})
.notFound(function(req, res) {
    res.writeHead(404, {'content-type': 'application/json'});
    res.end("{'status': 'failed', 'error': 'URLNotFound'}");
});

http.createServer(router).listen(PORT);

console.log('listening on http://localhost:' + PORT + '/');

