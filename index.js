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

var writer = new wav.Writer(wavoptions);

app.use(bodyParser.raw(parserOptions)); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.put('/audio', function (req, res) {
  console.log(req.get('Content-Type'));
  console.log(req.body);
  var filename = req.query.fn+".wav";
  writer.pipe(fs.createWriteStream("public/audio/"+filename));
  writer.write(req.body);
  writer.end();
  res.send('saved your audio file');
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})