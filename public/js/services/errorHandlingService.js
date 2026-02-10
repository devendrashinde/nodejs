// Error Handling Service - Centralized error handling
angular.module('ErrorHandlingService', [])
    .factory('ErrorHandlingService', [function() {
        return {
            /**
             * Handle HTTP error response
             * @param {object} error - Error object from HTTP request
             * @param {string} context - Context where error occurred
             * @returns {string} User-friendly error message
             */
            handleHttpError: function(error, context) {
                var message = 'An error occurred';
                
                if (context) {
                    message += ' while ' + context;
                }
                
                if (error && error.status) {
                    switch (error.status) {
                        case 400:
                            message += ': Invalid request';
                            break;
                        case 401:
                            message += ': Unauthorized access';
                            break;
                        case 403:
                            message += ': Access forbidden';
                            break;
                        case 404:
                            message += ': Resource not found';
                            break;
                        case 500:
                            message += ': Server error';
                            break;
                        default:
                            message += ': Error code ' + error.status;
                    }
                }
                
                if (error && error.data && error.data.message) {
                    message += '\n' + error.data.message;
                }
                
                console.error('Error [' + context + ']:', error);
                return message;
            },
            
            /**
             * Show error message to user
             * @param {string} message - Error message
             * @param {string} title - Optional title
             */
            showError: function(message, title) {
                // Could be enhanced to use a toast notification system
                alert((title ? title + '\n\n' : '') + message);
            },
            
            /**
             * Handle error with default message
             * @param {object} error - Error object
             * @param {string} context - Context description
             */
            handleError: function(error, context) {
                var message = this.handleHttpError(error, context);
                this.showError(message);
            },
            
            /**
             * Validate required fields
             * @param {object} data - Data object to validate
             * @param {Array} requiredFields - Array of required field names
             * @returns {object} { valid: boolean, missing: [] }
             */
            validateRequired: function(data, requiredFields) {
                var missing = [];
                
                requiredFields.forEach(function(field) {
                    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                        missing.push(field);
                    }
                });
                
                return {
                    valid: missing.length === 0,
                    missing: missing
                };
            },
            
            /**
             * Show validation errors
             * @param {Array} missingFields - Array of missing field names
             */
            showValidationErrors: function(missingFields) {
                var message = 'Please fill in the following required fields:\n\n' +
                    missingFields.map(function(field) {
                        return '- ' + field.charAt(0).toUpperCase() + field.slice(1);
                    }).join('\n');
                this.showError(message, 'Validation Error');
            }
        };
    }]);
