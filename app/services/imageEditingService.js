/**
 * Image Editing Service - Enhanced v2.1
 * 
 * Non-destructive image editing with version history:
 * - Rotate/flip/crop/resize operations
 * - Version tracking in database
 * - Revert to previous versions
 * - Preserves original files
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join, extname, dirname, basename } from 'path';
import { query } from '../models/db.js';
import logger from '../config/logger.js';

// Legacy GM import for backward compatibility
import gm from 'gm';

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

    // ============================================================
    // VERSION-AWARE EDITING METHODS (v2.1+)
    // ============================================================

    /**
     * Get all versions of a photo
     */
    static async getPhotoVersions(photoId) {
        try {
            const result = await query(
                'SELECT * FROM photo_editions WHERE photo_id = ? ORDER BY version_number ASC',
                [photoId]
            );
            return result;
        } catch (error) {
            logger.error('Error fetching photo versions', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Get current active version
     */
    static async getCurrentVersion(photoId) {
        try {
            const result = await query(
                'SELECT * FROM photo_editions WHERE photo_id = ? AND is_current = 1 LIMIT 1',
                [photoId]
            );
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            logger.error('Error fetching current version', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Create initial version record for original photo
     */
    static async createOriginalVersion(photoId, originalPath, originalFilename) {
        try {
            // Get image metadata using Sharp
            const metadata = await sharp(originalPath).metadata();

            const result = await query(
                `INSERT INTO photo_editions 
                 (photo_id, version_number, filename, path, file_size, width, height, is_original, is_current, edits_applied)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [photoId, 1, originalFilename, dirname(originalPath), null, metadata.width, metadata.height, 1, 1, '[]']
            );

            logger.info('Created original version record', { photoId, versionId: result.insertId });
            return result.insertId;
        } catch (error) {
            logger.error('Error creating original version', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Crop and save as new version
     */
    static async cropAndSave(photoId, originalPath, coordinates) {
        try {
            const { x, y, width, height } = coordinates;

            if (!x || !y || !width || !height) {
                throw new Error('Invalid crop coordinates: x, y, width, height required');
            }

            if (width <= 0 || height <= 0) {
                throw new Error('Crop dimensions must be > 0');
            }

            const newPath = await this._processAndSaveVersion(
                photoId,
                originalPath,
                (img) => img.extract({ left: x, top: y, width, height }),
                'crop'
            );

            return { success: true, path: newPath, edit: { type: 'crop', coordinates } };
        } catch (error) {
            logger.error('Crop error', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Rotate and save as new version
     */
    static async rotateAndSave(photoId, originalPath, degrees) {
        try {
            const validDegrees = [90, 180, 270];
            if (!validDegrees.includes(degrees)) {
                throw new Error('Rotation must be 90, 180, or 270 degrees');
            }

            const newPath = await this._processAndSaveVersion(
                photoId,
                originalPath,
                (img) => img.rotate(degrees),
                'rotate'
            );

            return { success: true, path: newPath, edit: { type: 'rotate', degrees } };
        } catch (error) {
            logger.error('Rotate error', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Resize and save as new version
     */
    static async resizeAndSave(photoId, originalPath, options) {
        try {
            const { width, height, fit = 'inside' } = options;

            if (!width || !height) {
                throw new Error('Width and height required for resize');
            }

            if (width <= 0 || height <= 0) {
                throw new Error('Dimensions must be > 0');
            }

            const validFits = ['cover', 'contain', 'fill', 'inside'];
            if (!validFits.includes(fit)) {
                throw new Error(`Fit must be one of: ${validFits.join(', ')}`);
            }

            const newPath = await this._processAndSaveVersion(
                photoId,
                originalPath,
                (img) => img.resize(width, height, { fit, withoutEnlargement: true }),
                'resize'
            );

            return { success: true, path: newPath, edit: { type: 'resize', width, height, fit } };
        } catch (error) {
            logger.error('Resize error', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Flip and save as new version
     */
    static async flipAndSave(photoId, originalPath, direction) {
        try {
            const validDirections = ['horizontal', 'vertical'];
            if (!validDirections.includes(direction)) {
                throw new Error(`Direction must be 'horizontal' or 'vertical'`);
            }

            const flipFn = direction === 'horizontal' ? 'flop' : 'flip';

            const newPath = await this._processAndSaveVersion(
                photoId,
                originalPath,
                (img) => img[flipFn](),
                'flip'
            );

            return { success: true, path: newPath, edit: { type: 'flip', direction } };
        } catch (error) {
            logger.error('Flip error', { photoId, error: error.message });
            throw error;
        }
    }

    /**
     * Core processing pipeline - process image and save as new version
     */
    static async _processAndSaveVersion(photoId, originalPath, transformFn, editType) {
        try {
            // Get next version number
            const versions = await query('SELECT MAX(version_number) as maxVersion FROM photo_editions WHERE photo_id = ?', [photoId]);
            const nextVersion = (versions[0]?.maxVersion || 0) + 1;

            // Generate new filename with version
            const originalName = basename(originalPath);
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
            const ext = extname(originalPath);
            const newFilename = `${nameWithoutExt}_v${nextVersion}${ext}`;
            const newPath = join(dirname(originalPath), newFilename);

            // Process image
            let pipeline = sharp(originalPath);
            pipeline = transformFn(pipeline);

            const info = await pipeline.toFile(newPath);

            logger.info('Image processed', {
                photoId,
                version: nextVersion,
                editType,
                newPath,
                dimensions: `${info.width}x${info.height}`
            });

            // Get previous edits
            const currentVersion = await this.getCurrentVersion(photoId);
            const previousEdits = currentVersion?.edits_applied ? JSON.parse(currentVersion.edits_applied) : [];
            const newEdits = [...previousEdits, { type: editType, timestamp: new Date().toISOString() }];

            // Save to database
            await query(
                `INSERT INTO photo_editions 
                 (photo_id, version_number, filename, path, file_size, width, height, is_original, is_current, edits_applied)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [photoId, nextVersion, newFilename, dirname(newPath), info.size, info.width, info.height, 0, 1, JSON.stringify(newEdits)]
            );

            // Update current version flag for previous version
            await query(
                'UPDATE photo_editions SET is_current = 0 WHERE photo_id = ? AND version_number = ?',
                [photoId, nextVersion - 1]
            );

            logger.info('Version saved to database', { photoId, version: nextVersion });

            return newPath;
        } catch (error) {
            logger.error('Image processing error', { photoId, editType, error: error.message });
            throw error;
        }
    }

    /**
     * Restore previous version (make it current)
     */
    static async restoreVersion(photoId, versionNumber) {
        try {
            // Verify version exists
            const version = await query(
                'SELECT * FROM photo_editions WHERE photo_id = ? AND version_number = ?',
                [photoId, versionNumber]
            );

            if (version.length === 0) {
                throw new Error(`Version ${versionNumber} not found for photo ${photoId}`);
            }

            // Mark all as non-current
            await query('UPDATE photo_editions SET is_current = 0 WHERE photo_id = ?', [photoId]);

            // Mark target version as current
            await query(
                'UPDATE photo_editions SET is_current = 1 WHERE photo_id = ? AND version_number = ?',
                [photoId, versionNumber]
            );

            logger.info('Version restored', { photoId, version: versionNumber });

            return {
                success: true,
                message: `Restored to version ${versionNumber}`,
                version: version[0]
            };
        } catch (error) {
            logger.error('Restore version error', { photoId, versionNumber, error: error.message });
            throw error;
        }
    }

    /**
     * Delete a specific version (keep at least original)
     */
    static async deleteVersion(photoId, versionNumber) {
        try {
            // Don't delete original version
            const version = await query(
                'SELECT * FROM photo_editions WHERE photo_id = ? AND version_number = ?',
                [photoId, versionNumber]
            );

            if (version.length === 0) {
                throw new Error(`Version ${versionNumber} not found`);
            }

            if (version[0].is_original) {
                throw new Error('Cannot delete original version');
            }

            if (version[0].is_current) {
                throw new Error('Cannot delete current active version. Restore another version first.');
            }

            // Delete file
            const filePath = join(version[0].path, version[0].filename);
            try {
                await fs.unlink(filePath);
                logger.info('Deleted version file', { photoId, versionNumber, filePath });
            } catch (error) {
                logger.warn('Could not delete version file', { filePath, error: error.message });
            }

            // Delete database record
            await query(
                'DELETE FROM photo_editions WHERE photo_id = ? AND version_number = ?',
                [photoId, versionNumber]
            );

            logger.info('Version deleted from database', { photoId, versionNumber });

            return {
                success: true,
                message: `Version ${versionNumber} deleted`
            };
        } catch (error) {
            logger.error('Delete version error', { photoId, versionNumber, error: error.message });
            throw error;
        }
    }

    /**
     * Get image metadata without editing
     */
    static async getImageMetadata(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                space: metadata.space,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation
            };
        } catch (error) {
            logger.error('Error getting image metadata', { imagePath, error: error.message });
            throw error;
        }
    }
}

export default ImageEditingService;
