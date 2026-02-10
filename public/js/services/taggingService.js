/**
 * Tagging Service - Centralized tagging operations
 * Handles tag parsing, formatting, and autocomplete functionality
 */
angular.module('TaggingService', [])
    .factory('TaggingService', ['APP_CONSTANTS', function(APP_CONSTANTS) {
        return {
            /**
             * Parse tag string into array of clean tags
             * @param {string} tagString - Comma-separated tag string
             * @returns {Array<string>} Array of trimmed, non-empty tags
             */
            parseTagString: function(tagString) {
                if (!tagString || typeof tagString !== 'string') {
                    return [];
                }
                
                return tagString
                    .split(',')
                    .map(function(tag) { return tag.trim(); })
                    .filter(function(tag) { return tag.length > 0; });
            },
            
            /**
             * Format tags array into display string
             * @param {Array<string>} tagsArray - Array of tags
             * @returns {string} Comma-separated tag string
             */
            formatTagsArray: function(tagsArray) {
                if (!tagsArray || !Array.isArray(tagsArray)) {
                    return '';
                }
                return tagsArray.join(', ');
            },
            
            /**
             * Get matching tags for autocomplete
             * @param {string} input - User input
             * @param {Array<object>} allTags - All available tags
             * @param {number} maxResults - Maximum results to return
             * @returns {Array<object>} Matching tags
             */
            getMatchingTags: function(input, allTags, maxResults) {
                if (!input || !allTags || !Array.isArray(allTags)) {
                    return [];
                }
                
                maxResults = maxResults || APP_CONSTANTS.AUTOCOMPLETE_MAX_RESULTS;
                var lowerInput = input.toLowerCase();
                
                var matches = allTags.filter(function(tagObj) {
                    return tagObj.tag && tagObj.tag.toLowerCase().indexOf(lowerInput) !== -1;
                });
                
                return matches.slice(0, maxResults);
            },
            
            /**
             * Merge new tag into existing tags string
             * @param {string} existingTags - Current tags string
             * @param {string} newTag - Tag to add
             * @returns {string} Updated tags string
             */
            mergeTag: function(existingTags, newTag) {
                if (!newTag || typeof newTag !== 'string') {
                    return existingTags || '';
                }
                
                var tagsArray = this.parseTagString(existingTags);
                var cleanNewTag = newTag.trim();
                
                // Avoid duplicates
                if (cleanNewTag && tagsArray.indexOf(cleanNewTag) === -1) {
                    tagsArray.push(cleanNewTag);
                }
                
                return this.formatTagsArray(tagsArray);
            },
            
            /**
             * Remove tag from tags string
             * @param {string} existingTags - Current tags string
             * @param {string} tagToRemove - Tag to remove
             * @returns {string} Updated tags string
             */
            removeTag: function(existingTags, tagToRemove) {
                if (!tagToRemove || typeof tagToRemove !== 'string') {
                    return existingTags || '';
                }
                
                var tagsArray = this.parseTagString(existingTags);
                var cleanTagToRemove = tagToRemove.trim();
                
                var filtered = tagsArray.filter(function(tag) {
                    return tag !== cleanTagToRemove;
                });
                
                return this.formatTagsArray(filtered);
            },
            
            /**
             * Validate tags string
             * @param {string} tags - Tags to validate
             * @returns {object} { valid: boolean, message: string }
             */
            validateTags: function(tags) {
                if (!tags || typeof tags !== 'string') {
                    return { valid: true, message: '' };
                }
                
                var tagsArray = this.parseTagString(tags);
                
                // Check for empty tags after splitting
                var hasEmpty = tags.split(',').some(function(tag) {
                    return tag.trim() === '';
                });
                
                if (hasEmpty) {
                    return {
                        valid: false,
                        message: 'Tags cannot be empty. Remove extra commas.'
                    };
                }
                
                return { valid: true, message: '' };
            },
            
            /**
             * Get tag frequency/count
             * @param {Array<object>} items - Items with tags property
             * @returns {object} Map of tag -> count
             */
            getTagFrequency: function(items) {
                var frequency = {};
                
                if (!items || !Array.isArray(items)) {
                    return frequency;
                }
                
                var self = this;
                items.forEach(function(item) {
                    if (item.tags) {
                        var tags = self.parseTagString(item.tags);
                        tags.forEach(function(tag) {
                            frequency[tag] = (frequency[tag] || 0) + 1;
                        });
                    }
                });
                
                return frequency;
            }
        };
    }]);
