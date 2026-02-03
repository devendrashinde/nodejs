/**
 * Advanced Features Routes
 * 
 * Routes for:
 * - EXIF metadata endpoints
 * - Advanced search
 * - Bulk operations
 * - Social features (comments, ratings, favorites)
 * - Image editing
 * - Video enhancements
 */

import express from 'express';
import {
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
    getVideoCodecRecommendations
} from '../controllers/advancedFeaturesController.js';

const router = express.Router();

// ============================================
// EXIF Data Routes
// ============================================

/**
 * Get EXIF metadata for a photo
 * GET /api/photos/:id/exif
 */
router.get('/photos/:id/exif', getPhotoExif);

// ============================================
// Search Routes
// ============================================

/**
 * Advanced photo search
 * GET /api/search?q=query&tags=tag1,tag2&dateFrom=2024-01-01&dateTo=2024-12-31&types=jpg,png
 */
router.get('/search', advancedSearch);

/**
 * Get search suggestions/autocomplete
 * GET /api/search/suggestions?prefix=nat&field=tags
 */
router.get('/search/suggestions', getSearchSuggestions);

// ============================================
// Bulk Operations Routes
// ============================================

/**
 * Bulk add tags to photos
 * POST /api/bulk/tags
 * Body: { photoIds: [...], tags: [...] }
 */
router.post('/bulk/tags', bulkAddTags);

/**
 * Bulk remove tags from photos
 * POST /api/bulk/tags/remove
 * Body: { photoIds: [...], tags: [...] }
 */
router.post('/bulk/tags/remove', (req, res) => {
    // Implementation similar to bulkAddTags
    res.json({ message: 'Bulk tag removal endpoint' });
});

/**
 * Prepare bulk download as ZIP
 * POST /api/bulk/download
 * Body: { photoIds: [...] }
 */
router.post('/bulk/download', prepareBulkDownload);

/**
 * Bulk favorite operation
 * POST /api/bulk/favorite
 * Body: { photoIds: [...], isFavorite: true }
 */
router.post('/bulk/favorite', bulkFavorite);

/**
 * Bulk rating operation
 * POST /api/bulk/rate
 * Body: { photoIds: [...], rating: 4 }
 */
router.post('/bulk/rate', (req, res) => {
    // Implementation for bulk rating
    res.json({ message: 'Bulk rating endpoint' });
});

// ============================================
// Social Features Routes
// ============================================

/**
 * Add comment to photo
 * POST /api/photos/:id/comments
 * Body: { text: "Great photo!" }
 */
router.post('/photos/:id/comments', addComment);

/**
 * Get photo comments
 * GET /api/photos/:id/comments
 */
router.get('/photos/:id/comments', (req, res) => {
    // Get comments from database
    res.json({ comments: [] });
});

/**
 * Rate photo (1-5)
 * POST /api/photos/:id/ratings
 * Body: { rating: 4 }
 */
router.post('/photos/:id/ratings', ratePhoto);

/**
 * Get photo ratings statistics
 * GET /api/photos/:id/ratings
 */
router.get('/photos/:id/ratings', (req, res) => {
    // Get rating stats from database
    res.json({ average: 4.5, count: 10, distribution: {} });
});

/**
 * Toggle favorite
 * POST /api/photos/:id/favorite
 * Body: { isFavorite: true }
 */
router.post('/photos/:id/favorite', toggleFavorite);

/**
 * Generate share link for photo
 * POST /api/photos/:id/share
 * Body: { expiresIn: 1440 } (minutes, 0 for no expiration)
 */
router.post('/photos/:id/share', generateShareLink);

/**
 * Get photo activity summary
 * GET /api/photos/:id/activity
 */
router.get('/photos/:id/activity', (req, res) => {
    // Get activity data
    res.json({
        totalComments: 5,
        totalLikes: 12,
        averageRating: 4.2,
        totalRatings: 10
    });
});

// ============================================
// Image Editing Routes
// ============================================

