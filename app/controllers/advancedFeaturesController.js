/**
 * Advanced Features Controller
 * 
 * Handles routes for:
 * - EXIF data endpoints
 * - Advanced search
 * - Bulk operations
 * - Social features
 * - Image editing
 * - Video enhancements
 */

import ExifService from '../services/exifService.js';
import AdvancedSearchService from '../services/searchService.js';
import BulkOperationsService from '../services/bulkOperationsService.js';
import SocialFeaturesService from '../services/socialFeaturesService.js';
import ImageEditingService from '../services/imageEditingService.js';
import VideoEnhancementService from '../services/videoEnhancementService.js';
import Photo from '../models/photoModel.js';
import { query } from '../models/db.js';

/**
 * Get EXIF data for a photo
 * @route GET /api/photos/:id/exif
 */
export const getPhotoExif = async (req, res) => {
    try {
        let photoPath = req.params.id;
        
        // Validate path to prevent directory traversal
        if (photoPath.includes('..') || photoPath.startsWith('/')) {
            return res.status(400).json({ error: 'Invalid photo path' });
        }

        // Convert relative path to absolute path
        // Paths come as: data/pictures/photo.jpg or data/pictures/nature/photo.jpg
        if (!photoPath.startsWith('/')) {
            photoPath = `${process.cwd()}/${photoPath}`;
        }
        
        console.log(`Loading EXIF from: ${photoPath}`);
        const exifData = ExifService.extractExifData(photoPath);
        const summary = ExifService.getSummary(exifData);

        res.json({
            exif: exifData,
            summary,
            success: Object.keys(exifData).length > 0
        });
    } catch (err) {
        console.error('Error getting EXIF data:', err);
        res.status(500).json({ error: 'Failed to extract EXIF data', message: err.message });
    }
};

/**
 * Advanced photo search
 * @route GET /api/search
 */
export const advancedSearch = async (req, res) => {
    try {
        const criteria = {
            query: req.query.query || req.query.q,
            tags: req.query.tags ? req.query.tags.split(',').map(t => t.trim()) : [],
            tagMatchMode: req.query.tagMode === 'OR' ? 'any' : 'all',
            dateFrom: req.query['dateRange.from'],
            dateTo: req.query['dateRange.to'],
            fileTypes: req.query.fileTypes ? (Array.isArray(req.query.fileTypes) ? req.query.fileTypes : [req.query.fileTypes]) : [],
            album: req.query.album,
            size: req.query.size,
            sort: req.query.sort || 'name-asc'
        };

        // Fetch all photos from database
        const photos = await query("SELECT id, name, tags, album, path FROM photos");
        
        if (!photos || photos.length === 0) {
            return res.json({
                results: [],
                count: 0,
                statistics: {
                    totalPhotos: 0,
                    albums: [],
                    tags: [],
                    fileTypes: []
                },
                success: true
            });
        }

        // Transform photos to include necessary fields for search
        const transformedPhotos = photos.map(photo => {
            // Handle tags - could be string, array, null, or undefined
            let tagsArray = [];
            if (photo.tags) {
                if (typeof photo.tags === 'string') {
                    tagsArray = photo.tags.split(/[\s,]+/).filter(t => t && t.trim());
                } else if (Array.isArray(photo.tags)) {
                    tagsArray = photo.tags;
                }
            }
            
            // Construct full file path: path/album/name
            const fullPath = photo.path && photo.album && photo.name
                ? `${photo.path}/${photo.album}/${photo.name}`
                : photo.path || photo.name;
            
            return {
                id: photo.id,
                name: photo.name,
                tags: tagsArray,
                album: photo.album || 'Uncategorized',
                path: fullPath,
                url: fullPath,
                thumbnail: `/thumbs?id=${encodeURIComponent(fullPath)}&w=300&h=200`,
                dateModified: new Date() // You might want to add this field to DB
            };
        });

        // Perform search
        const results = AdvancedSearchService.search(transformedPhotos, criteria);
        const stats = AdvancedSearchService.getStatistics(transformedPhotos);

        res.json({
            results,
            count: results.length,
            statistics: stats,
            success: true
        });
    } catch (err) {
        console.error('Error during search:', err);
        res.status(500).json({ 
            error: 'Search failed', 
            message: err.message,
            success: false
        });
    }
};

