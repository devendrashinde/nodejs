/**
 * Auto-Tagging Service using Local ML Models
 * 
 * Features:
 * - TensorFlow.js + MobileNet for object detection
 * - EXIF data extraction for camera/date tags
 * - Filename-based tag extraction
 * - Album/folder-based tags
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';
import ExifService from './exifService.js';

class AutoTaggingService {
    constructor() {
        this.model = null;
        this.isInitialized = false;
        this.taggingQueue = [];
        this.isProcessing = false;
    }

    /**
     * Initialize the ML model (loads once and caches)
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🧠 Loading MobileNet model...');
            this.model = await mobilenet.load();
            this.isInitialized = true;
            console.log('✓ MobileNet model loaded successfully');
        } catch (err) {
            console.error('Failed to load MobileNet model:', err);
            throw err;
        }
    }

    /**
     * Auto-tag a single photo using ML + EXIF + filename analysis
     * @param {string} photoPath - Full path to photo
     * @param {object} options - Tagging options
     * @returns {object} Generated tags and metadata
     */
    async autoTagPhoto(photoPath, options = {}) {
        const {
            skipExisting = false,
            confidenceThreshold = 0.5,
            maxTags = 10,
            includeDateTags = true,
            includeExifTags = true,
            includeFilenameTags = true,
            includeAlbumTags = true
        } = options;

        try {
            // Check if file exists
            if (!fs.existsSync(photoPath)) {
                return { success: false, error: 'File not found' };
            }

            // Check if it's an image
            const ext = path.extname(photoPath).toLowerCase();
            const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
            if (!imageExts.includes(ext)) {
                return { success: false, error: 'Not an image file', tags: [] };
            }

            const allTags = new Set();

            // 1. ML-based object detection
            const mlTags = await this.detectObjectsInImage(photoPath, confidenceThreshold, maxTags);
            mlTags.forEach(tag => allTags.add(tag.toLowerCase()));

            // 2. EXIF-based tags
            if (includeExifTags) {
                const exifTags = this.extractExifTags(photoPath, includeDateTags);
                exifTags.forEach(tag => allTags.add(tag.toLowerCase()));
            }

            // 3. Filename-based tags
            if (includeFilenameTags) {
                const filenameTags = this.extractFilenameTag(photoPath);
                filenameTags.forEach(tag => allTags.add(tag.toLowerCase()));
            }

            // 4. Album/folder-based tags
            if (includeAlbumTags) {
                const albumTags = this.extractAlbumTags(photoPath);
                albumTags.forEach(tag => allTags.add(tag.toLowerCase()));
            }

            return {
                success: true,
                tags: Array.from(allTags).slice(0, maxTags),
                mlTags,
                path: photoPath
            };

        } catch (err) {
            console.error(`Error auto-tagging ${photoPath}:`, err);
            return { success: false, error: err.message, tags: [] };
        }
    }

    /**
     * Detect objects in image using MobileNet
     * @param {string} imagePath - Path to image
     * @param {number} threshold - Confidence threshold
     * @param {number} maxPredictions - Max number of predictions
     * @returns {Array} Detected object tags
     */
    async detectObjectsInImage(imagePath, threshold = 0.5, maxPredictions = 5) {
        try {
            // Ensure model is loaded
            await this.initialize();

            // Load and process the image with jimp
            const image = await Jimp.read(imagePath);
            
            // Resize to 224x224 for MobileNet (width, height format)
            await image.resize({ w: 224, h: 224 });
            
            // Convert to tensor
            const imageData = new Uint8Array(224 * 224 * 3);
            let idx = 0;
            image.scan(0, 0, 224, 224, function(x, y, idx2) {
                imageData[idx++] = this.bitmap.data[idx2 + 0]; // R
                imageData[idx++] = this.bitmap.data[idx2 + 1]; // G
                imageData[idx++] = this.bitmap.data[idx2 + 2]; // B
            });
            
            const tensor = tf.tensor3d(imageData, [224, 224, 3]);
            const normalized = tensor.div(255.0).expandDims(0);

            // Get predictions
            const predictions = await this.model.classify(normalized);

            // Clean up tensors
            tensor.dispose();
            normalized.dispose();

            // Filter by confidence and extract class names
            return predictions
                .filter(pred => pred.probability >= threshold)
                .slice(0, maxPredictions)
                .map(pred => this.cleanClassName(pred.className));

        } catch (err) {
            console.error('Error detecting objects:', err);
            return [];
        }
    }

    /**
     * Extract tags from EXIF data
     * @param {string} photoPath - Path to photo
     * @param {boolean} includeDates - Include date-based tags
     * @returns {Array} EXIF-based tags
     */
    extractExifTags(photoPath, includeDates = true) {
        const tags = [];

        try {
            if (!ExifService || typeof ExifService.extractExifData !== 'function') {
                console.warn('ExifService not available, skipping EXIF extraction');
                return tags;
            }
            const exifData = ExifService.extractExifData(photoPath);

            // Camera model
            if (exifData.camera && exifData.camera.model) {
                tags.push(exifData.camera.model.replace(/[^\w\s]/gi, '').trim());
            }

            // Date tags
            if (includeDates && exifData.shooting && exifData.shooting.dateTimeOriginal) {
                let dateStr = exifData.shooting.dateTimeOriginal;
                // Handle new object format {raw, display, iso}
                if (typeof dateStr === 'object' && dateStr.iso) {
                    dateStr = dateStr.iso;
                } else if (typeof dateStr === 'object' && dateStr.display) {
                    dateStr = dateStr.display;
                }
                
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    tags.push(date.getFullYear().toString());
                    tags.push(date.toLocaleString('en-US', { month: 'long' }).toLowerCase());
                }
            }

            // Scene type (if available in shooting parameters)
            if (exifData.shooting && exifData.shooting.exposureProgram) {
                tags.push(exifData.shooting.exposureProgram.toLowerCase());
            }

        } catch (err) {
            // EXIF extraction failed - not critical
        }

        return tags;
    }

    /**
     * Extract tags from filename (only meaningful tags)
     * @param {string} photoPath - Path to photo
     * @returns {Array} Filename-based tags
     */
    extractFilenameTag(photoPath) {
        const tags = [];
        const filename = photoPath.split('/').pop().replace(path.extname(photoPath), '');

        // Skip if filename looks like a hash (long hex or alphanumeric string)
        if (/^[a-f0-9]{32,}$/i.test(filename) || /^[a-z0-9]{40,}$/i.test(filename)) {
            return tags; // Likely a hash, skip
        }

        // Extract year from date patterns (YYYYMMDD, YYYY-MM-DD, etc.)
        const datePattern = /(\d{4})[-_]?(\d{2})[-_]?(\d{2})/;
        const dateMatch = filename.match(datePattern);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            // Only add year if it's reasonable (1990-2030)
            if (year >= 1990 && year <= 2030) {
                tags.push(dateMatch[1]);
            }
        }

        // Extract meaningful words separated by underscore, dash, or space
        const words = filename
            .replace(/[_\-\.]/g, ' ')
            .split(/\s+/)
            .filter(word => {
                // Must be 3+ chars
                if (word.length < 3) return false;
                
                // Skip pure numbers
                if (/^\d+$/.test(word)) return false;
                
                // Skip common camera prefixes
                if (/^(img|dsc|dcim|p|pic|photo|image|file)\d*$/i.test(word)) return false;
                
                // Skip hex-like strings
                if (word.length > 8 && /^[a-f0-9]+$/i.test(word)) return false;
                
                // Only include words with mostly letters
                const letterCount = (word.match(/[a-z]/gi) || []).length;
                return letterCount >= word.length * 0.6;
            })
            .map(word => word.toLowerCase());

        tags.push(...words);

        return tags;
    }

    /**
     * Extract tags from album/folder path
     * @param {string} photoPath - Path to photo
     * @returns {Array} Album-based tags
     */
    extractAlbumTags(photoPath) {
        const tags = [];
        const parts = photoPath.split('/');

        // Get album name (second to last part)
        if (parts.length >= 2) {
            const album = parts[parts.length - 2];
            if (album && album !== 'data' && album !== 'pictures') {
                tags.push(album.toLowerCase());
            }
        }

        return tags;
    }

    /**
     * Clean up ML class names to readable tags
     * @param {string} className - Raw class name from model
     * @returns {string} Cleaned tag
     */
    cleanClassName(className) {
        // MobileNet returns format like "golden retriever, dog"
        // Take the most specific term
        const parts = className.split(',').map(p => p.trim());
        return parts[0].toLowerCase().replace(/[^\w\s]/g, '');
    }

    /**
     * Batch process multiple photos
     * @param {Array} photoPaths - Array of photo paths
     * @param {object} options - Tagging options
     * @param {function} progressCallback - Called with progress updates
     * @returns {object} Results summary
     */
    async batchAutoTag(photoPaths, options = {}, progressCallback = null) {
        const results = {
            total: photoPaths.length,
            success: 0,
            failed: 0,
            tags: {}
        };

        // Ensure model is loaded once before batch
        await this.initialize();

        for (let i = 0; i < photoPaths.length; i++) {
            const photoPath = photoPaths[i];
            
            if (progressCallback) {
                progressCallback({
                    current: i + 1,
                    total: photoPaths.length,
                    photo: photoPath,
                    progress: Math.round(((i + 1) / photoPaths.length) * 100)
                });
            }

            const result = await this.autoTagPhoto(photoPath, options);
            
            if (result.success) {
                results.success++;
                results.tags[photoPath] = result.tags;
            } else {
                results.failed++;
            }

            // Small delay to prevent CPU overload
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }
}

// Export singleton instance
export default new AutoTaggingService();
