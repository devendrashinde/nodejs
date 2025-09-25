import { createReadStream, readdirSync, statSync } from 'fs';
import express from 'express';
import fileUpload from 'express-fileupload';
const app = express();
import { join, sep, extname } from 'path';
import path from 'path';
import ImageDetails from "./ImageDetails.js";
import { fileURLToPath } from 'url';
import { createPhoto, getPhotos, getTags } from './app/controllers/photoController.js';
import media from './app/services/media.js';
import pkg from 'body-parser';

const { urlencoded, json } = pkg;

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

var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
var skipFileTypes = ['.db','.exe','.tmp','.doc','.dat','.ini', '.srt','.idx','.rar','.sub','.zip','.php','.wmdb'];
var numberOfItemsOnPage = 20;

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.set('view engine', 'pug');
app.set('views', __dirname);

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.static(join(__dirname, 'public')));
app.use('/data', express.static(join(__dirname, "data")));
app.use(urlencoded({ extended: true }));
app.use(json());

var dataDir = join(__dirname, "data");
var BASE_DIR = 'data/';
const imageCache = {};


setInterval(() => {
    console.log("Clearing image cache");
    Object.keys(imageCache).forEach(key => delete imageCache[key]);
}, 10 * 60 * 1000); // Clear every 10 minutes


app.post('/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  let fileName = BASE_DIR + req.body.album + '/' + uploadedFile.name;
  fileName = fileName.replace('\\', '/');
  console.log(fileName);
  uploadedFile.mv(fileName, function(err) {
    if (err)
      return res.status(500).send(err);
    req.body.name = fileName;
	createPhoto(req, res);
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

app.get('/get-images', (req, res) => {
    res.render('index', { title: 'Our Photo Gallery', images: {} })
});

app.get('/photos', (req, res) => {
    let album = req.query.id;
    let targetDir = dataDir;
    if(album == undefined || !album || album == "Home"){
        album = "Home";
    } else {
        targetDir = join(dataDir, album);
    }
	let page = 0;
	if(req.query.page) {
		page = req.query.page;
	}
	let items = numberOfItemsOnPage;
	if(req.query.items) {
		items = req.query.items;
	}
    
    // Check if page is cached
    let cacheKey = getCacheKey(targetDir, page, items);
    if (imageCache[cacheKey]) {
        console.log(`Serving album "${album}" page ${page} items ${items} from cache`);
        let result = imageCache[cacheKey];
        res.json({
            totalPhotos: result.totalPhotos,
            data: result.images
        })
    } else {
        console.log(`Serving album "${album}" page ${page} items ${items} from disk`);
        let result = getImagesFromDir(targetDir, album, page, false, items);
        imageCache[cacheKey] = result; // Cache the result
        res.setHeader('Content-Type', 'application/json');
        //res.end(JSON.stringify(images));
        res.json({
            totalPhotos: result.totalPhotos,
            data: result.images
        })
    }
});

app.route('/')
    .post(createPhoto);

app.route('/tags?:id')
    .get(getPhotos);
	
app.route('/tags?:tag')
    .get(getPhotos);

app.route('/alltags')
   .get(getTags);;

app.get('*', (req, res) => {
    var file = join(dataDir, req.path.replace(/\/$/, '/index.html'));

    if (file.indexOf(dataDir + sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    
    var type = mime[extname(file).slice(1)] || 'text/plain';
    var s = createReadStream(file);
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
	let dir = "uploaded"
	filename = filename.substr(0,6);	
	if (parseInt(filename) > 0) {
		let year = filename.substr(0,4);
		let month = filename.substr(4);
		if (parseInt(month) <= 12){			
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

function getTagFromFileName(file) {
    // Remove directory path if present
    let base = file.split(/[\\/]/).pop();
    // Remove extension
    let tag = base.replace(/\.[^/.]+$/, "");
    console.log(tag);
    return tag;
}

function getCacheKey(album, page, items) {
    return album + "_" + page + "_" + items;
}

// dirPath: target image directory
function getImagesFromDir(dirPath, album, page, onlyDir, numberOfItems) {

    // All images holder, defalut value is empty
    let allImages = [];
    // Iterator over the directory
    let files = readdirSync(dirPath);
 
    // Iterator over the files and push images, video, pdfs to allImages array.
    var id = 0
	var imageCnt = 0;	
	var imageIndex = 0;
	var firstImageId = page * numberOfItems;
    var root = album == "Home";
    
    if(!root){
        var fileparts = album.split("/");
        let albumName = fileparts[fileparts.length-1]
        allImages.push(new ImageDetails("album"+id, albumName, (root ? "" : album), true, albumName));
    } else{
		allImages.push(new ImageDetails("album"+id, album, "", true, album));
	}
    for (var file of files) {
        let fileLocation = join(dirPath, file);
        var stat = statSync(fileLocation);

        id = id + 1;
        if (stat && stat.isDirectory()) {
            var album_name = (root ? "" : album + "/")+file;
            var imageDetails = new ImageDetails("album"+id, file, album_name, true, file);
            allImages.push(imageDetails);
        } else if (!onlyDir && stat && stat.isFile() && skipFileTypes.indexOf(extname(fileLocation).toLowerCase()) == -1) {			
			if ( imageIndex >= firstImageId && imageCnt < numberOfItems) {
				allImages.push(new ImageDetails("photo"+id, file, BASE_DIR+(root ? "" : album + "/")+file, false, (root ? album : album), getTagFromFileName(file)));
				imageCnt = imageCnt + 1;
			}
			imageIndex = imageIndex + 1;
        }
    }
    console.log(allImages);
 
    return {
        totalPhotos: imageIndex,
        images: allImages
    };
    // return all images in array formate
    //return allImages;
}
 
app.listen(8082, function () {
    console.log('Application is running at : localhost:8082');
});
