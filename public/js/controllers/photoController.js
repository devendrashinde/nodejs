
angular.module('photoController', [])

    // inject the Photo service factory into our controller
    .controller('photoController', ['$scope','$http', '$location','PhotoService','ModalService', function($scope, $http, $location, PhotoService, ModalService) {
        $scope.formData = {};
        $scope.tags = [];
        $scope.photos = []; // all photos
        $scope.filteredPhotos = [];// search-filtered photos
        $scope.albums = [];
		$scope.folders = [];
        $scope.loading = true;
		$scope.noMorePhotos = false;
        $scope.showSearch = false;
        $scope.searchTag = ""; // user input for search
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
        
        // GET =====================================================================
        // when landing on the page, get all photos and tags and show them
        // use the service to get all the photo tags
        loadPhotos();

        $scope.uploadFile = function(file, tags, album){
            $scope.loading = true;
            PhotoService.upload(file, tags, album)
                    .then(function successCallback(response) {
                            $scope.loadAlbum();
                            $scope.loading = false;
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                    });
        };

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
        };
        
        function addToTagList(tag) {
			for(tags of $scope.tags){
				if(tags.tags == tag) {
					return;
				}
			}            
            $scope.tags.unshift({ tags: tag });
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
            loadPhotosAndTags(album.path);
        }
		
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
					if($scope.selectedAlbum.path != photo.path){
						$scope.folders.push(photo);
					}
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
                    $scope.photos.push(getImageType(photo));
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

        $scope.editImageTag= function (photo) {

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
        
        $scope.selectUploadFile= function (photo) {

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
}]);