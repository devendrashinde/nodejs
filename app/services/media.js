'use strict';

import { resolve, dirname, extname } from 'path';
import path from 'path';
import gm from 'gm';
import { statSync } from 'fs';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import pkg from 'shelljs';
import e from 'express';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import which from 'which';

const thumbnailGenerationPromises = new Map();
let ffmpegConfigurationPromise = null;

// Configure FFmpeg and FFprobe paths
const configureFfmpeg = async () => {
    try {
        const ffmpegPath = await which('ffmpeg');
        const ffprobePath = await which('ffprobe');
        
        if (ffmpegPath) {
            ffmpeg.setFfmpegPath(ffmpegPath);
            console.log(`✓ FFmpeg configured: ${ffmpegPath}`);
        }
        if (ffprobePath) {
            ffmpeg.setFfprobePath(ffprobePath);
            console.log(`✓ FFprobe configured: ${ffprobePath}`);
        }
    } catch (err) {
        console.warn('⚠ FFmpeg/FFprobe not found in PATH. Video thumbnails may not work.');
        console.warn('Install FFmpeg: https://ffmpeg.org/download.html');
    }
};

const ensureFfmpegConfigured = () => {
    if (!ffmpegConfigurationPromise) {
        ffmpegConfigurationPromise = configureFfmpeg();
    }

    return ffmpegConfigurationPromise;
};

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

const SHARP_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const withInFlightThumbnail = async (thumbnailPath, generateThumbnail) => {
    const existingPromise = thumbnailGenerationPromises.get(thumbnailPath);
    if (existingPromise) {
        await existingPromise;
        return;
    }

    const generationPromise = Promise.resolve()
        .then(generateThumbnail)
        .finally(() => {
            thumbnailGenerationPromises.delete(thumbnailPath);
        });

    thumbnailGenerationPromises.set(thumbnailPath, generationPromise);
    await generationPromise;
};

class Media {
    constructor(path, thumbnailDir = './temp-pic/thumbnails') {
        this.src = path;
        this.thumbnailDir = resolve(thumbnailDir);
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

        if (!this.isValidMedia(mimeType) || !exists(image)) {
            return response.status(404).json({ error: 'Media file not found or invalid type' });
        }

        // Generate thumbnail in separate directory with hashed filename to avoid collisions
        const hash = crypto.createHash('md5').update(image).digest('hex');
        const ext = getFileExtension(image) || 'jpg';
        const thumbFilename = `${hash}.${ext}`;
        const thumb = path.join(this.thumbnailDir, thumbFilename);
        const thumbPath = thumb;
        
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
                await withInFlightThumbnail(thumbPath, async () => {
                    if (exists(thumb)) {
                        return;
                    }

                    await fs.mkdir(dirname(thumbPath), { recursive: true });

                    const extension = extname(image).toLowerCase();
                    const buffer = SHARP_IMAGE_EXTENSIONS.has(extension)
                        ? await this.generateSharpThumbnailBuffer(image, extension, width, height, quality)
                        : await this.generateGmThumbnailBuffer(image, width, height, quality);

                    await fs.writeFile(thumb, buffer);
                });
            }

            response.set('Cache-Control', 'public, max-age=86400'); // 24 hours
            response.sendFile(thumbPath);
        } catch (err) {
            console.error('Error in generateImageThumbnail:', err);
            response.status(500).json({ error: 'Internal server error' });
        }
    }

    async generateSharpThumbnailBuffer(image, extension, width, height, quality) {
        let pipeline = sharp(image)
            .rotate()
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });

        if (extension === '.png') {
            pipeline = pipeline.png({ compressionLevel: 6, quality });
        } else if (extension === '.webp') {
            pipeline = pipeline.webp({ quality });
        } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        }

        return pipeline.toBuffer();
    }

    async generateGmThumbnailBuffer(image, width, height, quality) {
        return new Promise((resolveBuffer, rejectBuffer) => {
            gm(image)
                .resize(width, height)
                .autoOrient()
                .quality(quality)
                .noProfile()
                .toBuffer((err, outputBuffer) => {
                    if (err) {
                        return rejectBuffer(err);
                    }

                    resolveBuffer(outputBuffer);
                });
        });
    }

    async generateVideoThumbnail(response, image, thumb, thumbPath) {
        try {
            await ensureFfmpegConfigured();

            // Generate PNG thumbnail for videos
            const pngThumb = thumb.replace(/\.[^/.]+$/, '.png'); // Replace extension with .png
            const pngThumbPath = thumbPath.replace(/\.[^/.]+$/, '.png');
            
            response.type("image/png");
            
            if (!exists(pngThumb)) {
                await withInFlightThumbnail(pngThumbPath, async () => {
                    if (exists(pngThumb)) {
                        return;
                    }

                    await fs.mkdir(dirname(pngThumbPath), { recursive: true });

                    const thumbnailName = path.basename(pngThumbPath);
                    const outputDir = path.dirname(pngThumbPath);
                    const captureTime = await this.getVideoThumbnailCaptureTime(image);

                    await this.captureVideoThumbnail(image, thumbnailName, outputDir, captureTime);
                });
            }

            response.set('Cache-Control', 'public, max-age=86400'); // 24 hours
            response.sendFile(pngThumbPath);
        } catch (err) {
            console.error('❌ Error in generateVideoThumbnail:', err);
            response.status(500).json({ error: 'Internal server error' });
        }
    }

    async getVideoThumbnailCaptureTime(image) {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(image, (err, metadata) => {
                if (err) {
                    console.warn(`⚠ Could not get video metadata, using default timestamp:`, err.message);
                    resolve('3');
                    return;
                }

                const duration = metadata.format.duration || 0;
                let captureTime = '3';

                if (duration > 0) {
                    if (duration > 120) {
                        captureTime = Math.floor(duration * 0.25).toString();
                    } else if (duration > 10) {
                        captureTime = Math.min(3, Math.floor(duration * 0.2)).toString();
                    } else {
                        captureTime = Math.min(0.5, duration * 0.5).toString();
                    }
                }

                console.log(`📹 Video duration: ${duration}s, capturing at ${captureTime}s`);
                resolve(captureTime);
            });
        });
    }

    // Helper function to capture video thumbnail at specified time
    async captureVideoThumbnail(videoPath, thumbnailName, outputDir, captureTime) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .on('end', () => {
                    console.log('✓ Video thumbnail generated successfully at', captureTime, 's');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Error generating video thumbnail:', err.message);
                    reject(err);
                })
                .screenshots({
                    timestamps: [captureTime], // Intelligent timestamp
                    filename: thumbnailName,
                    folder: outputDir,
                    size: '300x200'
                });
        });
    }
}

export default Media;