/**
 * Get search suggestions for autocomplete
 * @route GET /api/photos/search/suggestions
 */
export const getSearchSuggestions = async (req, res) => {
    try {
        const { prefix = '', field = 'tags' } = req.query;

        // Mock data - in real implementation would fetch from database
        const mockPhotos = [];
        const suggestions = AdvancedSearchService.getSuggestions(mockPhotos, prefix, field);

        res.json({ suggestions });
    } catch (err) {
        console.error('Error getting suggestions:', err);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
};

/**
 * Bulk add tags to photos
 * @route POST /api/photos/bulk/tags
 */
export const bulkAddTags = async (req, res) => {
    try {
        const { photoIds, tags } = req.body;

        // Validate input
        if (!Array.isArray(photoIds) || !Array.isArray(tags)) {
            return res.status(400).json({ success: false, error: 'Invalid input format' });
        }

        const validation = BulkOperationsService.validateBulkOperation(photoIds);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        // In real implementation, would fetch photos and perform operations
        const mockPhotos = [];
        const batch = BulkOperationsService.bulkAddTags(photoIds, tags, mockPhotos);

        res.json({
            success: true,
            message: `Added ${tags.length} tag(s) to ${photoIds.length} photo(s)`,
            batchId: batch.id,
            total: batch.total,
            results: batch.results,
            status: batch.status
        });
    } catch (err) {
        console.error('Error in bulk tag operation:', err);
        res.status(500).json({ success: false, error: 'Bulk operation failed', message: err.message });
    }
};

/**
 * Prepare bulk download as ZIP
 * @route POST /api/photos/bulk/download
 */
export const prepareBulkDownload = async (req, res) => {
    try {
        const { photoIds } = req.body;

        // Validate input
        if (!Array.isArray(photoIds) || photoIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No photos selected' });
        }

        const validation = BulkOperationsService.validateBulkOperation(photoIds);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        // In real implementation, would fetch actual photos
        const mockPhotos = [];
        const downloadInfo = BulkOperationsService.prepareBulkDownload(photoIds, mockPhotos);

        res.json({
            success: true,
            message: `Prepared download for ${photoIds.length} photo(s)`,
            zipFilename: downloadInfo.zipFilename,
            totalFiles: downloadInfo.totalFiles,
            totalSize: downloadInfo.totalSize,
            batchId: downloadInfo.batch.id
        });
    } catch (err) {
        console.error('Error preparing download:', err);
        res.status(500).json({ success: false, error: 'Download preparation failed', message: err.message });
    }
};

/**
 * Bulk favorite operation
 * @route POST /api/photos/bulk/favorite
 */
export const bulkFavorite = async (req, res) => {
    try {
        const { photoIds, isFavorite = true } = req.body;
        // Use authenticated user, session user, or default guest user
        const userId = req.user?.id || req.session?.userId || 'guest';

        const batch = isFavorite 
            ? BulkOperationsService.bulkFavorite(photoIds, userId)
            : BulkOperationsService.bulkUnfavorite(photoIds, userId);

        res.json({
            success: true,
            message: `${isFavorite ? 'Added' : 'Removed'} ${photoIds.length} photo(s) ${isFavorite ? 'to' : 'from'} favorites`,
            batchId: batch.id,
            total: batch.total,
            action: isFavorite ? 'favorited' : 'unfavorited'
        });
    } catch (err) {
        console.error('Error in bulk favorite:', err);
        res.status(500).json({ success: false, error: 'Operation failed', message: err.message });
    }
};

/**
 * Add photo comment
 * @route POST /api/photos/:id/comments
 */
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const photoId = req.params.id;
        const userId = req.user?.id || req.session?.userId || 'anonymous';

        const comment = SocialFeaturesService.addComment(photoId, {
            userId,
            text,
            userName: req.user?.name || 'Anonymous'
        });

        res.json(comment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * Add photo rating
 * @route POST /api/photos/:id/ratings
 */
export const ratePhoto = async (req, res) => {
    try {
        const { rating } = req.body;
        const photoId = req.params.id;
        // Use authenticated user, session user, or default guest user
        const userId = req.user?.id || req.session?.userId || 'guest';

        const ratingRecord = SocialFeaturesService.addRating(photoId, userId, rating);
        res.json(ratingRecord);
    } catch (err) {
        console.error('Error rating photo:', err);
        res.status(400).json({ error: err.message });
    }
};

/**
/**
 * Toggle photo favorite
 * @route POST /api/photos/:id/favorite
 */
export const toggleFavorite = async (req, res) => {
    try {
        let photoPath = req.params.id;
        const { isFavorite = true } = req.body;
        
        // Validate path
        if (photoPath.includes('..') || photoPath.startsWith('/')) {
            return res.status(400).json({ error: 'Invalid photo path' });
        }

        const userId = req.user?.id || req.session?.userId || 'guest';
        
        // Extract photo name and album from path (e.g., "data/pictures/nature/photo.jpg")
        const pathParts = photoPath.split('/');
        const photoName = pathParts[pathParts.length - 1];
        const album = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'pictures';

        if (isFavorite) {
            // Add favorite to database
            const sql = `
                INSERT INTO favorites (user_id, photo_path, photo_name, album)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE created_at = NOW()
            `;
            await query(sql, [userId, photoPath, photoName, album]);
        } else {
            // Remove favorite from database
            const sql = `DELETE FROM favorites WHERE user_id = ? AND photo_path = ?`;
            await query(sql, [userId, photoPath]);
        }

        res.json({
            success: true,
            photoPath,
            userId,
            isFavorite,
            message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
        });
    } catch (err) {
        console.error('Error toggling favorite:', err);
        res.status(500).json({ error: 'Operation failed' });
    }
};

/**
 * Generate share link
 * @route POST /api/photos/:id/share
 */
export const generateShareLink = async (req, res) => {
    try {
        const { expiresIn = 1440 } = req.body; // Default 24 hours
        const photoId = req.params.id;

        const shareLink = SocialFeaturesService.generateShareLink(photoId, { expiresIn });

        res.json(shareLink);
    } catch (err) {
        console.error('Error generating share link:', err);
        res.status(500).json({ error: 'Failed to generate share link' });
    }
};

/**
 * Edit photo (rotate, flip, filters, etc.)
 * @route POST /api/photos/:id/edit
 */
export const editPhoto = async (req, res) => {
    try {
        const { edits } = req.body;
        const photoPath = req.params.id;

        if (!Array.isArray(edits) || edits.length === 0) {
            return res.status(400).json({ error: 'No edits provided' });
        }

        // Validate edits
        if (!ImageEditingService.validateEdits(edits)) {
            return res.status(400).json({ error: 'Invalid edit operations' });
        }

        const editedBuffer = await ImageEditingService.applyMultipleEdits(photoPath, edits);

        // In real implementation, would save and return edited photo info
        res.json({
            success: true,
            message: 'Photo edited successfully',
            editsApplied: edits.length
        });
    } catch (err) {
        console.error('Error editing photo:', err);
        res.status(500).json({ error: 'Failed to edit photo' });
    }
};

/**
 * Get available image filters
 * @route GET /api/photos/filters/available
 */
export const getAvailableFilters = (req, res) => {
    try {
        const filters = ImageEditingService.getAvailableFilters();
        res.json({ filters });
    } catch (err) {
        console.error('Error getting filters:', err);
        res.status(500).json({ error: 'Failed to get filters' });
    }
};

/**
 * Get video metadata
 * @route GET /api/videos/:id/metadata
 */
export const getVideoMetadata = async (req, res) => {
    try {
        const videoPath = req.params.id;

        const metadata = await VideoEnhancementService.extractMetadata(videoPath);

        res.json({
            metadata,
            duration: VideoEnhancementService.formatDuration(metadata.file.duration)
        });
    } catch (err) {
        console.error('Error extracting video metadata:', err);
        res.status(500).json({ error: 'Failed to extract metadata' });
    }
};

/**
 * Get available video qualities
 * @route GET /api/videos/qualities
 */
export const getAvailableVideoQualities = (req, res) => {
    try {
        const qualities = VideoEnhancementService.getAvailableQualities();
        res.json({ qualities });
    } catch (err) {
        console.error('Error getting qualities:', err);
        res.status(500).json({ error: 'Failed to get qualities' });
    }
};

/**
 * Get video codec recommendations
 * @route GET /api/videos/codecs
 */
export const getVideoCodecRecommendations = (req, res) => {
    try {
        const recommendations = VideoEnhancementService.getCodecRecommendations();
        res.json({ recommendations });
    } catch (err) {
        console.error('Error getting codec info:', err);
        res.status(500).json({ error: 'Failed to get codec information' });
    }
};

/**
 * Get all favorites for the current user
 * @route GET /api/favorites
 */
export const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user?.id || req.session?.userId || 'guest';
        
        const sql = `
            SELECT * FROM favorites 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        
        const results = await query(sql, [userId]);
        
        res.json({
            success: true,
            count: results.length,
            favorites: results
        });
    } catch (err) {
        console.error('Error getting favorites:', err);
        res.status(500).json({ error: 'Failed to get favorites' });
    }
};

/**
 * Check if a specific photo is favorited
 * @route GET /api/favorites/check/:path
 */
export const checkFavorite = async (req, res) => {
    try {
        let photoPath = req.params.path;
        
        // Validate path
        if (photoPath.includes('..') || photoPath.startsWith('/')) {
            return res.status(400).json({ error: 'Invalid photo path' });
        }

        const userId = req.user?.id || req.session?.userId || 'guest';
        
        const sql = `SELECT id FROM favorites WHERE user_id = ? AND photo_path = ?`;
        const results = await query(sql, [userId, photoPath]);
        
        res.json({
            success: true,
            isFavorite: results.length > 0,
            photoPath,
            userId
        });
    } catch (err) {
        console.error('Error checking favorite:', err);
        res.status(500).json({ error: 'Failed to check favorite status' });
    }
};

/**
 * Get favorites by album
 * @route GET /api/favorites/album/:album
 */
export const getFavoritesByAlbum = async (req, res) => {
    try {
        const userId = req.user?.id || req.session?.userId || 'guest';
        const { album } = req.params;
        
        const sql = `
            SELECT * FROM favorites 
            WHERE user_id = ? AND album = ? 
            ORDER BY created_at DESC
        `;
        
        const results = await query(sql, [userId, album]);
        
        res.json({
            success: true,
            album,
            count: results.length,
            favorites: results
        });
    } catch (err) {
        console.error('Error getting album favorites:', err);
        res.status(500).json({ error: 'Failed to get album favorites' });
    }
};

export default {
    getPhotoExif,
    advancedSearch,
    getSearchSuggestions,
    bulkAddTags,
    prepareBulkDownload,
    bulkFavorite,
    addComment,
    ratePhoto,
    toggleFavorite,
    generateShareLink,
    editPhoto,
    getAvailableFilters,
    getVideoMetadata,
    getAvailableVideoQualities,
    getVideoCodecRecommendations,
    getUserFavorites,
    checkFavorite,
    getFavoritesByAlbum
};
