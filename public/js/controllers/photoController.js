
angular.module('photoController', [])

    // inject the Photo service factory into our controller
    .controller('photoController', ['$scope','$http', '$location','$timeout','PhotoService','ModalService','RecentlyViewedService', function($scope, $http, $location, $timeout, PhotoService, ModalService, RecentlyViewedService) {

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
        imageTypes = ['jpg', 'png', 'jpeg', 'bmp', 'gif'];
        videoTypes = ['mp4', 'avi', 'mov', '3gp', 'mkv', 'mpg','mpeg', 'mts', 'm4v', 'divx', 'xvid'];
        audioTypes = ['mp3', 'amr', 'wav'];
		$scope.pageId = 0;
        $scope.totalPhotos = 0;
        $scope.totalPages = 0;
		$scope.numberOfItemsOnPage = 20;
        // music player
        var audio = new Audio();
        $scope.playlist = [];
        $scope.currentIndex = -1;
        $scope.isPlaying = false;
        $scope.currentTime = "0:00";
        $scope.duration = "0:00";
        $scope.progress = 0;
        $scope.volume = 80; // Default volume 80%
        $scope.isShuffle = false;
        $scope.isRepeat = false;
        $scope.showPlaylist = false;   
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
        
        // Extended video formats support (includes WebM, Ogg Theora, and more)
        videoTypes = ['mp4', 'avi', 'mov', '3gp', 'mkv', 'mpg','mpeg', 'mts', 'm4v', 'divx', 'xvid', 'webm', 'ogg', 'ogv', 'flv', 'wmv', 'asf', 'rm', 'rmvb', 'ts', 'vob', 'f4v'];
        
        // GET =====================================================================
        // when landing on the page, get all photos and tags and show them
        // use the service to get all the photo tags
        loadPhotos();

        $scope.search = function() {
            if($scope.searchTag && $scope.searchTag.trim() !== ''){
                $scope.loading = true;
                $location.search('q', $scope.searchTag);
                PhotoService.getTagsByTag($scope.searchTag)
                    // if successful creation, call our get function to get all the new photos
                    .then(function successCallback(response) {                          
							updatePhotoTagsFromDb(response.data);
                            $scope.loading = false;
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                    });
            }
        };
        
        $scope.clearSearch = function() {
            $scope.searchTag = "";
            $scope.showSearch = false; // hide box after clearing
        };

        // Clear albums search and show all albums
        $scope.clearAlbumsSearch = function() {
            $scope.albumsSearchText = "";
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
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
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
                }, function errorCallback(response) {
                    console.error('Error loading favorites:', response);
                    // Silently fail - continue without favorites
                });
        };
		
        // load photos from next page
        $scope.nextPage = function() {
			if(!$scope.noMorePhotos) {
				$scope.pageId = $scope.pageId  + 1;
				$scope.getPhotos(getSelectedAlbumsId());
			}
        };
		
        // load photos from prev page
        $scope.prevPage = function() {
			$scope.pageId = $scope.pageId  - 1;
			if($scope.pageId >= 0) {
				$scope.getPhotos(getSelectedAlbumsId());
			} else {
				$scope.pageId = 0;
			}
        };
		
		function getSelectedAlbumsId(){
			var id = $scope.selectedAlbum.path;
			return (id == "Home"? "" : id);
		}
        
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
                }, function errorCallback(response) {
                    console.error('Error loading favorites:', response);
                    $scope.photos = [];
                    $scope.favoritesCount = 0;
                    $scope.loading = false;
                });
        };
		
		function showNoMorePhotos() {			
			setTimeout(function() {
				$scope.noMorePhotos = false;
			}, 5000); // <-- time in milliseconds
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
                $scope.loading = false;
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
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
            hits: 0,
            misses: 0,
            hitRate: '0%',
            cacheEntries: 0,
            cacheSizeBytes: 0,
            cacheSizeMB: '0',
            maxCacheBytes: '0',
            maxCacheEntries: 0
        };
        $scope.topAlbums = [];
        
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
                    console.log('Cache stats loaded:', $scope.cacheStats);
                }, function errorCallback(error) {
                    console.error('Error loading cache stats:', error);
                    alert('Failed to load cache statistics');
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
                    console.error('Error scanning for albums:', error);
                    alert('Failed to scan for new albums. See console for details.');
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
                            alert(`✓ Cleared ${response.data.entriesRemoved} cache entries for: ${$scope.selectedAlbum.name}`);
                            // Reload cache stats
                            $scope.loadCacheStats();
                        }
                    }, function errorCallback(error) {
                        console.error('Error clearing cache:', error);
                        alert('Failed to clear cache');
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
                            alert(`✓ Cleared entire cache (${response.data.entriesRemoved} entries)`);
                            // Reload cache stats
                            $scope.loadCacheStats();
                        }
                    }, function errorCallback(error) {
                        console.error('Error clearing cache:', error);
                        alert('Failed to clear cache');
                    });
            }
        };
        
        // Load cache stats when modal is opened
        $('#cacheStatsModal').on('show.bs.modal', function() {
            $scope.$apply(function() {
                $scope.loadCacheStats();
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
            }, function errorCallback(response) {
                $scope.loading = false;
                // called asynchronously if an error occurs
                // or server returns response with an error status.
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
                    console.log('Loaded album tags:', tags);
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
                    
                    console.log('Folders with tags:', $scope.folders);
                    // Don't call $apply() here - we're already in Angular's digest cycle
                })
                .catch(function(error) {
                    console.error('Error loading album tags:', error);
                    // Continue anyway, tags just won't be displayed
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
            // Trim whitespace from tags
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
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
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
            var albumName = $scope.editingAlbum.album;
            
            $scope.loading = true;
            
            // Check if we have a valid numeric ID (must be a positive integer)
            var hasValidId = $scope.editingAlbum.id && 
                             typeof $scope.editingAlbum.id === 'number' && 
                             $scope.editingAlbum.id > 0;
            
            var updatePromise;
            
            if (hasValidId) {
                // Update existing album in database
                console.log('Updating existing album ID:', $scope.editingAlbum.id);
                updatePromise = PhotoService.updateAlbumTag($scope.editingAlbum.id, cleanTags);
            } else {
                // Create new album entry in database first
                console.log('Creating new album entry:', albumName);
                updatePromise = $http.post('/albums', {
                    name: albumName,
                    path: $scope.editingAlbum.path || '',
                    tags: cleanTags,
                    description: ''
                }).then(function(response) {
                    console.log('Album created with response:', response);
                    if (response.data && response.data.id) {
                        $scope.editingAlbum.id = response.data.id;
                        return response.data;
                    } else {
                        throw new Error('Invalid response: no ID returned');
                    }
                }).catch(function(error) {
                    console.error('Error creating album:', error);
                    throw error;
                });
            }
            
            updatePromise
                .then(function(response) {
                    console.log('Album tags updated successfully:', response);
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
                    console.error('Error updating album tags:', error);
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
                    console.log('Albums with tag:', albums);
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
                    console.error('Error searching albums by tag:', error);
                    $scope.loading = false;
                    alert('Failed to search albums by tag');
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

        function formatTime(seconds) {
            var minutes = Math.floor(seconds / 60) || 0;
            var secs = Math.floor(seconds % 60) || 0;
            return minutes + ":" + (secs < 10 ? "0" : "") + secs;
        }

        // Add to playlist and play
        $scope.playAudio = function(image) {
            if (!image.isAudio) return;

            // If not already in playlist, add it
            var existingIndex = $scope.playlist.findIndex(track => track.path === image.path);
            if (existingIndex === -1) {
                $scope.playlist.push(image);
                $scope.currentIndex = $scope.playlist.length - 1;
            } else {
                $scope.currentIndex = existingIndex;
            }

            startPlayback();
        };

        function startPlayback() {
            var track = $scope.playlist[$scope.currentIndex];
            if (!track) return;

            audio.src = track.path;
            audio.play();
            $scope.isPlaying = true;
        }

        $scope.togglePlay = function() {
            if ($scope.isPlaying) {
            audio.pause();
            $scope.isPlaying = false;
            } else {
                if(!audio.src) {
                    startPlayback();
                } else {
                    audio.play();
                    $scope.isPlaying = true;
                }
            }
        };

        $scope.next = function() {
            if ($scope.playlist.length === 0) return;
            
            if ($scope.isShuffle) {
                // Random next track (but not the current one if playlist has more than 1 track)
                var nextIndex;
                do {
                    nextIndex = Math.floor(Math.random() * $scope.playlist.length);
                } while (nextIndex === $scope.currentIndex && $scope.playlist.length > 1);
                $scope.currentIndex = nextIndex;
            } else {
                // Sequential next track
                $scope.currentIndex = ($scope.currentIndex + 1) % $scope.playlist.length;
            }
            
            startPlayback();
        };

        $scope.prev = function() {
            if ($scope.playlist.length === 0) return;
            $scope.currentIndex = ($scope.currentIndex - 1 + $scope.playlist.length) % $scope.playlist.length;
            startPlayback();
        };

        $scope.seek = function(event) {
            var bar = event.target;
            var clickX = event.offsetX;
            var width = bar.offsetWidth;
            var newTime = (clickX / width) * audio.duration;
            audio.currentTime = newTime;
        };

        // update progress bar
        audio.addEventListener("timeupdate", function() {
            $scope.$apply(function() {
            $scope.currentTime = formatTime(audio.currentTime);
            $scope.duration = formatTime(audio.duration);
            $scope.progress = (audio.currentTime / audio.duration) * 100 || 0;
            });
        });

        // auto-play next when finished
        audio.addEventListener("ended", function() {
            $scope.$apply(function() {
                if ($scope.isRepeat) {
                    // Repeat current track
                    audio.currentTime = 0;
                    audio.play();
                } else {
                    $scope.next();
                }
            });
        });

        // Set initial volume
        audio.volume = $scope.volume / 100;

        // Volume control
        $scope.setVolume = function() {
            audio.volume = $scope.volume / 100;
        };

        // Toggle shuffle
        $scope.toggleShuffle = function() {
            $scope.isShuffle = !$scope.isShuffle;
        };

        // Toggle repeat
        $scope.toggleRepeat = function() {
            $scope.isRepeat = !$scope.isRepeat;
        };

        // Play track by index
        $scope.playTrackByIndex = function(index) {
            if (index >= 0 && index < $scope.playlist.length) {
                $scope.currentIndex = index;
                $scope.playAudio($scope.playlist[index]);
            }
        };

        // Remove track from playlist
        $scope.removeFromPlaylist = function(index) {
            if (index >= 0 && index < $scope.playlist.length) {
                // If removing currently playing track
                if (index === $scope.currentIndex) {
                    $scope.next(); // Play next track
                } else if (index < $scope.currentIndex) {
                    $scope.currentIndex--; // Adjust current index
                }
                $scope.playlist.splice(index, 1);
                
                // If playlist is empty, stop playback
                if ($scope.playlist.length === 0) {
                    audio.pause();
                    $scope.isPlaying = false;
                    $scope.currentIndex = -1;
                }
            }
        };

        // Add to playlist queue (without auto-play)
        $scope.addToPlaylistQueue = function(image) {
            // Check if already in playlist
            var alreadyExists = $scope.playlist.some(function(track) {
                return track.path === image.path;
            });
            
            if (!alreadyExists) {
                $scope.playlist.push(image);
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
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
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
                    console.log('Favorite toggled:', image.path, isFavorite);
                }, function errorCallback(response) {
                    console.error('Error toggling favorite:', response);
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
                }).catch(err => console.log('Error sharing:', err));
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
                    console.log('EXIF data:', response.data);
                    // Display EXIF data (can be enhanced with a modal)
                    alert('EXIF data retrieved. Check console for details.');
                }, function errorCallback(response) {
                    console.error('Error fetching EXIF:', response);
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