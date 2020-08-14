'use strict';

const path = require('path');
const gm = require('gm');
const fs = require('fs');
const shell = require('shelljs');

const exists = (path) => {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
};

const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

class Media {
    constructor(path) {
        this.src = path;
    }

    isValidMedia(src) {
        return /\.(jpe?g|png)$/.test(src);
    }


    thumb(request, response) {
        let image = this.src;

        if(this.isValidMedia(image) && exists(image)) {

            let width = (request.query.w && /^\d+$/.test(request.query.w)) ? request.query.w : '150';
            let height = (request.query.h && /^\d+$/.test(request.query.h)) ? request.query.h : '150';
            let extension = getFileExtension(image).toLowerCase();
            let mime = (extension === 'jpeg' || extension === 'jpg') ? 'jpeg' : 'png';
			let thumb = this.src.replace('pictures', 'pictures/thumbs');
			let thumbPath = path.resolve(thumb);
			console.log(thumb);
            response.type(mime);

			if(!exists(thumb)) {
				shell.mkdir('-p', path.dirname(thumbPath));
				/* 
				//write resized file and then return it
				var writeStream = fs.createWriteStream(thumb);
				gm(image).resize(width, height).write(thumb, function (err) {
					if (err) {
						response.sendStatus(422);
					} else {
						//response.sendFile(path.resolve(thumb));
						gm(image).resize(width, height).stream().pipe(response);
					}
				});				
				*/
				gm(image).resize(width, height).autoOrient().toBuffer(function (err, buffer) {
					if (err) {
						response.sendStatus(422);
					} else {
						fs.writeFile(thumb, buffer, function(err) {});
						gm(buffer).stream().pipe(response);
					}
				});				
			} else {
				response.sendFile(thumbPath);
			}
        } else {
            response.sendStatus(404);
        }
    }
}

module.exports = Media;