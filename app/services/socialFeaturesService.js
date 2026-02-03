/**
 * Social Features Service
 * 
 * Manages social functionality:
 * - Share links with expiration
 * - Public/private album access
 * - Photo comments
 * - Photo favorites/ratings
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

class SocialFeaturesService {
    /**
     * Generate shareable link for a photo
     * @param {string} photoId - Photo ID
     * @param {Object} options - Share options
     * @param {number} options.expiresIn - Expiration time in minutes (0 = no expiration)
     * @param {string} options.viewerName - Name for viewer
     * @returns {Object} Share link object
     */
    static generateShareLink(photoId, options = {}) {
        const { expiresIn = 24 * 60, viewerName = 'Viewer' } = options;

        const shareToken = this._generateToken();
        const expiresAt = expiresIn > 0 
            ? new Date(Date.now() + expiresIn * 60 * 1000)
            : null;

        return {
            id: uuidv4(),
            photoId,
            token: shareToken,
            url: `/shared/${shareToken}`,
            expiresAt,
            expiresIn,
            viewerName,
            createdAt: new Date(),
            views: 0,
            isExpired: false
        };
    }

    /**
     * Generate shareable link for multiple photos (album)
     * @param {Array} photoIds - Array of photo IDs
     * @param {Object} options - Share options
     * @param {number} options.expiresIn - Expiration time in minutes
     * @param {string} options.albumName - Album name for sharing
     * @returns {Object} Album share link object
     */
    static generateAlbumShareLink(photoIds, options = {}) {
        const { expiresIn = 24 * 60, albumName = 'Shared Album' } = options;

        const shareToken = this._generateToken();
        const expiresAt = expiresIn > 0 
            ? new Date(Date.now() + expiresIn * 60 * 1000)
            : null;

        return {
            id: uuidv4(),
            photoIds,
            token: shareToken,
            url: `/shared-album/${shareToken}`,
            albumName,
            expiresAt,
            expiresIn,
            createdAt: new Date(),
            views: 0,
            maxViews: options.maxViews || null,
            isExpired: false
        };
    }

    /**
     * Check if share link is valid
     * @param {Object} shareLink - Share link object
     * @returns {boolean} True if valid
     */
    static isShareLinkValid(shareLink) {
        if (shareLink.isExpired) return false;
        if (!shareLink.expiresAt) return true;
        return new Date() < new Date(shareLink.expiresAt);
    }

    /**
     * Check if max views exceeded
     * @param {Object} shareLink - Share link object
     * @returns {boolean} True if exceeded
     */
    static isViewLimitExceeded(shareLink) {
        if (!shareLink.maxViews) return false;
        return shareLink.views >= shareLink.maxViews;
    }

    /**
     * Create album with access control
     * @param {Object} albumData - Album information
     * @param {string} albumData.name - Album name
     * @param {string} albumData.ownerId - Owner user ID
     * @param {boolean} albumData.isPublic - Public access flag
     * @returns {Object} Album object
     */
    static createAlbum(albumData) {
        const { name, ownerId, isPublic = false } = albumData;

        return {
            id: uuidv4(),
            name,
            ownerId,
            isPublic,
            photoIds: [],
            collaborators: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            description: '',
            coverPhotoId: null,
            accessLevel: isPublic ? 'public' : 'private'
        };
    }

    /**
     * Add comment to a photo
     * @param {string} photoId - Photo ID
     * @param {Object} commentData - Comment information
     * @param {string} commentData.userId - User ID
     * @param {string} commentData.text - Comment text
     * @param {string} commentData.userName - Display name
     * @returns {Object} Comment object
     */
    static addComment(photoId, commentData) {
        const { userId, text, userName = 'Anonymous' } = commentData;

        if (!text || text.trim().length === 0) {
            throw new Error('Comment cannot be empty');
        }

        if (text.length > 1000) {
            throw new Error('Comment exceeds maximum length of 1000 characters');
        }

        return {
            id: uuidv4(),
            photoId,
            userId,
            userName,
            text: text.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
            likes: 0,
            replies: []
        };
    }

    /**
     * Reply to a comment
     * @param {string} commentId - Comment ID
     * @param {Object} replyData - Reply information
     * @returns {Object} Reply object
     */
    static addCommentReply(commentId, replyData) {
        const { userId, text, userName = 'Anonymous' } = replyData;

        if (!text || text.trim().length === 0) {
            throw new Error('Reply cannot be empty');
        }

        return {
            id: uuidv4(),
            commentId,
            userId,
            userName,
            text: text.trim(),
            createdAt: new Date(),
            likes: 0
        };
    }

    /**
     * Add or update favorite
     * @param {string} photoId - Photo ID
     * @param {string} userId - User ID
     * @param {boolean} isFavorite - Favorite status
     * @returns {Object} Favorite object
     */
    static toggleFavorite(photoId, userId, isFavorite = true) {
        return {
            id: uuidv4(),
            photoId,
            userId,
            isFavorite,
            createdAt: new Date()
        };
    }

    /**
     * Add or update rating
     * @param {string} photoId - Photo ID
     * @param {string} userId - User ID
     * @param {number} rating - Rating 1-5
     * @returns {Object} Rating object
     */
    static addRating(photoId, userId, rating) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('Rating must be an integer between 1 and 5');
        }

        return {
            id: uuidv4(),
            photoId,
            userId,
            rating,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Calculate average rating for a photo
     * @param {Array} ratings - Array of rating objects
     * @returns {Object} Rating statistics
     */
    static calculateRatingStats(ratings) {
        if (ratings.length === 0) {
            return { average: 0, count: 0, distribution: {} };
        }

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;

        ratings.forEach(rating => {
            distribution[rating.rating]++;
            total += rating.rating;
        });

        return {
            average: (total / ratings.length).toFixed(1),
            count: ratings.length,
            distribution
        };
    }

    /**
     * Get photo activity summary
     * @param {Object} photo - Photo object
     * @returns {Object} Activity summary
     */
    static getActivitySummary(photo) {
        return {
            photoId: photo.id,
            totalComments: (photo.comments || []).length,
            totalLikes: (photo.favorites || []).length,
            averageRating: this.calculateRatingStats(photo.ratings || []).average,
            totalRatings: (photo.ratings || []).length,
            shares: (photo.shares || []).length,
            activityScore: this._calculateActivityScore(photo)
        };
    }

    /**
     * Calculate engagement score for a photo
     * @private
     */
    static _calculateActivityScore(photo) {
        let score = 0;

        score += (photo.comments || []).length * 3;      // Comments worth 3 points
        score += (photo.favorites || []).length * 2;     // Likes worth 2 points
        score += (photo.ratings || []).length;            // Ratings worth 1 point
        score += (photo.shares || []).length * 5;         // Shares worth 5 points
        score += (photo.views || 0);                       // Views worth 1 point

        return score;
    }

    /**
     * Generate access control object
     * @param {Object} permissions - Permission object
     * @returns {Object} Access control object
     */
    static createAccessControl(permissions = {}) {
        const {
            canView = true,
            canComment = true,
            canRate = true,
            canShare = true,
            canDownload = true,
            canEdit = false,
            canDelete = false
        } = permissions;

        return {
            canView,
            canComment,
            canRate,
            canShare,
            canDownload,
            canEdit,
            canDelete
        };
    }

    /**
     * Get default access levels
     * @returns {Object} Available access levels
     */
    static getAccessLevels() {
        return {
            public: {
                label: 'Public',
                description: 'Anyone can view',
                access: this.createAccessControl({ canEdit: false, canDelete: false })
            },
            protected: {
                label: 'Protected Link',
                description: 'Share with link',
                access: this.createAccessControl({ canEdit: false, canDelete: false })
            },
            private: {
                label: 'Private',
                description: 'Only owner and shared users',
                access: this.createAccessControl({ canEdit: false, canDelete: false })
            },
            collaborative: {
                label: 'Collaborative',
                description: 'Collaborators can comment and rate',
                access: this.createAccessControl({ canEdit: false, canDelete: false })
            }
        };
    }

    /**
     * Generate secure token for sharing
     * @private
     */
    static _generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Validate share link token
     * @param {string} token - Token to validate
     * @returns {boolean} True if valid token format
     */
    static isValidToken(token) {
        return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
    }
}

export default SocialFeaturesService;
