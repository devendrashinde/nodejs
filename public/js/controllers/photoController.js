
angular.module('photoController', [])

    // Custom filter to remove file extension
    .filter('stripExtension', function() {
        return function(filename) {
            if (!filename) return filename;
            const lastDot = filename.lastIndexOf('.');
            return lastDot > 0 ? filename.substring(0, lastDot) : filename;
        };
    })

    // Custom case-insensitive search filter for albums and playlists
    .filter('caseInsensitiveContains', function() {
        return function(items, searchField, searchText) {
            if (!items) return items;
            if (!searchText || searchText.trim() === '') return items;
            
            const searchLower = searchText.toLowerCase().trim();
            
            const filtered = items.filter(function(item) {
                if (!item || !item[searchField]) return false;
                const fieldValue = String(item[searchField]).toLowerCase();
                const matches = fieldValue.indexOf(searchLower) !== -1;
                return matches;
            });
            
            return filtered;
        };
    })

    // inject the Photo service factory into our controller
    .controller('photoController', ['$scope','$http', '$location','$timeout','PhotoService','ModalService','RecentlyViewedService','APP_CONSTANTS','SearchService','AudioPlayerService','TaggingService','UtilityService','ErrorHandlingService', function($scope, $http, $location, $timeout, PhotoService, ModalService, RecentlyViewedService, APP_CONSTANTS, SearchService, AudioPlayerService, TaggingService, UtilityService, ErrorHandlingService) {

        $scope.formData = {};
        $scope.tags = [];
        $scope.allTags = [];
        $scope.filteredTags = []
        $scope.tagsLoaded = false;
        $scope.photos = []; // current album photos
        $scope.allPhotosByAlbum = {}; // Map of album -> photos for counting
        $scope.selectedPhoto = {};
        $scope.editingAlbum = {}; // For album tagging modal
        $scope.filteredPhotos = [];// search-filtered photos
        $scope.albums = [];
		$scope.folders = [];
        $scope.loading = true;
		$scope.noMorePhotos = false;
        $scope.showSearch = false;
        $scope.searchTag = ""; // user input for search
        $scope.albumsSearchText = ""; // albums list search text
        $scope.selectedAlbum = {path:'Home',name:'Home'};
        $scope.uploadDetails = {};
        
        // Playlist variables
        $scope.playlists = []; // Array of user playlists
        $scope.selectedView = 'albums'; // Toggle between 'albums' and 'playlists'
        $scope.playlistsSearchText = ""; // Playlists list search text
        $scope.editingPlaylist = {}; // For playlist creation/edit modal
        $scope.selectedPlaylistItems = []; // Photos in selected playlist
        $scope.showPlaylistModal = false; // Toggle playlist creation modal
        
        // Bulk playlist operation flags
        $scope.isBulkPlaylistOperation = false;
        $scope.selectedPhotosForBulkPlaylist = null;
        
        // Media type constants
        const imageTypes = APP_CONSTANTS.IMAGE_TYPES;
        const videoTypes = APP_CONSTANTS.VIDEO_TYPES;
        const audioTypes = APP_CONSTANTS.AUDIO_TYPES;
        
		$scope.pageId = 0;
        $scope.totalPhotos = 0;
        $scope.totalPages = 0;
		$scope.numberOfItemsOnPage = APP_CONSTANTS.ITEMS_PER_PAGE;
        
        // Initialize audio player state from service
        var playerState = AudioPlayerService.getState();
        $scope.playlist = playerState.playlist;
        $scope.currentIndex = playerState.currentIndex;
        $scope.isPlaying = playerState.isPlaying;
        $scope.currentTime = playerState.currentTime;
        $scope.duration = playerState.duration;
        $scope.progress = playerState.progress;
        $scope.volume = playerState.volume;
        $scope.isShuffle = playerState.isShuffle;
        $scope.isRepeat = playerState.isRepeat;
        $scope.showPlaylist = false;
        
        // Watch AudioPlayerService state for changes and sync to $scope
        $scope.$watch(function() {
            return AudioPlayerService.getState();
        }, function(newState) {
            if (newState) {
                $scope.playlist = newState.playlist;
                $scope.currentIndex = newState.currentIndex;
                $scope.isPlaying = newState.isPlaying;
                $scope.currentTime = newState.currentTime;
                $scope.duration = newState.duration;
                $scope.progress = newState.progress;
                $scope.volume = newState.volume;
                $scope.isShuffle = newState.isShuffle;
                $scope.isRepeat = newState.isRepeat;
            }
        }, true);
        
        // Listen for playlist updates from service
        $scope.$on('playlistUpdated', function(event, newState) {
            if (newState) {
                $scope.playlist = newState.playlist;
                $scope.currentIndex = newState.currentIndex;
                $scope.isPlaying = newState.isPlaying;
                $scope.currentTime = newState.currentTime;
                $scope.duration = newState.duration;
                $scope.progress = newState.progress;
                $scope.volume = newState.volume;
                $scope.isShuffle = newState.isShuffle;
                $scope.isRepeat = newState.isRepeat;
            }
        });
        
        // file upload
        $scope.uploadFile = null;
        $scope.filePreviewUrl = '';
        $scope.uploadTags = '';
        $scope.uploadAlbum = $scope.selectedAlbum ? $scope.selectedAlbum.path : '';
        $scope.favoritesCount = 0; // Count of favorited media
        $scope.allFavorites = []; // Store all favorites
        
        // Recently viewed
        $scope.recentlyViewed = [];
        $scope.showRecentlyViewed = false;
        
        // Filter functions for sidebar search
        $scope.getFilteredFolders = function() {
            return SearchService.filterByText($scope.folders, 'album', $scope.albumsSearchText);
        };
        
        $scope.getFilteredPlaylists = function() {
            return SearchService.filterByText($scope.playlists, 'name', $scope.playlistsSearchText);
        };
        
        // GET =====================================================================
        // when landing on the page, get all photos and tags and show them
        // use the service to get all the photo tags
        loadPhotos();
        loadPlaylists(); // Load playlists for display in sidebar
        
        // Dynamically adjust main content padding when player bar appears/disappears
        $scope.$watch('playlist.length', function(newVal, oldVal) {
            if (newVal > 0) {
                // Player bar is visible
                $timeout(function() {
                    const playerBar = document.getElementById('playerBar');
                    if (playerBar) {
                        const playerHeight = playerBar.offsetHeight || 250;
                        document.querySelector('main').style.paddingBottom = (playerHeight + 50) + 'px';
                    }
                }, 100);
            } else {
                // Player bar is hidden
                document.querySelector('main').style.paddingBottom = '0';
            }
        });

        $scope.search = function() {
            if($scope.searchTag && $scope.searchTag.trim() !== ''){
                $scope.loading = true;
                $location.search('q', $scope.searchTag);
                PhotoService.getTagsByTag($scope.searchTag)
                    // if successful creation, call our get function to get all the new photos
                    .then(function successCallback(response) {                          
							updatePhotoTagsFromDb(response.data);
                            $scope.loading = false;
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error searching by tag');
                    });
            }
        };
        
        $scope.clearSearch = function() {
            $scope.searchTag = "";
            $scope.showSearch = false; // hide box after clearing
        };

        // Clear albums search and show all albums
        $scope.clearAlbumsSearch = function() {
            SearchService.clearSearch('albumsSearchInput', 'albumsSearchText', $scope);
        };

        // Clear playlists search and show all playlists
        $scope.clearPlaylistsSearch = function() {
            SearchService.clearSearch('playlistsSearchInput', 'playlistsSearchText', $scope);
        };

        // GET  ==================================================================
        // get photos
        $scope.getPhotos = function(id) {
            $scope.loading = true;

            PhotoService.getPhotos(id, $scope.pageId, $scope.numberOfItemsOnPage)
                // if successful creation, call our get function to get all the new photos
                .then(function successCallback(response) {
                        $scope.totalPhotos = response.totalPhotos;
                        $scope.totalPages = Math.ceil($scope.totalPhotos / $scope.numberOfItemsOnPage);
                        updatePhotoTagsFromDb(response.data);
                        // Load favorites for these photos
                        $scope.loadUserFavorites();
                        $scope.loading = false;
                        
                        // Reinitialize Fancybox after Angular renders new images
                        $timeout(function() {
                          if (typeof initFancybox === 'function') {
                            initFancybox();
                          }
                        }, 100);
                }, function(error) {
                    $scope.loading = false;  // Ensure loading is hidden on error
                    ErrorHandlingService.handleError(error, 'Error loading photos');
                });         
        };

        // get tag
        $scope.getTag = function(name) {            
            for (photo of $scope.photos) {
                if(photo.name == name){
                    return tag.tags;
                }
            }
            return "";
        };

        // Load user's favorite photos from database
        $scope.loadUserFavorites = function() {
            $http.get('/api/favorites')
                .then(function successCallback(response) {
                    const favorites = response.data.favorites || [];
                    const favoriteMap = {};
                    
                    // Update favorites count for badge
                    $scope.favoritesCount = favorites.length;
                    $scope.allFavorites = favorites;
                    
                    // Create a map of favorite photo paths for quick lookup
                    favorites.forEach(fav => {
                        favoriteMap[fav.photo_path] = true;
                    });
                    
                    // Mark photos as favorites
                    $scope.photos.forEach(photo => {
                        if (favoriteMap[photo.path]) {
                            photo.isFavorite = true;
                        }
                    });
                }, function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading user favorites');
                });
        };
        
        function getNameAndAlbum(name){
            var prop = {};
            var s = name.split("/");
            prop.album = s[s.length-2];
            prop.name = s[s.length-1];
            return prop;
        }       
        
        // update tag
        $scope.updateTag = function(id, tag, newId) {						
            tag = tag.trim();
            for (photo of $scope.photos) {
                if(photo.id == id){
                    photo.tags = tag;
                    photo.id = newId;
                    break;
                }
            }
			addToTagList(tag);
            addToAllTags(tag);
        };
        
        function addToTagList(tag) {
			for(tags of $scope.tags){
				if(tags.tags == tag) {
					return;
				}
			}
            $scope.tags.unshift({ tags: tag });
        }

        function addToAllTags(tagString) {
            const newTags = tagString
                .split(/[\s,]+/)
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            newTags.forEach(newTag => {
                const exists = $scope.allTags.some(existing => existing.tags === newTag);
                if (!exists) {
                    $scope.allTags.unshift({ tags: newTag });
                    $scope.filteredTags.unshift({ tags: newTag });
                }
            });
        }

        function loadPhotos() {
			$scope.pageId = 0;
			$scope.noMorePhotos = false;
            var id = getUrlParameter("id");
            loadPhotosAndTags(id);
        }

        $scope.loadAlbumWithPageId = function (pageId) {
			$scope.pageId = pageId;
			$scope.noMorePhotos = false;
            loadPhotosAndTags($scope.selectedAlbum.path);
        }
        
        $scope.nextPage = function () {
            if (!$scope.noMorePhotos && !$scope.loading) {
                $scope.loadAlbumWithPageId($scope.pageId + 1);
            }
        }
        
        $scope.prevPage = function () {
            if ($scope.pageId > 0 && !$scope.loading) {
                $scope.loadAlbumWithPageId($scope.pageId - 1);
            }
        }
        
        $scope.loadAlbum = function () {
            $scope.loadAlbumWithPageId(0);
        }

        $scope.setAlbum = function (album) {
			$scope.selectedAlbum = album;
            
            // Track recently viewed albums (exclude "All Albums" and "favorites")
            if (album && album.path && album.path !== '' && album.path !== 'favorites') {
                // Get photo count for this album
                var photoCount = 0;
                if ($scope.allPhotosByAlbum && $scope.allPhotosByAlbum[album.path]) {
                    photoCount = $scope.allPhotosByAlbum[album.path].length;
                }
                
                var albumToTrack = {
                    album: album.album,
                    path: album.path,
                    name: album.name || album.album,
                    photoCount: photoCount
                };
                
                RecentlyViewedService.addAlbum(albumToTrack);
                $scope.loadRecentlyViewed();
            }
            
            if (!album.album || album.album === '') {
                // "All Albums" selected - show all photos
                loadPhotosAndTags("");
            } else {
                loadPhotosAndTags(album.path);
            }
        }

        // Get parent album from current album path
        $scope.getParentAlbum = function() {
            if (!$scope.selectedAlbum) {
                return null;
            }
            
            const path = $scope.selectedAlbum.path;
            
            // No parent for empty path, 'Home', or favorites
            if (!path || path === 'Home' || path === '' || path === 'favorites') {
                return null;
            }
            
            const parts = path.split('/');
            
            if (parts.length === 1) {
                // Single level - parent is root (All Albums)
                return { album: 'All Albums', path: '', isRoot: true };
            }
            
            // Remove last part to get parent path
            const parentPath = parts.slice(0, -1).join('/');
            const parentAlbum = parts[parts.length - 2]; // Get the parent album name
            
            return { album: parentAlbum, path: parentPath };
        }

        // Go to parent album
        $scope.goToParentAlbum = function() {
            const parentAlbum = $scope.getParentAlbum();
            if (parentAlbum) {
                if (parentAlbum.isRoot) {
                    $scope.setAlbum({ album: '', path: '' }); // Go to All Albums
                } else {
                    $scope.setAlbum(parentAlbum);
                }
            }
        }

        // View favorites - display all favorited media
        $scope.viewFavorites = function() {
            $scope.selectedAlbum = { album: 'favorites', path: 'favorites' };
            $scope.loading = true;
            $scope.pageId = 0;
            
            // Get all favorites from database
            $http.get('/api/favorites')
                .then(function successCallback(response) {
                    const favorites = response.data.favorites || [];
                    $scope.favoritesCount = favorites.length;
                    $scope.allFavorites = favorites;
                    
                    // Convert favorites to photo objects
                    $scope.photos = favorites.map(fav => ({
                        name: fav.photo_name,
                        path: fav.photo_path,
                        album: fav.album,
                        isFavorite: true,
                        tags: ''
                    }));
                    
                    $scope.totalPhotos = favorites.length;
                    $scope.totalPages = 1;
                    $scope.tags = [];
                    $scope.loading = false;
                    
                    // Reinitialize Fancybox after Angular renders favorites
                    $timeout(function() {
                      if (typeof initFancybox === 'function') {
                        initFancybox();
                      }
                    }, 100);
                }, function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading favorites view');
                    $scope.photos = [];
                    $scope.favoritesCount = 0;
                    $scope.loading = false;
                });
        };
		
		function showNoMorePhotos() {			
			setTimeout(function() {
				$scope.noMorePhotos = false;
			}, APP_CONSTANTS.NO_MORE_PHOTOS_TIMEOUT);
		}
		
        // load photos and respective tags
        function loadPhotosAndTags(id) {
			id = id == "Home"? "" : id;
			$scope.loading = true;
			$scope.noMorePhotos = false;
            PhotoService.getTagsByAlbum(id)
            .then(function successCallback(response) {
                $scope.tags = response.data;
                $scope.getPhotos(id);
            }, function(error) {
                $scope.loading = false;  // Ensure loading is hidden on error
                ErrorHandlingService.handleError(error, 'Error loading tag information');
            });         
        }

        // Watch search input and filter tags
        $scope.$watch('searchTag', function(newVal) {
        if (!newVal) {
            $scope.filteredTags = $scope.allTags;
        } else {
            const lower = newVal.toLowerCase();
            $scope.filteredTags = $scope.allTags.filter(tag => tag.tag.includes(lower));
        }
        });

        // Watch albums search input to trigger folder filtering
        $scope.$watch('albumsSearchText', function(newVal, oldVal) {
            // No-op watch, just ensures digest cycles include filter evaluation
        });

        // Watch playlists search input to trigger playlist filtering
        $scope.$watch('playlistsSearchText', function(newVal, oldVal) {
            // No-op watch, just ensures digest cycles include filter evaluation
        });

        // Handler for search input changes
        $scope.onSearchChange = function(searchType, event) {
            var scopeMap = {
                'albums': 'albumsSearchText',
                'playlists': 'playlistsSearchText'
            };
            SearchService.handleSearchChange(searchType, event, scopeMap, $scope);
        };

        // Watch folders array for changes (when albums are loaded/updated)
        $scope.$watch('folders', function(newVal) {
            // Trigger re-evaluation of filtered folders
        }, true); // true means deep watch to monitor changes within the array

        // Watch playlists array for changes (when playlists are loaded/updated)
        $scope.$watch('playlists', function(newVal) {
            // Trigger re-evaluation of filtered playlists
        }, true); // true means deep watch to monitor changes within the array

        
        $scope.searchByTag = function(tag) {
            $scope.searchTag = tag;
            $scope.search();
            $('#searchModal').modal('hide');
        };


        // Handle search modal events
        $('#searchModal').on('shown.bs.modal', function () {
            const scope = angular.element(this).scope();
            scope.$apply(function () {
                scope.loadAllTags();
            });
            // Auto-focus on search input when modal opens
            setTimeout(function() {
                $('#searchInput').focus();
            }, 100);
        });

        // Prevent sidebar from closing when search modal is opened
        $('#searchModal').on('show.bs.modal', function (e) {
            // Store the current state of the sidebar
            const sidebar = document.getElementById('folderSidebar');
            if (sidebar) {
                const isCollapsed = !sidebar.classList.contains('show');
                // Store state in data attribute
                sidebar.setAttribute('data-was-collapsed', isCollapsed);
            }
        });

        // Restore sidebar state when modal is hidden
        $('#searchModal').on('hidden.bs.modal', function (e) {
            const sidebar = document.getElementById('folderSidebar');
            if (sidebar) {
                const wasCollapsed = sidebar.getAttribute('data-was-collapsed') === 'true';
                // Restore the state if needed
                if (!wasCollapsed && !sidebar.classList.contains('show')) {
                    $(sidebar).collapse('show');
                }
            }
        });

        // Keyboard shortcut to open search modal (Ctrl+K)
        $(document).on('keydown', function(e) {
            // Ctrl+K or Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                $('#searchModal').modal('show');
            }
            // Escape key to close search modal
            if (e.key === 'Escape' && $('#searchModal').hasClass('show')) {
                $('#searchModal').modal('hide');
            }
        });

        // =========== CACHE MANAGEMENT FUNCTIONS ===========
        
        // Initialize cache stats scope variables
        $scope.cacheStats = {
            // Total stats
            totalCacheSizeMB: '0',
            totalHitRate: '0%',
            maxCacheBytes: '0',
            
            // Album cache stats
            albumCacheEntries: 0,
            albumCacheSizeMB: '0',
            albumHits: 0,
            albumMisses: 0,
            albumHitRate: '0%',
            totalAlbumsTracked: 0,
            
            // Playlist cache stats
            playlistCacheEntries: 0,
            playlistCacheSizeMB: '0',
            playlistHits: 0,
            playlistMisses: 0,
            playlistHitRate: '0%',
            totalPlaylistsTracked: 0
        };
        $scope.topAlbums = [];
        $scope.topPlaylists = [];
        
        /**
         * Load cache statistics from server
         */
        $scope.loadCacheStats = function() {
            $http.get('/api/cache/stats')
                .then(function successCallback(response) {
                    if (response.data.stats) {
                        $scope.cacheStats = response.data.stats;
                    }
                    if (response.data.topAlbums) {
                        $scope.topAlbums = response.data.topAlbums;
                    }
                    if (response.data.topPlaylists) {
                        $scope.topPlaylists = response.data.topPlaylists;
                    }
                }, function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading cache statistics');
                });
        };
        
        /**
         * Scan for new albums manually
         */
        $scope.scanForNewAlbums = function() {
            $http.get('/api/cache/scan-albums')
                .then(function(response) {
                    const data = response.data;
                    if (data.newAlbumsFound > 0) {
                        alert(`Found ${data.newAlbumsFound} new album(s):\n${data.albums.join('\n')}\n\nTotal albums tracked: ${data.totalAlbumsTracked}`);
                    } else {
                        alert('No new albums found.\n\nTotal albums tracked: ' + data.totalAlbumsTracked);
                    }
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error scanning for new albums');
                });
        };

        /**
         * Clear cache for current album
         */
        $scope.clearCurrentAlbumCache = function() {
            const album = $scope.selectedAlbum.album || $scope.selectedAlbum.path;
            if (!album || album === 'Home') {
                alert('No specific album selected');
                return;
            }
            
            if (confirm(`Clear cache for album: ${$scope.selectedAlbum.name}?`)) {
                $http.post('/api/cache/invalidate', { album: album })
                    .then(function successCallback(response) {
                        if (response.data.success) {
                            alert(`✓ Cleared ${response.data.albumEntriesRemoved} cache entries for: ${$scope.selectedAlbum.name}`);
                            // Reload cache stats
                            $scope.loadCacheStats();
                        }
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error clearing all cache');
                    });
            }
        };
        
        /**
         * Clear cache for current playlist
         */
        $scope.clearCurrentPlaylistCache = function() {
            const playlistId = $scope.selectedAlbum.id;
            if (!playlistId || !$scope.selectedAlbum.isPlaylist) {
                alert('No playlist selected');
                return;
            }
            
            if (confirm(`Clear cache for playlist: ${$scope.selectedAlbum.name}?`)) {
                $http.post('/api/cache/invalidate', { playlist: playlistId })
                    .then(function successCallback(response) {
                        if (response.data.success) {
                            alert(`✓ Cleared cache for playlist: ${$scope.selectedAlbum.name}`);
                            // Reload cache stats
                            $scope.loadCacheStats();
                        }
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error clearing playlist cache');
                    });
            }
        };
        
        /**
         * Clear all cache
         */
        $scope.clearAllCache = function() {
            if (confirm('Clear entire cache? This will force a full disk scan on next access.')) {
                $http.post('/api/cache/invalidate', {})
                    .then(function successCallback(response) {
                        if (response.data.success) {
                            const totalRemoved = response.data.albumEntriesRemoved + response.data.playlistEntriesRemoved;
                            alert(`✓ Cleared entire cache (${totalRemoved} entries)`);
                            // Reload cache stats
                            $scope.loadCacheStats();
                        }
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error clearing all cache');
                    });
            }
        };
        
        // Load cache stats when modal is opened
        $('#cacheStatsModal').on('show.bs.modal', function() {
            $scope.$apply(function() {
                $scope.loadCacheStats();
            });
        });
        
        // Clear bulk operation flags when Add to Playlist modal is closed
        $('#addToPlaylistModal').on('hidden.bs.modal', function() {
            $scope.$apply(function() {
                $scope.isBulkPlaylistOperation = false;
                $scope.selectedPhotosForBulkPlaylist = null;
            });
        });

        // load all tags
        $scope.loadAllTags = function () {
            if($scope.tagsLoaded) return;
            $scope.tagsLoaded = true;            
            $scope.loading = true;
            PhotoService.getAllTags()
            .then(function successCallback(response) {
                $scope.allTags = response;
                $scope.filteredTags = response;
                $scope.loading = false;
            }, function(error) {
                ErrorHandlingService.handleError(error, 'Error loading all tags');
                $scope.loading = false;
            });         
        }

        function updatePhotoTagsFromDb(photos){
            firstTime = true;
			// Preserve folders array if we're doing a search (not album navigation)
            var preservedFolders = $scope.folders;
			$scope.folders = [];
            $scope.playlist = [];
            $scope.currentIndex = -1;
            for (photo of photos) {
                var albumDetails = getNameAndAlbum(photo.path);
                for (tag of $scope.tags) {
                    if(tag.name == albumDetails.name && tag.album == albumDetails.album){
                        photo.tags = (tag.tags.length ? tag.tags : photo.name);
                        photo.id = tag.id;
                        break;
                    }
                }
                if(photo.isAlbum){
                    found = false;
					$scope.folders.push(photo);
                    for (x of $scope.albums) {
                        if(x.path == photo.path && x.name == photo.name) {
                            found = true;
                            break;
                        }                           
                    }
                    if(!found){
                        $scope.albums.unshift(photo);
                        //$scope.albums.push(photo);
                    }
                } else {
                	if(firstTime) {
						$scope.photos = [];
                		firstTime = false;
                	}
                    var photoObj = getImageType(photo);
                    $scope.photos.push(photoObj);
                    // Track all photos by album for counting
                    var album = albumDetails.album || 'Home';
                    if (!$scope.allPhotosByAlbum[album]) {
                        $scope.allPhotosByAlbum[album] = [];
                    }
                    // Only add if not already in this album's list
                    var exists = $scope.allPhotosByAlbum[album].some(function(p) {
                        return p.path === photoObj.path;
                    });
                    if (!exists) {
                        $scope.allPhotosByAlbum[album].push(photoObj);
                    }
                }
            }
			$scope.noMorePhotos = firstTime;
			if($scope.noMorePhotos) {
                 if( $scope.pageId > 0) {
				// no more photos, stay on same page
				$scope.pageId = $scope.pageId  - 1;
                 } else {
                    $scope.photos = [];
                 }
			} else {
				$scope.noMorePhotos = $scope.photos.length < $scope.numberOfItemsOnPage;
			}
            
            // Restore folders if they were cleared during search
            if ($scope.folders.length === 0 && preservedFolders && preservedFolders.length > 0) {
                $scope.folders = preservedFolders;
            }
            
            if($scope.playlist.length > 0) {
                $scope.currentIndex = 0;
            }
            
            // Load and merge album tags from database
            loadAndMergeAlbumTags();
        }
        
        /**
         * Load album tags from database and merge them with folder objects
         */
        function loadAndMergeAlbumTags() {
            PhotoService.getAlbumTags()
                .then(function(tags) {
                    // Create a map of album name -> tags for easy lookup
                    var tagMap = {};
                    if (tags && Array.isArray(tags)) {
                        tags.forEach(function(item) {
                            if (item.name) {
                                tagMap[item.name] = item.tags || '';
                            }
                        });
                    }
                    
                    // Merge tags with folders array
                    $scope.folders.forEach(function(folder) {
                        if (tagMap[folder.album]) {
                            folder.tags = tagMap[folder.album];
                        } else if (!folder.tags) {
                            folder.tags = '';
                        }
                    });
                    
                    // Don't call $apply() here - we're already in Angular's digest cycle
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading and merging album tags');
                });
        }       
        
        function getImageType(photo) {
            ext = photo.name.substr(photo.name.lastIndexOf(".")+1).toLowerCase();
            if(imageTypes.indexOf(ext) != -1) {
                photo.isPhoto = true;
            } else if(videoTypes.indexOf(ext) != -1) {
                photo.isVideo = true;
            } else if(audioTypes.indexOf(ext) != -1) {
                photo.isAudio = true;
                $scope.playlist.push(photo);
            } else {
                photo.isPdf = true;
            }
            return photo;
        }
        
        function getUrlParameter(param) {
            var sPageURL = $location.$$absUrl,
            sURLVariables = sPageURL.split(/[&||?]/);
            
            res = "";
            for (var i = 0; i < sURLVariables.length; i += 1) {
                var paramName = sURLVariables[i],
                sParameterName = (paramName || '').split('=');
                if (sParameterName[0] === param) {
                    res = sParameterName[1];
                }
            }
            return res;
        }
        
        $scope.openModal = function(id){
            ModalService.Open(id);
        };
		
        $scope.getMatchingTags = function(tag) {
			var matchedTags = [];
			for (tag of $scope.tags) {
				if(tag.tags.match('/' + tag + '.*/')){
					matchedTags.push(tag.tags);					
				}
			}
            return matchedTags;
        };		

        $scope.closeModal = function(id) {
            ModalService.Close(id);
        };      

        $scope.editImageTag = function(photo) {
            $scope.selectedPhoto = angular.copy(photo);
            $scope.selectedOption = null; // Reset dropdown
            var modalEl = document.getElementById('editTagModal');
            var modal = new bootstrap.Modal(modalEl);
            modal.show();
        };

        // Handle tag selection from dropdown
        $scope.onTagSelected = function(selectedTag) {
            if (selectedTag) {
                // Replace or append the selected tag to the textarea
                $scope.selectedPhoto.tags = selectedTag;
            }
        };

        $scope.updatePhotoTag = function(id, name, tags){
            // Use TaggingService for tag validation
            var validation = TaggingService.validateTags(tags);
            if (!validation.valid) {
                alert('Tag validation failed: ' + validation.message);
                return;
            }
            
            var cleanTags = (tags || '').trim();
            if (!cleanTags) {
                alert('Please enter at least one tag or description');
                return;
            }
            
            $scope.loading = true;
            var photoTag = {};
            if(parseInt(id) > 0){
                photoTag = {"id": id, "name": name, "tags": cleanTags};
            } else {
                photoTag = {"name": name, "tags": cleanTags};
            }
            PhotoService.create(photoTag)
                    .then(function successCallback(response) {
                            $scope.updateTag(id, cleanTags, response);
                            $scope.loading = false;
                            $('#editTagModal').modal('hide');
                            $scope.selectedOption = null;
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error updating image tag');
                        alert('Update tag failed!');
                        $scope.loading = false;
                    });
        };
      
        $scope.$watch('uploadFile', function(newFile) {
            if (newFile) $scope.previewFile();
        });

        $scope.submitEditTagForm = function() {
            $scope.updatePhotoTag($scope.selectedPhoto.id, $scope.selectedPhoto.path, $scope.selectedPhoto.tags);
        };

        // Clear tag text from modal
        $scope.clearTagText = function() {
            if (confirm('Clear all tag text?')) {
                $scope.selectedPhoto.tags = '';
                $scope.selectedOption = null; // Reset dropdown selection
            }
        };

        // =========== ALBUM TAGGING METHODS ===========

        // Edit album tags
        $scope.editAlbumTag = function(album) {
            if (!album.album) {
                alert('Album name not found');
                return;
            }
            
            // Store the folder object with all its data
            $scope.editingAlbum = {
                name: album.album,
                path: album.path,
                album: album.album,
                tags: album.tags || '',
                id: album.id // Keep ID if available
            };
            
            var modalEl = document.getElementById('editAlbumTagModal');
            if (modalEl) {
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            } else {
                alert('Album tag modal not found. Please add the modal to the template.');
            }
        };

        // Update album tags
        $scope.updateAlbumTagText = function() {
            if (!$scope.editingAlbum || !$scope.editingAlbum.album) {
                alert('Album name not found');
                return;
            }

            var cleanTags = ($scope.editingAlbum.tags || '').trim();
            
            // Validate tags using TaggingService
            var validation = TaggingService.validateTags(cleanTags);
            if (!validation.valid) {
                alert('Tag validation failed: ' + validation.message);
                return;
            }
            var albumName = $scope.editingAlbum.album;
            
            $scope.loading = true;
            
            // Check if we have a valid numeric ID (must be a positive integer)
            var hasValidId = $scope.editingAlbum.id && 
                             typeof $scope.editingAlbum.id === 'number' && 
                             $scope.editingAlbum.id > 0;
            
            var updatePromise;
            
            if (hasValidId) {
                // Update existing album in database
                updatePromise = PhotoService.updateAlbumTag($scope.editingAlbum.id, cleanTags);
            } else {
                // Create new album entry in database first
                updatePromise = $http.post('/albums', {
                    name: albumName,
                    path: $scope.editingAlbum.path || '',
                    tags: cleanTags,
                    description: ''
                }).then(function(response) {
                    if (response.data && response.data.id) {
                        $scope.editingAlbum.id = response.data.id;
                        return response.data;
                    } else {
                        throw new Error('Invalid response: no ID returned');
                    }
                }).catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error creating album');
                    throw error;
                });
            }
            
            updatePromise
                .then(function(response) {
                    $scope.loading = false;
                    $('#editAlbumTagModal').modal('hide');
                    alert('Album tags updated successfully');
                    
                    // Update the folder in the list with the ID from database
                    for (var i = 0; i < $scope.folders.length; i++) {
                        if ($scope.folders[i].album === albumName) {
                            $scope.folders[i].tags = cleanTags;
                            $scope.folders[i].id = $scope.editingAlbum.id;
                            break;
                        }
                    }
                    
                    // Reload all album tags to ensure sync with database
                    loadAndMergeAlbumTags();
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error updating album tags');
                    $scope.loading = false;
                    
                    // Provide helpful error message
                    var errorMsg = 'Failed to update album tags. ';
                    if (error.data && error.data.message) {
                        errorMsg += error.data.message;
                    } else if (error.message) {
                        errorMsg += error.message;
                    } else {
                        errorMsg += 'Check console for details.';
                    }
                    alert(errorMsg);
                });
        };

        // Clear album tag text
        $scope.clearAlbumTagText = function() {
            if (confirm('Clear all album tag text?')) {
                $scope.editingAlbum.tags = '';
                $scope.selectedAlbumOption = null;
            }
        };

        // Submit album tag form
        $scope.submitEditAlbumTagForm = function() {
            $scope.updateAlbumTagText();
        };

        // Search albums by tag
        $scope.searchAlbumsByTag = function(tag) {
            $scope.loading = true;
            PhotoService.getAlbumsByTag(tag)
                .then(function(albums) {
                    // Filter the folders list to show only albums with this tag
                    $scope.folders = albums.map(album => ({
                        album: album.name,
                        path: album.path,
                        id: album.id,
                        tags: album.tags,
                        isAlbum: true
                    }));
                    $scope.loading = false;
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error searching albums by tag');
                    $scope.loading = false;
                });
        };

        // =====================================================================
        // PLAYLIST FUNCTIONS ===================================================
        // =====================================================================

        // Load playlists from database
        function loadPlaylists() {
            PhotoService.getPlaylists()
                .then(function(playlists) {
                    $scope.playlists = playlists || [];
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading playlists');
                    $scope.playlists = [];
                });
        }

        // Switch between Albums and Playlists view
        $scope.switchView = function(view) {
            $scope.selectedView = view;
            if (view === 'playlists') {
                loadPlaylists();
            }
        };

        // Set selected playlist
        $scope.setPlaylist = function(playlist) {
            $scope.loading = true;
            
            // Clear audio player when switching to a different playlist
            // This prevents audio files from the previous playlist from remaining in the player
            if (!$scope.selectedAlbum || $scope.selectedAlbum.id !== playlist.id) {
                AudioPlayerService.clearPlaylist();
            }
            
            PhotoService.getPlaylistItems(playlist.id)
                .then(function(items) {
                    $scope.selectedPlaylistItems = items || [];
                    $scope.selectedAlbum = {
                        id: playlist.id,
                        name: playlist.name,
                        isPlaylist: true
                    };
                    $scope.loading = false;
                    
                    // Display playlist items like album photos
                    // Important: set media type properties for each item
                    const photos = (items || []).map(photo => getImageType(photo));
                    $scope.photos = photos;
                    $scope.totalPhotos = photos.length;
                    $scope.totalPages = 1;
                    
                    // Reinitialize Fancybox after Angular renders playlist items
                    $timeout(function() {
                        if (typeof initFancybox === 'function') {
                            initFancybox();
                        }
                    }, 100);
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error loading playlist items');
                    $scope.loading = false;
                });
        };

        // Open create playlist modal
        $scope.openCreatePlaylistModal = function() {
            $scope.editingPlaylist = {
                name: '',
                description: '',
                tags: ''
            };
            $scope.showPlaylistModal = true;
            
            // Show modal using Bootstrap 5
            $timeout(function() {
                var modalEl = document.getElementById('createPlaylistModal');
                if (modalEl) {
                    // Ensure body can handle multiple modals
                    document.body.classList.add('modal-open');
                    
                    var modal = new bootstrap.Modal(modalEl, {
                        backdrop: true,
                        keyboard: true,
                        focus: true
                    });
                    modal.show();
                    
                    // Handle modal hidden event to restore previous modal
                    modalEl.addEventListener('hidden.bs.modal', function(e) {
                        // Ensure modal-open class stays if other modals are open
                        if (document.querySelectorAll('.modal.show').length > 0) {
                            document.body.classList.add('modal-open');
                        }
                    }, { once: true });
                }
            }, 100);
        };
        
        // Open add to playlist modal from Fancybox
        $scope.openAddToPlaylistModal = function(photo) {
            if (!photo) return;
            
            // Set the selected photo for adding to playlist
            $scope.selectedPhotoForPlaylist = photo;
            
            // Show modal
            $timeout(function() {
                var modalEl = document.getElementById('addToPlaylistModal');
                if (modalEl) {
                    var modal = new bootstrap.Modal(modalEl);
                    modal.show();
                } else {
                    // Fallback: prompt for quick add
                    var playlistName = prompt('Enter playlist name to add this item:');
                    if (playlistName && playlistName.trim()) {
                        $scope.addPhotoToPlaylist(playlistName.trim(), photo);
                    }
                }
            }, 100);
        };
        
        // Add photo to specific playlist (supports both single and bulk operations)
        $scope.addPhotoToPlaylist = function(playlistName, photo) {
            // Find playlist by name
            var playlist = $scope.playlists.find(function(p) { return p.name === playlistName; });
            
            if (!playlist) {
                alert('Playlist "' + playlistName + '" not found');
                return;
            }
            
            $scope.loading = true;
            
            // Check if this is a bulk operation
            var photoPaths;
            var itemCount;
            
            if ($scope.isBulkPlaylistOperation && $scope.selectedPhotosForBulkPlaylist) {
                // Bulk operation
                photoPaths = $scope.selectedPhotosForBulkPlaylist;
                itemCount = photoPaths.length;
            } else if (photo) {
                // Single photo operation
                photoPaths = [photo.path];
                itemCount = 1;
            } else {
                $scope.loading = false;
                alert('No photos to add');
                return;
            }
            
            PhotoService.addPlaylistItems(playlist.id, photoPaths)
                .then(function(response) {
                    $scope.loading = false;
                    alert('Added ' + itemCount + ' item(s) to playlist: ' + playlistName);
                    $('#addToPlaylistModal').modal('hide');
                    
                    // Clear bulk operation flags
                    $scope.isBulkPlaylistOperation = false;
                    $scope.selectedPhotosForBulkPlaylist = null;
                    
                    // Clear bulk selections if it was a bulk operation
                    if (itemCount > 1 && window.bulkOps) {
                        window.bulkOps.clearSelection();
                    }
                })
                .catch(function(error) {
                    $scope.loading = false;
                    ErrorHandlingService.handleError(error, 'Error adding to playlist');
                    
                    // Clear bulk operation flags even on error
                    $scope.isBulkPlaylistOperation = false;
                    $scope.selectedPhotosForBulkPlaylist = null;
                });
        };

        // Create new playlist
        $scope.createNewPlaylist = function() {
            if (!$scope.editingPlaylist.name || !$scope.editingPlaylist.name.trim()) {
                alert('Playlist name is required');
                return;
            }

            $scope.loading = true;
            
            PhotoService.createPlaylist(
                $scope.editingPlaylist.name.trim(),
                $scope.editingPlaylist.description || '',
                $scope.editingPlaylist.tags || ''
            )
                .then(function(response) {
                    $scope.loading = false;
                    
                    // Get the newly created playlist ID
                    var newPlaylistId = response.id;
                    var newPlaylistName = $scope.editingPlaylist.name.trim();
                    
                    if (!newPlaylistId) {
                        alert('Playlist created but ID not returned');
                        $('#createPlaylistModal').modal('hide');
                        loadPlaylists();
                        return;
                    }
                    
                    // Check if there are pending items to add
                    var itemsToAdd = null;
                    if ($scope.isBulkPlaylistOperation && $scope.selectedPhotosForBulkPlaylist && $scope.selectedPhotosForBulkPlaylist.length > 0) {
                        itemsToAdd = $scope.selectedPhotosForBulkPlaylist;
                    } else if ($scope.selectedPhotoForPlaylist) {
                        itemsToAdd = [$scope.selectedPhotoForPlaylist.path];
                    }
                    
                    // Hide the create modal
                    $('#createPlaylistModal').modal('hide');
                    
                    // If there are items pending, add them to the new playlist
                    if (itemsToAdd && itemsToAdd.length > 0) {
                        $scope.loading = true;
                        PhotoService.addPlaylistItems(newPlaylistId, itemsToAdd)
                            .then(function(response) {
                                $scope.loading = false;
                                alert('Playlist created and ' + itemsToAdd.length + ' item(s) added successfully!');
                                
                                // Hide the add to playlist modal since we're done
                                $('#addToPlaylistModal').modal('hide');
                                
                                // Clear bulk operation flags
                                $scope.isBulkPlaylistOperation = false;
                                $scope.selectedPhotosForBulkPlaylist = null;
                                $scope.selectedPhotoForPlaylist = null;
                                
                                // Clear bulk selections if it was a bulk operation
                                if (itemsToAdd.length > 1 && window.bulkOps) {
                                    window.bulkOps.clearSelection();
                                }
                                
                                // Reload playlists
                                loadPlaylists();
                            })
                            .catch(function(error) {
                                $scope.loading = false;
                                alert('Playlist created but failed to add items: ' + (error.data?.message || 'Unknown error'));
                                ErrorHandlingService.handleError(error, 'Error adding items to new playlist');
                                loadPlaylists();
                            });
                    } else {
                        alert('Playlist created successfully');
                        // Reload playlists
                        loadPlaylists();
                    }
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error creating playlist');
                    $scope.loading = false;
                    
                    var errorMsg = 'Failed to create playlist. ';
                    if (error.data && error.data.message) {
                        errorMsg += error.data.message;
                    } else if (error.status === 409) {
                        errorMsg += 'A playlist with this name already exists.';
                    } else {
                        errorMsg += 'Check console for details.';
                    }
                    alert(errorMsg);
                });
        };

        // Update playlist tags
        $scope.editPlaylistTag = function(playlist) {
            if (!playlist.name) {
                alert('Playlist name not found');
                return;
            }
            
            $scope.editingPlaylist = {
                id: playlist.id,
                name: playlist.name,
                tags: playlist.tags || '',
                isEdit: true
            };
            
            var modalEl = document.getElementById('editPlaylistTagModal');
            if (modalEl) {
                var modal = new bootstrap.Modal(modalEl);
                modal.show();
            } else {
                alert('Edit playlist modal not found. Please add the modal to the template.');
            }
        };

        // Update playlist tags
        $scope.updatePlaylistTagText = function() {
            if (!$scope.editingPlaylist || !$scope.editingPlaylist.id) {
                alert('Playlist ID not found');
                return;
            }

            var cleanTags = ($scope.editingPlaylist.tags || '').trim();
            
            // Validate tags using TaggingService
            var validation = TaggingService.validateTags(cleanTags);
            if (!validation.valid) {
                alert('Tag validation failed: ' + validation.message);
                return;
            }
            
            $scope.loading = true;
            
            PhotoService.updatePlaylistTag($scope.editingPlaylist.id, cleanTags)
                .then(function(response) {
                    $scope.loading = false;
                    $('#editPlaylistTagModal').modal('hide');
                    alert('Playlist tags updated successfully');
                    
                    // Update the playlist in the list
                    for (var i = 0; i < $scope.playlists.length; i++) {
                        if ($scope.playlists[i].id === $scope.editingPlaylist.id) {
                            $scope.playlists[i].tags = cleanTags;
                            break;
                        }
                    }
                    
                    // Reload playlists to ensure sync with database
                    loadPlaylists();
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error updating playlist tags');
                    $scope.loading = false;
                    
                    var errorMsg = 'Failed to update playlist tags. ';
                    if (error.data && error.data.message) {
                        errorMsg += error.data.message;
                    } else if (error.message) {
                        errorMsg += error.message;
                    } else {
                        errorMsg += 'Check console for details.';
                    }
                    alert(errorMsg);
                });
        };

        // Clear playlist tag text
        $scope.clearPlaylistTagText = function() {
            if (confirm('Clear all playlist tag text?')) {
                $scope.editingPlaylist.tags = '';
            }
        };

        // Submit edit playlist tag form
        $scope.submitEditPlaylistTagForm = function() {
            $scope.updatePlaylistTagText();
        };

        // Remove playlist
        $scope.removePlaylist = function(playlist) {
            if (!confirm('Are you sure you want to delete the "' + playlist.name + '" playlist?')) {
                return;
            }
            
            $scope.loading = true;
            
            PhotoService.removePlaylist(playlist.id)
                .then(function(response) {
                    $scope.loading = false;
                    alert('Playlist deleted successfully');
                    
                    // Reload playlists
                    loadPlaylists();
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error deleting playlist');
                    $scope.loading = false;
                    alert('Failed to delete playlist');
                });
        };

        // Remove item from playlist
        $scope.removePlaylistItem = function(itemId) {
            if (!$scope.selectedAlbum || !$scope.selectedAlbum.id) {
                alert('No playlist selected');
                return;
            }
            
            if (!confirm('Remove item from playlist?')) {
                return;
            }
            
            $scope.loading = true;
            
            PhotoService.removePlaylistItem($scope.selectedAlbum.id, itemId)
                .then(function(response) {
                    $scope.loading = false;
                    
                    // Reload playlist items
                    $scope.setPlaylist($scope.selectedAlbum);
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error removing playlist item');
                    $scope.loading = false;
                    alert('Failed to remove item from playlist');
                });
        };

        // Search playlists by tag
        $scope.searchPlaylistsByTag = function(tag) {
            $scope.loading = true;
            PhotoService.getPlaylistsByTag(tag)
                .then(function(playlists) {
                    $scope.playlists = playlists || [];
                    $scope.loading = false;
                })
                .catch(function(error) {
                    ErrorHandlingService.handleError(error, 'Error searching playlists by tag');
                    $scope.loading = false;
                    alert('Failed to search playlists by tag');
                });
        };

        $scope.editImageTag2= function (photo) {

          var html = '<div class="message">';
          if(photo.isPhoto) {
            html += '<img class="img-fluid" id="selectedFile" src="'+ photo.path +'" width=225 height=150/>';
          }
          html += '<form action="/" method="post" id="form' + photo.id + '">';
          html += '<h3> Update photo description</h3>';
          if(parseInt(photo.id) > 0){
              html += '<p><input type="hidden" name="id" value="' + photo.id + '"/>';
          }
          html += '<p><input type="hidden" name="name" value="' + photo.path + '"/>';

          html += '<div class="select-editable">';
          html += '<select onchange="this.nextElementSibling.value=this.value">';     
          for(tag of $scope.tags){
			  if(tag.tags) {
				html += '<option value="' + tag.tags + '"' +'>' + tag.tags +'</option>';
			  }
          }

          html += '</select>';
          html += '<textarea style="width: 100%; max-width: 100%;" name="tags" rows="4" cols="80">' +  photo.tags + '</textarea>';
          html += '</div></p>';

          html += '<p><input type="button" value="Update" onClick="submitUpdateTagForm(form' + photo.id + ',' +  "'" + photo.id + "'"+ ');"/>'; 
          html += '<input type="button" value="Cancel" onClick="closeFancyBoxForm();"/>';
          html += '<input type="button" value="X" onClick="clearTagBox(\'#form' + photo.id + '\', \'tags\')" /></p>';
          

          html += '</form></div>';
          $.fancybox.open(html);
        };
        
       
        $scope.selectUploadFile2= function (photo) {

          var html = '<div class="message">';
          html += '<form action="/upload" method="post" id="uploadForm" encType="multipart/form-data">';
          html += '<p><h3>Upload File</h3>';
          html += '<input type="file" name="myFile" id="uploadFile" onClick="this.value = null" onChange="displayUploadedFile(this);"/></p>';
          html += '<img class="img-fluid" id="selectedFile" src=""/>';        
          html += '<p><h4>Enter file description</h4>';
          html += '<textarea style="width: 100%; max-width: 100%;" name="tags" rows=4 column=80></textarea>';
          html += '<p><h4>Select folder OR enter name</h4>';          
          html += '<div class="select-editable">';
          html += '<select onchange="this.nextElementSibling.value=this.value">';     
          for(album of $scope.albums){
            html += '<option value="' + album.path + '"' + ($scope.selectedAlbum.name == album.name ? 'selected="selected"': '')+'>' + album.name +'</option>';
          }
          html += '</select>';
          html += '<input type="text" style="width: 100%; max-width: 100%;" name="album" value="' + $scope.selectedAlbum.path +'"/>'; 
          html += '</div></p>';       
          html += '<p><input type="button" value="Upload" onClick="submitUploadForm(uploadForm);"/>';
          html += '<input type="button" value="Cancel" onClick="closeFancyBoxForm();"/></p>';
          html += '</form></div>';
          $.fancybox.open(html);
        };
        
        // Watch for change in numberOfItemsOnPage
        $scope.$watch('numberOfItemsOnPage', function(newVal, oldVal) {
            if (newVal !== oldVal && newVal > 0) {
                let firstItemIndex = $scope.pageId * oldVal;
                let pageId = Math.floor(firstItemIndex / newVal);
                $scope.loadAlbumWithPageId(pageId);
            }
        });

        $scope.scrollToTop = function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // Show button when scrolling down
        window.onscroll = function() {
            const btn = document.getElementById("goTopBtn");
            if (!btn) return;
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                btn.classList.add("show");
                btn.classList.remove("hide");
            } else {
                btn.classList.add("hide");
                btn.classList.remove("show");
            }
        };

        // =========== AUDIO PLAYER FUNCTIONS - DELEGATING TO AudioPlayerService ===========

        // Add to playlist and play
        $scope.playAudio = function(image) {
            if (!image || !image.isAudio) return;
            
            // Get all audio files from current photos
            var audioFiles = $scope.photos.filter(function(photo) {
                return photo && photo.isAudio;
            });
            
            if (audioFiles.length === 0) return;
            
            // Get current player state
            var playerState = AudioPlayerService.getState();
            
            // Check if this exact playlist is already loaded (compare all audio files)
            var isCurrentPlaylist = playerState.playlist.length === audioFiles.length &&
                playerState.playlist.every(function(track, index) {
                    return audioFiles[index] && track.path === audioFiles[index].path;
                });
            
            // If it's the same playlist, just set the current track and play
            if (isCurrentPlaylist) {
                // Find the clicked file's index in the current playlist
                var clickedIndex = playerState.playlist.findIndex(function(t) {
                    return t.path === image.path;
                });
                if (clickedIndex >= 0) {
                    playerState.currentIndex = clickedIndex;
                    AudioPlayerService.playTrack(image);
                }
                return;
            }
            
            // If it's a different playlist, clear and rebuild
            AudioPlayerService.clearPlaylist();
            
            // Build complete playlist with all audio files from current view
            var clickedIndex = -1;
            audioFiles.forEach(function(audioFile, index) {
                AudioPlayerService.addToPlaylist(audioFile, false); // false = don't auto-play yet
                // Track which index is the clicked file
                if (audioFile.path === image.path) {
                    clickedIndex = index;
                }
            });
            
            // Now play the clicked track by index
            if (clickedIndex >= 0) {
                playerState = AudioPlayerService.getState();
                playerState.currentIndex = clickedIndex;
                AudioPlayerService.playTrack(audioFiles[clickedIndex]);
            }
        };

        $scope.togglePlay = function() {
            AudioPlayerService.togglePlay();
        };

        $scope.next = function() {
            AudioPlayerService.next();
        };

        $scope.prev = function() {
            AudioPlayerService.previous();
        };

        $scope.seek = function(event) {
            var bar = event.target;
            var clickX = event.offsetX;
            var width = bar.offsetWidth;
            var percent = (clickX / width) * 100;
            AudioPlayerService.seek(percent);
        };

        // Volume control
        $scope.setVolume = function() {
            AudioPlayerService.setVolume($scope.volume);
        };

        // Toggle shuffle
        $scope.toggleShuffle = function() {
            AudioPlayerService.toggleShuffle();
        };

        // Toggle repeat
        $scope.toggleRepeat = function() {
            AudioPlayerService.toggleRepeat();
        };

        // Play track by index
        $scope.playTrackByIndex = function(index) {
            if (index >= 0 && index < $scope.playlist.length) {
                AudioPlayerService.playTrackByIndex(index);
            }
        };

        // Remove track from playlist
        $scope.removeFromPlaylist = function(index) {
            if (index >= 0 && index < $scope.playlist.length) {
                AudioPlayerService.removeFromPlaylist(index);
            }
        };

        // Add to playlist queue (without auto-play)
        $scope.addToPlaylistQueue = function(image) {
            // Check if already in playlist
            var alreadyExists = $scope.playlist.some(function(track) {
                return track.path === image.path;
            });
            
            if (!alreadyExists) {
                AudioPlayerService.addToPlaylist(image);
                ModalService.showModal('Added to Playlist', image.tags || 'Track added to playlist');
            } else {
                ModalService.showModal('Already in Playlist', 'This track is already in the playlist');
            }
        };

        $scope.previewFile = function() {
            if ($scope.uploadFile && $scope.uploadFile.type) {
                var reader = new FileReader();
                reader.onload = function(e) {
                $scope.$apply(function() {
                    $scope.filePreviewUrl = e.target.result;
                });
                };
                reader.readAsDataURL($scope.uploadFile);
            } else {
                $scope.filePreviewUrl = '';
            }
        };

        $scope.albumDropdownChanged = function() {
        // Optionally sync dropdown and input
        };

        $scope.selectUploadFile = function() {
            $scope.uploadAlbum = $scope.selectedAlbum.name;
            $('#uploadModal').modal('show');
        };

        $scope.submitUploadForm = function() {
            $scope.uploadFile($scope.uploadFile, $scope.uploadTags, $scope.uploadAlbum);
        };

        $scope.uploadFile = function(file, tags, album){
            $scope.loading = true;
            PhotoService.upload(file, tags, album)
                    .then(function successCallback(response) {
                            $scope.loadAlbum();
                            $scope.loading = false;
                            $('#uploadModal').modal('hide');
                    }, function(error) {
                        ErrorHandlingService.handleError(error, 'Error uploading file');
                        alert('Upload failed!');
                    });
        };

      
        $scope.$watch('uploadFile', function(newFile) {
            if (newFile) $scope.previewFile();
        });

        // Toggle favorite status for a photo
        $scope.toggleFavorite = function(image) {
            if (!image.path) return;
            
            const isFavorite = !image.isFavorite;
            const encodedPath = encodeURIComponent(image.path);
            
            $http.post(`/api/photos/${encodedPath}/favorite`, { isFavorite: isFavorite })
                .then(function successCallback(response) {
                    image.isFavorite = isFavorite;
                    // Update favorites count
                    if (isFavorite) {
                        $scope.favoritesCount++;
                    } else {
                        $scope.favoritesCount = Math.max(0, $scope.favoritesCount - 1);
                    }
                }, function(error) {
                    ErrorHandlingService.handleError(error, 'Error toggling favorite');
                    alert('Failed to toggle favorite');
                });
        };

        // Share photo (placeholder for future share functionality)
        $scope.sharePhoto = function(image) {
            if (!image.path) return;
            
            const encodedPath = encodeURIComponent(image.path);
            const shareUrl = window.location.origin + '?photo=' + encodedPath;
            
            if (navigator.share) {
                navigator.share({
                    title: image.tags || 'Photo',
                    url: shareUrl
                }).catch(err => alert('Error creating share link'));
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(shareUrl);
                alert('Share link copied to clipboard!');
            }
        };

        // Show EXIF modal for a photo
        $scope.showExifModal = function(image) {
            if (!image.path) return;
            
            const encodedPath = encodeURIComponent(image.path);
            
            $http.get(`/api/photos/${encodedPath}/exif`)
                .then(function successCallback(response) {
                    // Display EXIF data (can be enhanced with a modal)
                    alert('EXIF data retrieved. Check console for details.');
                }, function(error) {
                    ErrorHandlingService.handleError(error, 'Error fetching EXIF data');
                    alert('Failed to load EXIF data');
                });
        };

        // Recently Viewed Functions
        // ================================================================
        
        /**
         * Load recently viewed albums
         */
        $scope.loadRecentlyViewed = function() {
            $scope.recentlyViewed = RecentlyViewedService.getRecentAlbums();
        };
        
        /**
         * Toggle recently viewed section visibility
         */
        $scope.toggleRecentlyViewed = function() {
            $scope.showRecentlyViewed = !$scope.showRecentlyViewed;
        };
        
        /**
         * Clear all recently viewed items
         */
        $scope.clearRecentlyViewed = function() {
            if (confirm('Clear all recently viewed albums?')) {
                RecentlyViewedService.clearRecentlyViewed();
                $scope.loadRecentlyViewed();
            }
        };
        
        /**
         * Format timestamp for display
         */
        $scope.formatRecentTime = function(timestamp) {
            return RecentlyViewedService.formatTimestamp(timestamp);
        };
        
        /**
         * View a recently viewed album
         */
        $scope.viewRecentAlbum = function(recentItem) {
            var album = {
                album: recentItem.album,
                path: recentItem.path,
                name: recentItem.name
            };
            $scope.setAlbum(album);
        };
        
        // Initialize recently viewed on page load
        $scope.loadRecentlyViewed();

}]);