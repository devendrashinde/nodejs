'use strict';

import { resolve, dirname } from 'path';
import gm from 'gm';
import { statSync, writeFile } from 'fs';
import pkg from 'shelljs';
const { mkdir } = pkg;

const exists = (path) => {
    try {
        return statSync(path).isFile();
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
			let thumbPath = resolve(thumb);
			console.log(thumb);
            response.type(mime);

			if(!exists(thumb)) {
				mkdir('-p', dirname(thumbPath));
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
						writeFile(thumb, buffer, function(err) {});
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

export default Media;