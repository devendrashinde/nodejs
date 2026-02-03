/**
 * Image Editing Service
 * 
 * Provides image manipulation capabilities:
 * - Rotate/flip operations
 * - Crop functionality
 * - Filters (sepia, grayscale, etc.)
 * - Brightness/contrast adjustment
 */

import gm from 'gm';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class ImageEditingService {
    /**
     * Rotate image by specified degrees
     * @param {string} sourcePath - Source image path
     * @param {number} degrees - Rotation angle (90, 180, 270, -90, -180, -270)
     * @returns {Promise<Buffer>} Edited image buffer
     */
    static async rotate(sourcePath, degrees) {
        return new Promise((resolve, reject) => {
            // Normalize degrees
            const normalizedDegrees = ((degrees % 360) + 360) % 360;

            gm(sourcePath)
                .rotate('black', normalizedDegrees)
                .toBuffer((err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer);
                });
        });
    }

    /**
     * Flip image horizontally or vertically
     * @param {string} sourcePath - Source image path
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Promise<Buffer>} Edited image buffer
     */
    static async flip(sourcePath, direction = 'horizontal') {
        return new Promise((resolve, reject) => {
            let gmCmd = gm(sourcePath);

            if (direction === 'horizontal') {
                gmCmd = gmCmd.flop();
            } else if (direction === 'vertical') {
                gmCmd = gmCmd.flip();
            }

            gmCmd.toBuffer((err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }

    /**
     * Crop image to specified dimensions
     * @param {string} sourcePath - Source image path
     * @param {Object} options - Crop options
     * @param {number} options.x - X coordinate (from left)
     * @param {number} options.y - Y coordinate (from top)
     * @param {number} options.width - Width of crop
     * @param {number} options.height - Height of crop
     * @returns {Promise<Buffer>} Cropped image buffer
     */
    static async crop(sourcePath, options = {}) {
        const { x = 0, y = 0, width = 100, height = 100 } = options;

        return new Promise((resolve, reject) => {
            gm(sourcePath)
                .crop(width, height, x, y)
                .toBuffer((err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer);
                });
        });
    }

    /**
     * Resize image
     * @param {string} sourcePath - Source image path
     * @param {Object} options - Resize options
     * @param {number} options.width - Target width
     * @param {number} options.height - Target height
     * @param {boolean} options.fit - Fit within dimensions (default: true)
     * @returns {Promise<Buffer>} Resized image buffer
     */
    static async resize(sourcePath, options = {}) {
        const { width = 800, height = 600, fit = true } = options;

        return new Promise((resolve, reject) => {
            let gmCmd = gm(sourcePath);

            if (fit) {
                gmCmd = gmCmd.resize(width, height, '>');
            } else {
                gmCmd = gmCmd.resize(width, height, '!');
            }

            gmCmd.toBuffer((err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }

    /**
     * Apply color filter
     * @param {string} sourcePath - Source image path
     * @param {string} filterType - Filter type (sepia, grayscale, solarize, sharpen, blur)
     * @returns {Promise<Buffer>} Filtered image buffer
     */
    static async applyFilter(sourcePath, filterType = 'sepia') {
        return new Promise((resolve, reject) => {
            let gmCmd = gm(sourcePath);

            switch (filterType) {
                case 'sepia':
                    gmCmd = gmCmd.sepia();
                    break;
                case 'grayscale':
                case 'grayscale':
                    gmCmd = gmCmd.colorspace('Gray');
                    break;
                case 'solarize':
                    gmCmd = gmCmd.solarize();
                    break;
                case 'sharpen':
                    gmCmd = gmCmd.sharpen(0, 1.5);
                    break;
                case 'blur':
                    gmCmd = gmCmd.blur(2, 1);
                    break;
                case 'negate':
                    gmCmd = gmCmd.negate();
                    break;
                case 'emboss':
                    gmCmd = gmCmd.emboss();
                    break;
                case 'charcoal':
                    gmCmd = gmCmd.charcoal(2);
                    break;
                default:
                    return reject(new Error(`Unknown filter: ${filterType}`));
            }

            gmCmd.toBuffer((err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }

    /**
     * Adjust brightness and contrast
     * @param {string} sourcePath - Source image path
     * @param {Object} options - Adjustment options
     * @param {number} options.brightness - Brightness adjustment (-100 to 100)
     * @param {number} options.contrast - Contrast adjustment (-100 to 100)
     * @returns {Promise<Buffer>} Adjusted image buffer
     */
    static async adjustBrightnessContrast(sourcePath, options = {}) {
        let { brightness = 0, contrast = 0 } = options;

        // Clamp values
        brightness = Math.max(-100, Math.min(100, brightness));
        contrast = Math.max(-100, Math.min(100, contrast));

        return new Promise((resolve, reject) => {
            let gmCmd = gm(sourcePath);

            // Apply brightness (0-200, 100 is neutral)
            if (brightness !== 0) {
                const gmBrightness = Math.round(100 + brightness);
                gmCmd = gmCmd.brightness(gmBrightness);
            }

            // Apply contrast (0-200, 100 is neutral)
            if (contrast !== 0) {
                const gmContrast = Math.round(100 + contrast);
                gmCmd = gmCmd.contrast(gmContrast);
            }

            gmCmd.toBuffer((err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }

    /**
     * Apply multiple edits in sequence
     * @param {string} sourcePath - Source image path
     * @param {Array} edits - Array of edit operations
     * @returns {Promise<Buffer>} Edited image buffer
     */
    static async applyMultipleEdits(sourcePath, edits = []) {
        let result = sourcePath;
        let buffer = null;

        for (const edit of edits) {
            try {
                switch (edit.type) {
                    case 'rotate':
                        buffer = await this.rotate(result, edit.degrees);
                        break;
                    case 'flip':
                        buffer = await this.flip(result, edit.direction);
                        break;
                    case 'crop':
                        buffer = await this.crop(result, edit.options);
                        break;
                    case 'resize':
                        buffer = await this.resize(result, edit.options);
                        break;
                    case 'filter':
                        buffer = await this.applyFilter(result, edit.filterType);
                        break;
                    case 'brightness-contrast':
                        buffer = await this.adjustBrightnessContrast(result, edit.options);
                        break;
                }

                // Use buffer as input for next edit
                if (buffer) {
                    result = buffer;
                }
            } catch (err) {
                throw new Error(`Error applying ${edit.type}: ${err.message}`);
            }
        }

        return result;
    }

    /**
     * Save edited image with optional backup
     * @param {Buffer} imageBuffer - Edited image buffer
     * @param {string} targetPath - Where to save
     * @param {boolean} createBackup - Whether to backup original
     * @returns {Promise<void>}
     */
    static async saveEdited(imageBuffer, targetPath, createBackup = true) {
        try {
            // Create backup if file exists
            if (createBackup) {
                const backupPath = `${targetPath}.backup`;
                try {
                    // Note: In real implementation, would copy existing file
                } catch (err) {
                    console.warn(`Could not create backup: ${err.message}`);
                }
            }

            // Save edited image
            await writeFile(targetPath, imageBuffer);
        } catch (err) {
            throw new Error(`Failed to save edited image: ${err.message}`);
        }
    }

    /**
     * Get available filters list
     * @returns {Array} List of filter names
     */
    static getAvailableFilters() {
        return [
            { name: 'sepia', label: 'Sepia Tone' },
            { name: 'grayscale', label: 'Grayscale' },
            { name: 'solarize', label: 'Solarize' },
            { name: 'negate', label: 'Negate' },
            { name: 'sharpen', label: 'Sharpen' },
            { name: 'blur', label: 'Blur' },
            { name: 'emboss', label: 'Emboss' },
            { name: 'charcoal', label: 'Charcoal' }
        ];
    }

    /**
     * Validate edit operations
     * @param {Array} edits - Edit operations to validate
     * @returns {boolean} True if valid
     */
    static validateEdits(edits = []) {
        const validTypes = ['rotate', 'flip', 'crop', 'resize', 'filter', 'brightness-contrast'];

        return edits.every(edit => {
            if (!validTypes.includes(edit.type)) return false;

            switch (edit.type) {
                case 'rotate':
                    return Number.isInteger(edit.degrees) && edit.degrees % 90 === 0;
                case 'flip':
                    return ['horizontal', 'vertical'].includes(edit.direction);
                case 'crop':
                    return edit.options && Number.isInteger(edit.options.width) && Number.isInteger(edit.options.height);
                case 'resize':
                    return edit.options && Number.isInteger(edit.options.width) && Number.isInteger(edit.options.height);
                case 'filter':
                    return this.getAvailableFilters().map(f => f.name).includes(edit.filterType);
                case 'brightness-contrast':
                    return edit.options && Number.isInteger(edit.options.brightness) && Number.isInteger(edit.options.contrast);
                default:
                    return false;
            }
        });
    }
}

export default ImageEditingService;
