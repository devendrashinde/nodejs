const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
var ImageDetails = require("./ImageDetails.js");
var photos = require('./app/controllers/photoController');
const media = require('./app/services/media');

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

var skipFileTypes = ['.db','.exe','.tmp','.doc','.dat','.ini', '.srt','.idx','.rar','.sub','.zip','.php','.wmdb'];

app.set('view engine', 'pug');
app.set('views', __dirname);

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, "data")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var dataDir = path.join(__dirname, "data");
var BASE_DIR = 'data/';

app.post('/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  fileName = BASE_DIR + req.body.album + '/' + uploadedFile.name;
  console.log(fileName);
  uploadedFile.mv(fileName, function(err) {
    if (err)
      return res.status(500).send(err);
    req.body.name = fileName;
	photos.createPhoto(req, res);
  });
});


app.get('/thumb?:id', (req, res) => {
    if(req.query.id) {
		console.log(req.query.id);
       let image = new media(req.query.id);
       image.thumb(req, res);	   
    } else {
        res.sendStatus(403);
    }
});

app.get('/get-images?:id', (req, res) => {
    album = req.query.id;
    targetDir = dataDir;
    if(!album || album == "Home"){
        album = "Home";
    } else {
        targetDir = path.join(dataDir, album);
    }
    let images = {};    
    res.render('index', { title: 'Our Photo Gallery', images: images })
});

app.get('/photos?:id', (req, res) => {
    album = req.query.id;
    targetDir = dataDir;
    if(album == undefined || !album || album == "Home"){
        album = "Home";
    } else {
        targetDir = path.join(dataDir, album);
    }
    let images = getImagesFromDir(targetDir, album, 0, false);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(images));
});

app.route('/')
    .post(photos.createPhoto);

app.route('/tags?:id')
    .get(photos.getPhotos);
	
app.route('/tags?:tag')
    .get(photos.getPhotos);
	
app.get('*', (req, res) => {
    var file = path.join(dataDir, req.path.replace(/\/$/, '/index.html'));

    if (file.indexOf(dataDir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
    var s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});


function getAlbumName(file){	
	var filename = file;
	filename = filename.replace("IMG", "");
	filename = filename.replace("VID", "");
	filename = filename.replace("_", "");
	filename = filename.replace("-", "");
	if (filename.indexOf(".") > 0){
		str = filename.substr(filename.indexOf(".")-1);
		filename = filename.replace(str, "");
	}
	dir = "uploaded"
	filename = filename.substr(0,6);	
	if (parseInt(filename) > 0) {
		year = filename.substr(0,4);
		month = filename.substr(4);
		if (parseInt(month) <= 12){
			months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			dir = year +"-" + months[parseInt(month)-1];
		}
	}
	/*
	if(dir == "uploaded"){
		const stats = fs.statSync(file);
		parts = stats.mtime.split(" ");
		dir = parts[parts.length-1] + "-" + parts[1];
	}
	*/
	console.log(dir);
	return dir;
}

// dirPath: target image directory
function getImagesFromDir(dirPath, album, idIndex, onlyDir) {

    // All iamges holder, defalut value is empty
    let allImages = [];
    // Iterator over the directory
    let files = fs.readdirSync(dirPath);
 
    // Iterator over the files and push jpg and png images to allImages array.
    var id = idIndex
    var root = album == "Home";
    
    if(!root){
        var fileparts = album.split("/");
        albumName = fileparts[fileparts.length-1]
        allImages.push(new ImageDetails("album"+id, albumName, (root ? "" : album), true, albumName));
    } else{
		allImages.push(new ImageDetails("album"+id, album, "", true, album));
	}
    for (file of files) {       
        let fileLocation = path.join(dirPath, file);
        var stat = fs.statSync(fileLocation);

        id = id + 1;
        if (stat && stat.isDirectory()) {
            var album_name = (root ? "" : album + "/")+file;
            var imageDetails = new ImageDetails("album"+id, file, album_name, true, file);
            allImages.push(imageDetails);
        } else if (!onlyDir && stat && stat.isFile() && skipFileTypes.indexOf(path.extname(fileLocation).toLowerCase()) == -1) {
            allImages.push(new ImageDetails("photo"+id, file, BASE_DIR+(root ? "" : album + "/")+file, false, (root ? album : album), file));
        }
    }
    console.log(allImages);
 
    // return all images in array formate
    return allImages;
}
 
app.listen(8082, function () {
    console.log('Application is running at : localhost:8082');
});
