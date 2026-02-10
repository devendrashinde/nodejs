// Utility Service - Common helper functions
angular.module('UtilityService', [])
    .factory('UtilityService', ['$timeout', function($timeout) {
        return {
            /**
             * Show temporary message
             * @param {Function} callback - Function to execute after timeout
             * @param {number} duration - Duration in milliseconds
             */
            showTemporaryMessage: function(callback, duration) {
                $timeout(callback, duration);
            },
            
            /**
             * Check if file is of certain type
             * @param {string} filename - File name
             * @param {Array} types - Array of file extensions
             * @returns {boolean}
             */
            isFileType: function(filename, types) {
                if (!filename || !types || !Array.isArray(types)) {
                    return false;
                }
                const ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
                return types.some(function(type) {
                    return type.toLowerCase() === ext;
                });
            },
            
            /**
             * Format time for display
             * @param {number} seconds - Time in seconds
             * @returns {string} Formatted time (mm:ss)
             */
            formatTime: function(seconds) {
                if (isNaN(seconds) || seconds < 0) {
                    return "0:00";
                }
                var min = Math.floor(seconds / 60);
                var sec = Math.floor(seconds % 60);
                return min + ":" + (sec < 10 ? "0" + sec : sec);
            },
            
            /**
             * Safely get nested property
             * @param {object} obj - Object to traverse
             * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
             * @param {*} defaultValue - Default value if path doesn't exist
             * @returns {*}
             */
            getNestedProperty: function(obj, path, defaultValue) {
                if (!obj || !path) return defaultValue;
                
                const keys = path.split('.');
                let result = obj;
                
                for (let key of keys) {
                    if (result && typeof result === 'object' && key in result) {
                        result = result[key];
                    } else {
                        return defaultValue;
                    }
                }
                
                return result;
            },
            
            /**
             * Debounce function execution
             * @param {Function} func - Function to debounce
             * @param {number} wait - Wait time in milliseconds
             * @returns {Function}
             */
            debounce: function(func, wait) {
                var timeout;
                return function() {
                    var context = this;
                    var args = arguments;
                    $timeout.cancel(timeout);
                    timeout = $timeout(function() {
                        func.apply(context, args);
                    }, wait);
                };
            }
        };
    }]);
