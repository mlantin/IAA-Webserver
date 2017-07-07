var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var fs = require('fs');
var wav = require('wav');
var path = require('path');

var ScenePath = 'public/scene/';
var parserOptions = {
  inflate: true,
  limit: '100mb',
  type: 'application/octet-stream'
};

var wavoptions = {
       channels: 1
};

var filesArr;
var loadSceneFiles = function () {

    files = fs.readdirSync(ScenePath).filter(file => fs.lstatSync(path.join(ScenePath, file)).isDirectory());
    filesArr = {};
    filesArr["scenes"] = [];
    files.forEach(function(file) {
        scene = {};
        var jsonFile = path.join(ScenePath, file, "config.json");
        if (fs.existsSync(jsonFile)) {
            name = file;
            content = fs.readFileSync(jsonFile)
            content = JSON.parse(content)
            scene["name"] = file;
            scene["title"] = content["title"] || name
            filesArr.scenes = filesArr.scenes.concat(scene);
        }

    });

};

loadSceneFiles();

app.use(bodyParser.raw(parserOptions)); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))

app.get('/', function (req, res) {
    console.log('Incoming GET request for public/audio/' + req.query.fn + '.wav');
    fs.readFile('public/audio/' + req.query.fn + '.wav', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          var message = 'Warning: No such file ' + err.path;
          console.log(message);
          res.status(404).send(message);
        } else {
          throw err;
        }
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

app.put('/scenes/', function (req, res) {

});

app.delete('/', function (req, res) {
  console.log('Received delete request');
  fs.unlink('public/audio/' + req.query.fn + '.wav', function (err) {
    var message;
    if (err) {
        if (err.code === 'ENOENT') {
          message = 'File ' + req.query.fn + '.wav does not exist';
        } else {
          throw err;
        }
    } else {
      message = 'File ' + req.query.fn + '.wav deleted successfully';
    }
    console.log(message);
    res.send(message);
  });
});

app.get('/scenes/', function (req, res) {
    console.log('Request for scenes list.');
    res.json(filesArr);
});


app.listen(3000, function () {
  console.log('Audio Server listening on port 3000!')
});
