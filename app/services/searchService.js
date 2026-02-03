/**
 * Advanced Search Service
 * 
 * Provides full-text and advanced search capabilities:
 * - Multi-field search
 * - Date range filtering
 * - File type filtering
 * - Combined tag searches
 * - EXIF metadata search
 */

class AdvancedSearchService {
    /**
     * Search photos with advanced filters
     * @param {Array} photos - Array of photo objects
     * @param {Object} searchCriteria - Search parameters
     * @returns {Array} Filtered photos
     */
    static search(photos, searchCriteria = {}) {
        let results = [...photos];

        // Full-text search across multiple fields
        if (searchCriteria.query) {
            results = this._fullTextSearch(results, searchCriteria.query);
        }

        // Filter by tags (single or multiple)
        if (searchCriteria.tags && searchCriteria.tags.length > 0) {
            results = this._filterByTags(results, searchCriteria.tags, searchCriteria.tagMatchMode);
        }

        // Filter by date range
        if (searchCriteria.dateFrom || searchCriteria.dateTo) {
            results = this._filterByDateRange(results, searchCriteria.dateFrom, searchCriteria.dateTo);
        }

        // Filter by file type
        if (searchCriteria.fileTypes && searchCriteria.fileTypes.length > 0) {
            results = this._filterByFileType(results, searchCriteria.fileTypes);
        }

        // Filter by album
        if (searchCriteria.album) {
            results = results.filter(p => p.album === searchCriteria.album);
        }

        // Filter by size range
        if (searchCriteria.minSize || searchCriteria.maxSize) {
            results = this._filterBySize(results, searchCriteria.minSize, searchCriteria.maxSize);
        }

        // Sort results
        if (searchCriteria.sortBy) {
            results = this._sortResults(results, searchCriteria.sortBy, searchCriteria.sortOrder);
        }

        return results;
    }

    /**
     * Full-text search across photo fields
     * @private
     */
    static _fullTextSearch(photos, query) {
        const lowerQuery = query.toLowerCase();
        return photos.filter(photo => {
            // Convert tags to string if it's an array
            const tagsStr = Array.isArray(photo.tags) ? photo.tags.join(' ') : (photo.tags || '');
            
            const searchableFields = [
                photo.name || '',
                photo.album || '',
                tagsStr,
                photo.description || '',
                photo.exifData?.camera?.model || '',
                photo.exifData?.camera?.make || '',
                photo.exifData?.shooting?.dateTimeOriginal?.display || ''
            ].join(' ').toLowerCase();

            return searchableFields.includes(lowerQuery);
        });
    }

    /**
     * Filter photos by tags
     * @private
     */
    static _filterByTags(photos, tags, mode = 'any') {
        return photos.filter(photo => {
            if (!photo.tags) return false;

            // Handle tags as both array and string
            let photoTags;
            if (Array.isArray(photo.tags)) {
                photoTags = photo.tags.map(t => (t || '').toString().trim().toLowerCase());
            } else if (typeof photo.tags === 'string') {
                photoTags = photo.tags.split(',').map(t => t.trim().toLowerCase());
            } else {
                return false;
            }

            const lowerTags = tags.map(t => t.toLowerCase());

            if (mode === 'all') {
                // ALL tags must match
                return lowerTags.every(tag => photoTags.includes(tag));
            } else {
                // ANY tag matches (default)
                return lowerTags.some(tag => photoTags.includes(tag));
            }
        });
    }

    /**
     * Filter photos by date range
     * @private
     */
    static _filterByDateRange(photos, dateFrom, dateTo) {
        return photos.filter(photo => {
            const photoDate = photo.exifData?.shooting?.dateTimeOriginal?.iso ||
                             photo.createdAt ||
                             photo.uploadedAt;

            if (!photoDate) return !dateFrom && !dateTo; // Include if no date and no filter

            if (dateFrom && photoDate < dateFrom) return false;
            if (dateTo && photoDate > dateTo) return false;

            return true;
        });
    }

    /**
     * Filter photos by file type
     * @private
     */
    static _filterByFileType(photos, fileTypes) {
        return photos.filter(photo => {
            const ext = this._getFileExtension(photo.name).toLowerCase();
            return fileTypes.some(ft => ft.toLowerCase() === ext);
        });
    }

    /**
     * Filter photos by file size
     * @private
     */
    static _filterBySize(photos, minSize, maxSize) {
        return photos.filter(photo => {
            const size = photo.fileSize || 0;

            if (minSize && size < minSize) return false;
            if (maxSize && size > maxSize) return false;

            return true;
        });
    }

