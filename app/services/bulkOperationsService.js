/**
 * Bulk Operations Service
 * 
 * Handles bulk photo operations:
 * - Multi-select and batch operations
 * - Bulk tagging
 * - Bulk delete/move
 * - Bulk download as ZIP
 */

import archiver from 'archiver';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../models/db.js';

class BulkOperationsService {
    /**
     * Create bulk operation batch
     * @param {Array} photoIds - Selected photo IDs
     * @param {string} operationType - Type of operation
     * @returns {Object} Batch object
     */
    static createBatch(photoIds, operationType) {
        const validOperations = ['tag', 'delete', 'move', 'download', 'favorite', 'rate', 'comment'];

        if (!validOperations.includes(operationType)) {
            throw new Error(`Invalid operation type: ${operationType}`);
        }

        return {
            id: uuidv4(),
            photoIds,
            operationType,
            createdAt: new Date(),
            status: 'pending',
            progress: 0,
            total: photoIds.length,
            results: [],
            errors: []
        };
    }

    /**
     * Bulk add tags to photos
     * @param {Array} photoIds - Photo IDs
     * @param {Array} tags - Tags to add
     * @param {Array} photos - Photo objects to update
     * @returns {Object} Operation result
     */
    static bulkAddTags(photoIds, tags, photos = []) {
        const batch = this.createBatch(photoIds, 'tag');
        const tagString = tags.join(', ');

        const results = photoIds.map(photoId => {
            try {
                const photo = photos.find(p => p.id === photoId);
                if (!photo) {
                    throw new Error(`Photo not found: ${photoId}`);
                }

                // Add tags without duplicates
                const existingTags = (photo.tags || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t);

                const newTags = tags.filter(t => !existingTags.includes(t));
                const allTags = [...existingTags, ...newTags].join(', ');

                return {
                    photoId,
                    success: true,
                    oldTags: existingTags,
                    newTags: allTags,
                    addedTags: newTags
                };
            } catch (err) {
                return {
                    photoId,
                    success: false,
                    error: err.message
                };
            }
        });

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Bulk remove tags from photos
     * @param {Array} photoIds - Photo IDs
     * @param {Array} tagsToRemove - Tags to remove
     * @param {Array} photos - Photo objects
     * @returns {Object} Operation result
     */
    static bulkRemoveTags(photoIds, tagsToRemove, photos = []) {
        const batch = this.createBatch(photoIds, 'tag');

        const results = photoIds.map(photoId => {
            try {
                const photo = photos.find(p => p.id === photoId);
                if (!photo) {
                    throw new Error(`Photo not found: ${photoId}`);
                }

                const currentTags = (photo.tags || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t);

                const remainingTags = currentTags.filter(t => !tagsToRemove.includes(t));
                const removedTags = currentTags.filter(t => tagsToRemove.includes(t));

                return {
                    photoId,
                    success: true,
                    oldTags: currentTags,
                    newTags: remainingTags,
                    removedTags
                };
            } catch (err) {
                return {
                    photoId,
                    success: false,
                    error: err.message
                };
            }
        });

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    static normalizeFavoritePaths(photoIds) {
        if (!Array.isArray(photoIds) || !photoIds.length || photoIds.length > 1000) {
            throw Object.assign(new Error('Select between 1 and 1000 media files.'), { statusCode: 400 });
        }
        const paths = photoIds.map(photoId => {
            if (typeof photoId !== 'string') {
                throw Object.assign(new Error('Selected media must be file paths.'), { statusCode: 400 });
            }
            const normalized = photoId.replaceAll('\\', '/');
            const segments = normalized.split('/');
            if (normalized.length > 1000 || segments[0] !== 'data' || segments.length < 2 || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes(':') || segment.includes('\0')) || segments.at(-1).length > 500 || segments.at(-2).length > 500) {
                throw Object.assign(new Error('Invalid selected media path.'), { statusCode: 400 });
            }
            return normalized;
        });
        return [...new Set(paths)];
    }

    /**
     * Bulk add favorite to photos
     * @param {Array} photoIds - Selected media paths
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Operation result
     */
    static async bulkFavorite(photoIds, userId) {
        const paths = this.normalizeFavoritePaths(photoIds);
        const batch = this.createBatch(paths, 'favorite');
        const values = paths.map(photoPath => {
            const segments = photoPath.split('/');
            return [userId, photoPath, segments.at(-1), segments.length > 2 ? segments.at(-2) : 'pictures'];
        });
        await query(
            'INSERT INTO favorites (user_id, photo_path, photo_name, album) VALUES ? ON DUPLICATE KEY UPDATE created_at = NOW()',
            [values]
        );

        const results = paths.map(photoId => ({
            photoId,
            userId,
            isFavorite: true,
            createdAt: new Date()
        }));

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Bulk remove favorite from photos
    * @param {Array} photoIds - Selected media paths
     * @param {string} userId - User ID
    * @returns {Promise<Object>} Operation result
     */
    static async bulkUnfavorite(photoIds, userId) {
        const paths = this.normalizeFavoritePaths(photoIds);
        const batch = this.createBatch(paths, 'favorite');
        await query('DELETE FROM favorites WHERE user_id = ? AND photo_path IN (?)', [userId, paths]);

        const results = paths.map(photoId => ({
            photoId,
            userId,
            isFavorite: false,
            removedAt: new Date()
        }));

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Bulk apply rating to photos
     * @param {Array} photoIds - Photo IDs
     * @param {string} userId - User ID
     * @param {number} rating - Rating 1-5
     * @returns {Object} Operation result
     */
    static bulkRate(photoIds, userId, rating) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const batch = this.createBatch(photoIds, 'rate');

        const results = photoIds.map(photoId => ({
            photoId,
            userId,
            rating,
            createdAt: new Date()
        }));

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Prepare bulk download as ZIP
     * @param {Array} photoIds - Photo IDs
     * @param {Array} photos - Photo objects with paths
     * @returns {Object} Download batch info
     */
    static prepareBulkDownload(photoIds, photos = []) {
        const batch = this.createBatch(photoIds, 'download');

        const filesToInclude = photoIds.map(photoId => {
            const photo = photos.find(p => p.id === photoId);
            if (!photo) {
                return {
                    photoId,
                    success: false,
                    error: 'Photo not found'
                };
            }

            return {
                photoId,
                path: photo.path,
                name: photo.name,
                success: true
            };
        });

        batch.results = filesToInclude;
        const totalSize = filesToInclude
            .filter(f => f.success)
            .reduce((sum, f) => sum + (photos.find(p => p.id === f.photoId)?.fileSize || 0), 0);

        return {
            batch,
            totalSize,
            totalFiles: filesToInclude.filter(f => f.success).length,
            zipFilename: `photos-${Date.now()}.zip`
        };
    }

    /**
     * Create ZIP archive from photos
     * @param {Array} filePaths - File paths to include
     * @param {string} outputPath - Where to save ZIP
     * @returns {Promise<string>} Path to created ZIP file
     */
    static async createZipArchive(filePaths, outputPath) {
        return new Promise((resolve, reject) => {
            const output = createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', reject);
            output.on('close', () => resolve(outputPath));
            output.on('error', reject);

            archive.pipe(output);

            filePaths.forEach(filePath => {
                try {
                    archive.file(filePath, { name: path.basename(filePath) });
                } catch (err) {
                    console.error(`Failed to add ${filePath} to ZIP:`, err);
                }
            });

            archive.finalize();
        });
    }

    /**
     * Bulk move photos to different album
     * @param {Array} photoIds - Photo IDs
     * @param {string} targetAlbum - Target album path
     * @param {Array} photos - Photo objects
     * @returns {Object} Operation result
     */
    static bulkMove(photoIds, targetAlbum, photos = []) {
        const batch = this.createBatch(photoIds, 'move');

        const results = photoIds.map(photoId => {
            const photo = photos.find(p => p.id === photoId);
            if (!photo) {
                return {
                    photoId,
                    success: false,
                    error: 'Photo not found'
                };
            }

            return {
                photoId,
                oldAlbum: photo.album,
                newAlbum: targetAlbum,
                sourcePath: photo.path,
                targetPath: path.join(targetAlbum, photo.name),
                success: true
            };
        });

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Bulk delete photos
     * @param {Array} photoIds - Photo IDs
     * @param {boolean} createBackup - Whether to create backups
     * @returns {Object} Operation result
     */
    static bulkDelete(photoIds, createBackup = true) {
        const batch = this.createBatch(photoIds, 'delete');

        const results = photoIds.map(photoId => ({
            photoId,
            deleted: true,
            backupCreated: createBackup,
            deletedAt: new Date()
        }));

        batch.results = results;
        batch.status = 'completed';
        batch.progress = 100;

        return batch;
    }

    /**
     * Get bulk operation statistics
     * @param {Array} batches - Array of batch operations
     * @returns {Object} Statistics
     */
    static getOperationStats(batches = []) {
        const stats = {
            totalOperations: batches.length,
            byType: {},
            successful: 0,
            failed: 0,
            inProgress: 0,
            totalPhotosAffected: 0
        };

        batches.forEach(batch => {
            // Count by type
            stats.byType[batch.operationType] = (stats.byType[batch.operationType] || 0) + 1;

            // Count by status
            if (batch.status === 'completed') {
                const successful = batch.results.filter(r => r.success !== false).length;
                const failed = batch.results.filter(r => r.success === false).length;
                stats.successful += successful;
                stats.failed += failed;
            } else if (batch.status === 'in-progress') {
                stats.inProgress++;
            }

            stats.totalPhotosAffected += batch.total;
        });

        return stats;
    }

    /**
     * Validate bulk operation
     * @param {Array} photoIds - Photo IDs to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    static validateBulkOperation(photoIds, options = {}) {
        const {
            maxPhotos = 1000,
            minPhotos = 1
        } = options;

        const errors = [];

        if (!Array.isArray(photoIds)) {
            errors.push('photoIds must be an array');
        }

        if (photoIds.length < minPhotos) {
            errors.push(`At least ${minPhotos} photo(s) required`);
        }

        if (photoIds.length > maxPhotos) {
            errors.push(`Maximum ${maxPhotos} photos allowed per operation`);
        }

        const uniqueIds = new Set(photoIds);
        if (uniqueIds.size !== photoIds.length) {
            errors.push('Duplicate photo IDs found');
        }

        return {
            valid: errors.length === 0,
            errors,
            photoCount: photoIds.length
        };
    }
}

export default BulkOperationsService;
