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

// Configuration from environment or defaults
const THUMBNAIL_SIZES = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 }
};

class Media {
    constructor(path, thumbnailDir = './temp-pic/thumbnails') {
        this.src = path;
        this.thumbnailDir = thumbnailDir;
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

    async thumb(request, response) {
        const image = this.src;
        const mimeType = this.getMimeType();
        
        console.log(`Generating thumbnail for: ${image}, type: ${mimeType}`);
        
        if (!this.isValidMedia(mimeType) || !exists(image)) {
            return response.status(404).json({ error: 'Media file not found or invalid type' });
        }

        // Generate thumbnail in separate directory with hashed filename to avoid collisions
        const crypto = await import('crypto');
        const hash = crypto.createHash('md5').update(image).digest('hex');
        const ext = getFileExtension(image) || 'jpg';
        const thumbFilename = `${hash}.${ext}`;
        const thumb = path.join(this.thumbnailDir, thumbFilename);
        const thumbPath = resolve(thumb);
        
        response.type(mimeType);
        
        if (mimeType.startsWith('image/')) {
            await this.generateImageThumbnail(request, response, image, thumb, thumbPath);
        } else {
            await this.generateVideoThumbnail(response, image, thumb, thumbPath);
        }
    }

    async generateImageThumbnail(request, response, image, thumb, thumbPath) {
        try {
            // Validate and sanitize dimensions
            const width = (request.query.w && /^\d+$/.test(request.query.w)) 
                ? Math.min(parseInt(request.query.w), 1200) 
                : 150;
            const height = (request.query.h && /^\d+$/.test(request.query.h)) 
                ? Math.min(parseInt(request.query.h), 1200) 
                : 150;
            
            const quality = (request.query.q && /^\d+$/.test(request.query.q))
                ? Math.min(parseInt(request.query.q), 100)
                : 80;

            if (!exists(thumb)) {
                mkdir('-p', dirname(thumbPath));
                
                gm(image)
                    .resize(width, height)
                    .autoOrient()
                    .quality(quality)
                    .noProfile() // Remove EXIF data from thumbnails
                    .toBuffer((err, buffer) => {
                        if (err) {
                            console.error('Error generating image thumbnail:', err);
                            return response.status(422).json({ error: 'Failed to generate thumbnail' });
                        }
                        
                        // Save thumbnail to disk
                        writeFile(thumb, buffer, (writeErr) => {
                            if (writeErr) {
                                console.error('Error saving thumbnail:', writeErr);
                            }
                        });
                        
                        // Stream to response
                        gm(buffer).stream().pipe(response);
                    });
            } else {
                // Set cache headers for existing thumbnails
                response.set('Cache-Control', 'public, max-age=86400'); // 24 hours
                response.sendFile(thumbPath);
            }
        } catch (err) {
            console.error('Error in generateImageThumbnail:', err);
            response.status(500).json({ error: 'Internal server error' });
        }
    }

    async generateVideoThumbnail(response, image, thumb, thumbPath) {
        try {
            const pngThumb = thumb + '.png';
            const pngThumbPath = thumbPath + '.png';
            
            response.type("image/png");
            
            if (!exists(pngThumb)) {
                mkdir('-p', dirname(thumbPath));
                
                const thumbnailName = path.basename(pngThumbPath);
                const outputDir = path.dirname(pngThumbPath);
                
                // Use FFmpeg to extract a frame at the middle of the video
                ffmpeg(image)
                    .on('end', () => {
                        console.log('✓ Video thumbnail generated successfully');
                        response.set('Cache-Control', 'public, max-age=86400');
                        response.sendFile(pngThumbPath);
                    })
                    .on('error', (err) => {
                        console.error('Error generating video thumbnail:', err);
                        response.status(422).json({ error: 'Failed to generate video thumbnail' });
                    })
                    .screenshots({
                        timestamps: ['50%'], // Middle of the video
                        filename: thumbnailName,
                        folder: outputDir,
                        size: '300x200'
                    });
            } else {
                response.set('Cache-Control', 'public, max-age=86400'); // 24 hours
                response.sendFile(pngThumbPath);
            }
        } catch (err) {
            console.error('Error in generateVideoThumbnail:', err);
            response.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default Media;