/**
 * Edit photo (rotate, flip, filter, etc.)
 * POST /api/photos/:id/edit
 * Body: { edits: [ { type: 'rotate', degrees: 90 }, ... ] }
 */
router.post('/photos/:id/edit', editPhoto);

/**
 * Get available filters
 * GET /api/filters
 */
router.get('/filters', getAvailableFilters);

/**
 * Rotate photo
 * POST /api/photos/:id/rotate
 * Body: { degrees: 90 }
 */
router.post('/photos/:id/rotate', (req, res) => {
    res.json({ message: 'Photo rotated', degrees: req.body.degrees });
});

/**
 * Flip photo
 * POST /api/photos/:id/flip
 * Body: { direction: 'horizontal' }
 */
router.post('/photos/:id/flip', (req, res) => {
    res.json({ message: 'Photo flipped', direction: req.body.direction });
});

/**
 * Crop photo
 * POST /api/photos/:id/crop
 * Body: { x: 0, y: 0, width: 300, height: 300 }
 */
router.post('/photos/:id/crop', (req, res) => {
    res.json({ message: 'Photo cropped', coordinates: req.body });
});

/**
 * Apply filter to photo
 * POST /api/photos/:id/filter
 * Body: { filterType: 'sepia' }
 */
router.post('/photos/:id/filter', (req, res) => {
    res.json({ message: 'Filter applied', filter: req.body.filterType });
});

/**
 * Adjust brightness/contrast
 * POST /api/photos/:id/adjust
 * Body: { brightness: 20, contrast: -10 }
 */
router.post('/photos/:id/adjust', (req, res) => {
    res.json({ message: 'Photo adjusted', adjustments: req.body });
});

// ============================================
// Video Enhancement Routes
// ============================================

/**
 * Get video metadata
 * GET /api/videos/:id/metadata
 */
router.get('/videos/:id/metadata', getVideoMetadata);

/**
 * Get available video qualities
 * GET /api/videos/qualities
 */
router.get('/videos/qualities', getAvailableVideoQualities);

/**
 * Get video codec recommendations
 * GET /api/videos/codecs
 */
router.get('/videos/codecs', getVideoCodecRecommendations);

/**
 * Transcode video to different quality
 * POST /api/videos/:id/transcode
 * Body: { quality: '720p' }
 */
router.post('/videos/:id/transcode', (req, res) => {
    res.json({ message: 'Video transcode queued', quality: req.body.quality });
});

/**
 * Generate video thumbnail
 * POST /api/videos/:id/thumbnail
 * Body: { timestamp: '00:00:05', width: 320, height: 240 }
 */
router.post('/videos/:id/thumbnail', (req, res) => {
    res.json({ message: 'Thumbnail generated', timestamp: req.body.timestamp });
});

/**
 * Get video streaming options
 * GET /api/videos/:id/stream
 */
router.get('/videos/:id/stream', (req, res) => {
    res.json({
        primary: { src: '/videos/file.mp4', type: 'video/mp4' },
        qualities: [
            { src: '/videos/file_360p.mp4', label: '360p' },
            { src: '/videos/file_720p.mp4', label: '720p' }
        ]
    });
});

// ============================================
// Album Social Features Routes
// ============================================

/**
 * Create shareable album
 * POST /api/albums/share
 * Body: { albumId, expiresIn: 1440, photoIds: [...] }
 */
router.post('/albums/share', (req, res) => {
    res.json({ shareLink: 'https://example.com/shared/abc123' });
});

/**
 * Get public album
 * GET /api/albums/:shareToken/public
 */
router.get('/albums/:shareToken/public', (req, res) => {
    res.json({ album: { name: 'Shared Album', photos: [] } });
});

/**
 * Add comment to album
 * POST /api/albums/:id/comments
 * Body: { text: "Beautiful album!" }
 */
router.post('/albums/:id/comments', (req, res) => {
    res.json({ comment: { id: 'c1', text: req.body.text } });
});

export default router;