    /**
     * Sort search results
     * @private
     */
    static _sortResults(photos, sortBy, order = 'asc') {
        const isDescending = order === 'desc';

        const compareFn = (a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'date':
                    aVal = a.exifData?.shooting?.dateTimeOriginal?.iso || a.createdAt || '';
                    bVal = b.exifData?.shooting?.dateTimeOriginal?.iso || b.createdAt || '';
                    break;
                case 'size':
                    aVal = a.fileSize || 0;
                    bVal = b.fileSize || 0;
                    break;
                case 'album':
                    aVal = a.album || '';
                    bVal = b.album || '';
                    break;
                case 'rating':
                    aVal = a.rating || 0;
                    bVal = b.rating || 0;
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return isDescending ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            }

            return isDescending ? bVal - aVal : aVal - bVal;
        };

        return photos.sort(compareFn);
    }

    /**
     * Get file extension
     * @private
     */
    static _getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * Build search query string for database
     * @param {Object} criteria - Search criteria
     * @returns {string} SQL WHERE clause (without WHERE keyword)
     */
    static buildSqlQuery(criteria = {}) {
        const conditions = [];

        if (criteria.query) {
            conditions.push(`(name LIKE '%${criteria.query}%' OR tags LIKE '%${criteria.query}%' OR album LIKE '%${criteria.query}%')`);
        }

        if (criteria.album) {
            conditions.push(`album = '${criteria.album}'`);
        }

        if (criteria.dateFrom) {
            conditions.push(`created_at >= '${criteria.dateFrom}'`);
        }

        if (criteria.dateTo) {
            conditions.push(`created_at <= '${criteria.dateTo}'`);
        }

        if (criteria.fileTypes && criteria.fileTypes.length > 0) {
            const types = criteria.fileTypes.map(ft => `'${ft}'`).join(',');
            conditions.push(`LOWER(SUBSTRING_INDEX(name, '.', -1)) IN (${types})`);
        }

        return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    }

    /**
     * Get search suggestions for autocomplete
     * @param {Array} photos - All photos
     * @param {string} prefix - Search prefix
     * @param {string} field - Field to search in (tags, album, photographer)
     * @returns {Array} Unique values matching prefix
     */
    static getSuggestions(photos, prefix = '', field = 'tags') {
        const suggestions = new Set();
        const lowerPrefix = prefix.toLowerCase();

        photos.forEach(photo => {
            let values = [];

            switch (field) {
                case 'tags':
                    values = (photo.tags || '').split(',').map(t => t.trim());
                    break;
                case 'album':
                    values = [photo.album || ''];
                    break;
                case 'photographer':
                    values = [photo.exifData?.copyright?.photographer || ''];
                    break;
                case 'camera':
                    values = [photo.exifData?.camera?.model || ''];
                    break;
                default:
                    return;
            }

            values.forEach(value => {
                if (value && value.toLowerCase().startsWith(lowerPrefix)) {
                    suggestions.add(value);
                }
            });
        });

        return Array.from(suggestions).sort();
    }

    /**
     * Get search statistics
     * @param {Array} photos - Photos to analyze
     * @returns {Object} Statistics object
     */
    static getStatistics(photos) {
        const stats = {
            totalPhotos: photos.length,
            albums: new Set(),
            tags: new Set(),
            fileTypes: new Set(),
            dateRange: { earliest: null, latest: null },
            cameras: new Set(),
            totalSize: 0
        };

        photos.forEach(photo => {
            // Albums
            if (photo.album) stats.albums.add(photo.album);

            // Tags - handle both string and array
            if (photo.tags) {
                if (Array.isArray(photo.tags)) {
                    photo.tags.forEach(t => {
                        if (t && t.trim) stats.tags.add(t.trim());
                    });
                } else if (typeof photo.tags === 'string') {
                    photo.tags.split(',').forEach(t => stats.tags.add(t.trim()));
                }
            }

            // File types
            const ext = this._getFileExtension(photo.name);
            if (ext) stats.fileTypes.add(ext);

            // Date range
            const photoDate = photo.exifData?.shooting?.dateTimeOriginal?.iso || photo.createdAt;
            if (photoDate) {
                if (!stats.dateRange.earliest || photoDate < stats.dateRange.earliest) {
                    stats.dateRange.earliest = photoDate;
                }
                if (!stats.dateRange.latest || photoDate > stats.dateRange.latest) {
                    stats.dateRange.latest = photoDate;
                }
            }

            // Cameras
            if (photo.exifData?.camera?.model) {
                stats.cameras.add(photo.exifData.camera.model);
            }

            // Total size
            stats.totalSize += photo.fileSize || 0;
        });

        return {
            ...stats,
            albums: Array.from(stats.albums),
            tags: Array.from(stats.tags),
            fileTypes: Array.from(stats.fileTypes),
            cameras: Array.from(stats.cameras),
            totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2)
        };
    }
}

export default AdvancedSearchService;
