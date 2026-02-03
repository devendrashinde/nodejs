
angular.module('photoController', [])

    // inject the Photo service factory into our controller
    .controller('photoController', ['$scope','$http', '$location','PhotoService','ModalService', function($scope, $http, $location, PhotoService, ModalService) {

        $scope.formData = {};
        $scope.tags = [];
        $scope.allTags = [];
        $scope.filteredTags = []
        $scope.tagsLoaded = false;
        $scope.photos = []; // current album photos
        $scope.allPhotosByAlbum = {}; // Map of album -> photos for counting
        $scope.selectedPhoto = {};
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
        // file upload
        $scope.uploadFile = null;
        $scope.filePreviewUrl = '';
        $scope.uploadTags = '';
        $scope.uploadAlbum = $scope.selectedAlbum ? $scope.selectedAlbum.path : '';
        $scope.favoritesCount = 0; // Count of favorited media
        $scope.allFavorites = []; // Store all favorites
        
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
            if (!album.album || album.album === '') {
                // "All Albums" selected - show all photos
                loadPhotosAndTags("");
            } else {
                loadPhotosAndTags(album.path);
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


        $('#searchModal').on('shown.bs.modal', function () {
            const scope = angular.element(this).scope();
            scope.$apply(function () {
                scope.loadAllTags();
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
            if($scope.playlist.length > 0) {
                $scope.currentIndex = 0;
            }
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
            var modalEl = document.getElementById('editTagModal');
            var modal = new bootstrap.Modal(modalEl);
            modal.show();
        };

        $scope.updatePhotoTag = function(id, name, tags){
            $scope.loading = true;
            var photoTag = {};
            if(parseInt(id) > 0){
                photoTag = {"id": id, "name": name, "tags": tags};
            } else {
                photoTag = {"name": name, "tags": tags};
            }
            PhotoService.create(photoTag)
                    .then(function successCallback(response) {
                            $scope.updateTag(id, tags, response);
                            $scope.loading = false;
                            $('#editTagModal').modal('hide');
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        alert('Update tag failed!');
                    });
        };
      
        $scope.$watch('uploadFile', function(newFile) {
            if (newFile) $scope.previewFile();
        });

        $scope.submitEditTagForm = function() {
            $scope.updatePhotoTag($scope.selectedPhoto.id, $scope.selectedPhoto.path, $scope.selectedPhoto.tags);
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
            $scope.currentIndex = ($scope.currentIndex + 1) % $scope.playlist.length;
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
            $scope.next();
            });
        });

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

}]);