angular.module('photoController', [])

	// inject the Photo service factory into our controller
	.controller('photoController', ['$scope','$http','$location','PhotoService','ModalService', function($scope, $http, $location, PhotoService, ModalService) {
		$scope.formData = {};
		$scope.tags = [];
		$scope.photos = [];
		$scope.albums = [];
		$scope.loading = true;
		$scope.searchTag = "";
		$scope.selectedAlbum = {path:'Home',name:'Home'};
		$scope.uploadDetails = {};
		imageTypes = ['jpg', 'png', 'jpeg'];
		videoTypes = ['mp4', 'avi', 'mov', '3gp', 'mkv', 'mpg'];
		
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
			if($scope.searchTag && $scope.searchTag.length){
				$scope.loading = true;
				$location.search('q', $scope.searchTag);
				PhotoService.getTagsByTag($scope.searchTag)
					// if successful creation, call our get function to get all the new photos
					.then(function successCallback(response) {							
							$scope.photos = response.data; // assign our new list of photos
							$scope.loading = false;
					}, function errorCallback(response) {
						// called asynchronously if an error occurs
						// or server returns response with an error status.
					});
			}
		};
		
		$scope.clearSearch = function() {
			if($scope.searchTag && $scope.searchTag.length){
				$scope.searchTag = "";
			}
		};

		// GET  ==================================================================
		// get photos
		$scope.getPhotos = function(id) {
			$scope.loading = true;

			PhotoService.getPhotos(id)
				// if successful creation, call our get function to get all the new photos
				.then(function successCallback(response) {
						$scope.loading = false;						
						updatePhotoTagsFromDb(response.data);
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
		
		function getNameAndAlbum(name){
			var prop = {};
			var s = name.split("/");
			prop.album = s[s.length-2];
			prop.name = s[s.length-1];
			return prop;
		}		
		
		// update tag
		$scope.updateTag = function(id, tag, newId) {
			for (photo of $scope.photos) {
				if(photo.id == id){
					photo.tags = tag;
					photo.id = newId;
					return;
				}
			}
		};
		
		function loadPhotos() {
			var id = getUrlParameter("id");
			loadPhotosAndTags(id);
		}
		
		$scope.loadAlbum = function () {
			loadPhotosAndTags($scope.selectedAlbum.path == "Home"? "" : $scope.selectedAlbum.path);
		}
		
		// load photos and respective tags
		function loadPhotosAndTags(id) {				
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
			$scope.photos = [];
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
					for (x of $scope.albums) {
						if(x.path == photo.path && x.name == photo.name) {
							found = true;
							break;
						}							
					}
					if(!found){
						$scope.albums.push(photo);
					}
				} else {
					$scope.photos.push(getImageType(photo));
				}
			}
			$scope.tags = {};
		}		
		
		function getImageType(photo){
			ext = photo.name.substr(photo.name.lastIndexOf(".")+1).toLowerCase();
			if(imageTypes.indexOf(ext) != -1) {
				photo.isPhoto = true;
			} else if(videoTypes.indexOf(ext) != -1) {
				photo.isVideo = true;
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

        $scope.closeModal = function(id){
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
		  html += '<textarea style="width: 100%; max-width: 100%;" name="tags" rows=4 column=80>' +  photo.tags + '</textarea></p>';
		  html += '<p><input type="button" value="Update" onClick="submitUpdareTagForm(form' + photo.id + ',tag' + photo.id + ',' +  "'" + photo.id + "'"+ ');"/>';
		  html += '<input type="button" value="Cancel" onClick="closeFancyBoxForm();"/></p>';
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
		
	}]);