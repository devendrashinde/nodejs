'use strict';

import { resolve, dirname} from 'path';
import path from 'path';
import gm from 'gm';
import { statSync, writeFile } from 'fs';
import pkg from 'shelljs';
import e from 'express';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';

const { mkdir } = pkg;
const videoMimeMap = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  ogv: 'video/ogg'
};

//using imageMagic
//import gmModule from 'gm';
//const gm = gmModule.subClass({ imageMagick: true });

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

    getMimeType() {
        let mimeType = mime.lookup(this.src);
        if (!mimeType) {
            // fallback: check extension manually
            const ext = this.src.split('.').pop().toLowerCase();
            mimeType = videoMimeMap[ext] || null;
        } else {
            // normalize known video extensions
            const ext = this.src.split('.').pop().toLowerCase();
            if (videoMimeMap[ext]) {
                mimeType = videoMimeMap[ext];
            }
        }
        return mimeType;
    }

    isValidMedia(mimeType) {        

        if (!mimeType) return false; // Unknown or unsupported type

        return mimeType.startsWith('image/') || mimeType.startsWith('video/');
    }

    thumb(request, response) {
        let image = this.src;
        const mimeType = this.getMimeType();
        console.log(mimeType);
        if(this.isValidMedia(mimeType) && exists(image)) {
            let thumb = image.replace('pictures', 'pictures/thumbs');
            let thumbPath = resolve(thumb);
            console.log(thumb);
            response.type(mimeType);
            if(mimeType.startsWith('image/')) {
                let width = (request.query.w && /^\d+$/.test(request.query.w)) ? request.query.w : '150';
                let height = (request.query.h && /^\d+$/.test(request.query.h)) ? request.query.h : '150';
                let extension = getFileExtension(image).toLowerCase();

                if(!exists(thumb)) {
                    mkdir('-p', dirname(thumbPath));
                    gm(image).resize(width, height).autoOrient().toBuffer(function (err, buffer) {
                        if (err) {
                            console.error('Error generating thumbnail:', err);
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
                thumb = thumb + '.png';
                response.type("image/png");
                console.log(thumb);
                if(!exists(thumb)) {                    
                    mkdir('-p', dirname(thumbPath));
                    const inputVideoPath = image;
                    const outputThumbnail = thumbPath + '.png';
                    const thumbnailName = path.basename(outputThumbnail);
                    const outputDir = path.dirname(outputThumbnail);                    
                    // Use FFmpeg to extract a frame at the middle of the video
                    ffmpeg(inputVideoPath)
                    .on('end', () => {
                        resolve(outputThumbnail);
                        console.log('Thumbnail generated successfully!');
                        response.sendFile(outputThumbnail);
                    })
                    .on('error', (err) => {
                        reject(err)
                        console.error('Error generating thumbnail:', err);
                        response.sendStatus(422);
                    })
                    .screenshots({
                        timestamps: ['50%'], // Middle of the video
                        filename: thumbnailName,
                        folder: outputDir,
                        size: '300x200', // Optional: resize thumbnail
                    });
                    
                } else {                    
                    thumbPath = resolve(thumb);
                    response.sendFile(thumbPath);
                }
            }
        } else {
            response.sendStatus(404);
        }
    }
}

export default Media;