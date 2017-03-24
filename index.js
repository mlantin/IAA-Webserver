var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var fs = require('fs');
var wav = require('wav');

var parserOptions = {
  inflate: true,
  limit: '100mb',
  type: 'application/octet-stream'
};

var wavoptions = {
	channels: 1
};

app.use(bodyParser.raw(parserOptions)); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', function (req, res) {
    fs.readFile('public/audio/' + req.query.fn + '.wav', function(err, data) { 
    if (err) {
      throw err;
    }
    res.send(data);
  });

});

app.put('/audio', function (req, res) {
  var filename = req.query.fn+".wav";
  var writer = new wav.Writer(wavoptions);
  writer.pipe(fs.createWriteStream("public/audio/"+filename));
  writer.write(req.body);
  writer.end();
  res.send('saved your audio file');
});

app.delete('/', function (req, res) {
  console.log('Received delete request');
  fs.unlink('public/audio/' + req.query.fn + '.wav', function (err) {
    if (err) {
      throw err;
    }
    var message = 'File ' + req.query.fn + '.wav deleted successfully';
    console.log(message);
    res.send(message);
  });
});

app.listen(3000, function () {
  console.log('Audio Server listening on port 3000!')
});