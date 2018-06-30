var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var fs = require('fs');
var wav = require('wav');
var path = require('path');

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  var path = 'public/temp'
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
};
  process.exit();
})
try{
    fs.mkdirSync('public/temp');
} catch(e) {}


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
app.use(function (req, res, next) {
    var filename = path.basename(req.url);
    var extension = path.extname(filename);
    // if (extension === '.css')
        console.log(req.url + " was requested.");
    next();
});
app.use(express.static('public'))

app.put('/upload_audio', function (req, res) {
  var filename = req.query.fn+".wav";
  var writer = new wav.Writer(wavoptions);
  writer.pipe(fs.createWriteStream(path.join("public", filename)));
  writer.write(req.body);
  writer.end();
  res.send('saved your audio file');
});

GenScene = function(filePath, fileContent) {
    // console.log(String(fileContent));
    var scene = JSON.parse(fileContent);
    var sceneName = path.basename(filePath).slice(0, -5);
    var dir = path.join('public/scene', sceneName);
    if (fs.existsSync(dir)) {
        throw 'Directory already exists.'
    }
    fs.mkdirSync(dir);
    fs.mkdirSync(path.join(dir, 'audio'));
    try {
        scene.wordInfoList.forEach(
            function(item, index, theArray) {
                var audioFile = item.clipfn;
                var oriPath = path.join('public', audioFile + '.wav');
                var desPath = path.join(dir, 'audio', path.basename(audioFile) + '.wav');
                item.clipfn = path.join('scene', sceneName, 'audio', path.basename(audioFile));
                if (fs.existsSync(oriPath)) {
                    fs.createReadStream(oriPath).pipe(fs.createWriteStream(desPath));
                }
            }
        )
        fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(scene, null, 4));
        loadSceneFiles();
    } catch (e) {
        console.log(e);
        fs.rmdirSync(dir);
        throw(e);
    }
};

app.put('/scene', function (req, res) {
    // req.body
    var filename = path.join('public/temp', req.query.fn) + ".json";
    fs.writeFile(filename, req.body, (err) => {
        if (err) {
            console.log("Save " + filename + " Failed");
            res.status(400).send('Failed to save scene.(Save error)');
        }
        console.log('The file has been saved!');
        try {
            console.log(filename);
            GenScene(filename, req.body);
            res.send('Scene file' + req.query.fn + 'saved.');
        } catch(e) {
            res.status(400).send('Failed to save scene.(Collect error)');
        }
    });

});

app.get('/scenes/', function (req, res) {
    console.log('Request for scenes list.');
    res.json(filesArr);
});

app.listen(3000, function () {
  console.log('Audio Server listening on port 3000!')
});
