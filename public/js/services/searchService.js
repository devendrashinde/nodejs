// Search Service - Unified search functionality
angular.module('SearchService', [])
    .factory('SearchService', [function() {
        return {
            /**
             * Clear search input and DOM element
             * @param {string} inputId - ID of the input element
             * @param {string} scopeProperty - Name of the scope property to clear
             * @param {object} $scope - Angular scope object
             */
            clearSearch: function(inputId, scopeProperty, $scope) {
                $scope[scopeProperty] = "";
                var input = document.getElementById(inputId);
                if (input) {
                    input.value = "";
                }
                $scope.$applyAsync();
            },
            
            /**
             * Filter items by search text
             * @param {Array} items - Array of items to filter
             * @param {string} searchField - Field name to search in
             * @param {string} searchText - Search query
             * @returns {Array} Filtered items
             */
            filterByText: function(items, searchField, searchText) {
                if (!items || !Array.isArray(items)) {
                    return [];
                }
                if (!searchText || searchText.trim() === '') {
                    return items;
                }
                
                const searchLower = searchText.toLowerCase().trim();
                return items.filter(function(item) {
                    if (!item || !item[searchField]) return false;
                    const fieldValue = String(item[searchField]).toLowerCase();
                    return fieldValue.indexOf(searchLower) !== -1;
                });
            },
            
            /**
             * Handle search input change event
             * @param {string} searchType - Type of search (albums, playlists, etc)
             * @param {Event} event - DOM event
             * @param {object} scopeMap - Map of search type to scope property name
             * @param {object} $scope - Angular scope object
             */
            handleSearchChange: function(searchType, event, scopeMap, $scope) {
                if (event && event.target) {
                    var inputValue = event.target.value;
                    var scopeProperty = scopeMap[searchType];
                    if (scopeProperty) {
                        $scope[scopeProperty] = inputValue;
                    }
                }
            }
        };
    }]);
