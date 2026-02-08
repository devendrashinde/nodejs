/**
 * Recently Viewed Service
 * Tracks and manages recently viewed albums and photos using localStorage
 */
angular.module('RecentlyViewedService', [])
    .service('RecentlyViewedService', function() {
        var MAX_RECENT_ITEMS = 10; // Maximum number of recent items to store
        var STORAGE_KEY = 'photoGallery_recentlyViewed';
        
        /**
         * Get recently viewed items from localStorage
         */
        this.getRecentlyViewed = function() {
            try {
                var stored = localStorage.getItem(STORAGE_KEY);
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error('Error reading recently viewed:', e);
                return [];
            }
        };
        
        /**
         * Add an album to recently viewed
         * @param {Object} album - Album object with path, album, and name properties
         */
        this.addAlbum = function(album) {
            if (!album || !album.path) return;
            
            var recent = this.getRecentlyViewed();
            
            // Create item object
            var item = {
                type: 'album',
                path: album.path,
                album: album.album || album.name,
                name: album.name || album.album,
                timestamp: new Date().toISOString(),
                photoCount: album.photoCount || 0
            };
            
            // Remove if already exists
            recent = recent.filter(function(r) {
                return !(r.type === 'album' && r.path === item.path);
            });
            
            // Add to beginning
            recent.unshift(item);
            
            // Keep only MAX_RECENT_ITEMS
            recent = recent.slice(0, MAX_RECENT_ITEMS);
            
            // Save to localStorage
            this.saveRecentlyViewed(recent);
        };
        
        /**
         * Save recently viewed items to localStorage
         */
        this.saveRecentlyViewed = function(items) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            } catch (e) {
                console.error('Error saving recently viewed:', e);
            }
        };
        
        /**
         * Clear all recently viewed items
         */
        this.clearRecentlyViewed = function() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error('Error clearing recently viewed:', e);
            }
        };
        
        /**
         * Remove a specific item from recently viewed
         */
        this.removeItem = function(item) {
            var recent = this.getRecentlyViewed();
            recent = recent.filter(function(r) {
                return !(r.type === item.type && r.path === item.path);
            });
            this.saveRecentlyViewed(recent);
        };
        
        /**
         * Get recently viewed albums only
         */
        this.getRecentAlbums = function() {
            var recent = this.getRecentlyViewed();
            return recent.filter(function(item) {
                return item.type === 'album';
            }).slice(0, 5); // Return top 5 recent albums
        };
        
        /**
         * Format timestamp for display
         */
        this.formatTimestamp = function(timestamp) {
            if (!timestamp) return '';
            
            var date = new Date(timestamp);
            var now = new Date();
            var diffMs = now - date;
            var diffMins = Math.floor(diffMs / 60000);
            var diffHours = Math.floor(diffMs / 3600000);
            var diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return diffMins + ' min ago';
            if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
            if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
            
            return date.toLocaleDateString();
        };
    });
