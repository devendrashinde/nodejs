angular.module('photoController', [])

	// inject the Photo service factory into our controller
	.controller('photoController', ['$scope','$http','$location','PhotoService','ModalService', function($scope, $http, $location, PhotoService, ModalService) {
		$scope.formData = {};
		$scope.tags = {};
		$scope.photos = {};
		$scope.loading = true;
		$scope.searchTag = "";
		$scope.uploadDetails = {};
		
		// GET =====================================================================
		// when landing on the page, get all photos and tags and show them
		// use the service to get all the photo tags
		loadPhotosAndTags();

		$scope.uploadFile = function(file, tags){
           PhotoService.upload(file, tags);
        };

		$scope.search = function() {
			if($scope.searchTag && $scope.searchTag.length){
				$scope.loading = true;
				$location.search('q', $scope.searchTag);
				PhotoService.getTagsByTag($scope.searchTag)
					// if successful creation, call our get function to get all the new photos
					.then(function successCallback(response) {
							$scope.loading = false;
							$scope.photos = response.data; // assign our new list of photos
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
		// CREATE ==================================================================
		// when submitting the add form, send the text to the node API
		$scope.createPhoto = function() {

			// validate the formData to make sure that something is there
			// if form is empty, nothing will happen
			if ($scope.formData.text != undefined) {
				$scope.loading = true;

				// call the create function from our service (returns a promise object)
				PhotoService.create($scope.formData)
				// if successful creation, call our get function to get all the new photos
				.then(function successCallback(response) {
						$scope.loading = false;
						$scope.formData = {}; // clear the form so our user is ready to enter another
						$scope.photos = response.data; // assign our new list of photos
				}, function errorCallback(response) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
				});			
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
						$scope.photos = response.data; // assign our new list of photos
						updatePhotoTagsFromDb();
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
		$scope.updateTag = function(id, tag) {
			for (photo of $scope.photos) {
				if(photo.id == id){
					photo.tags = tag;
					return;
				}
			}
		};
		
		// DELETE ==================================================================
		// delete a photo after checking it
		$scope.deletePhoto = function(id) {
			$scope.loading = true;

			PhotoService.delete(id)
				// if successful creation, call our get function to get all the new photos
				.then(function successCallback(response) {
						$scope.loading = false;
						$scope.photos = response.data; // assign our new list of photos
				}, function errorCallback(response) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
				});			
		};
		
		// load photos and respective tags
		function loadPhotosAndTags() {
			var id = getUrlParameter("id");
								
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

		function updatePhotoTagsFromDb(){
			for (photo of $scope.photos) {
				var album = getNameAndAlbum(photo.path);
				for (tag of $scope.tags) {
					if(tag.name == album.name && tag.album == album.album){
						photo.tags = (tag.tags.length ? tag.tags : photo.name);
						break;
					}
				}				
			}
			$scope.tags = {};
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
		  html += '<form action="/" method="post" id="form' + photo.id + '">';
		  html += '<h3> Update photo description</h3>';		  
		  html += '<p><input type="hidden" name="name" value="' + photo.path + '"/>';
		  html += '<textarea name="tags" rows=4 column=80>' +  photo.tags + '</textarea></p>';
		  html += '<p><input type="button" value="Update" onClick="submitFancyBoxForm(form' + photo.id + ',tag' + photo.id + ',' +  "'" + photo.id + "'"+ ');"/>';
		  html += '<input type="button" value="Cancel" onClick="closeFancyBoxForm();"/></p>';
		  html += '</form></div>';
		  $.fancybox.open(html);
		};
		
		$scope.selectUploadFile= function (photo) {

		  var html = '<div class="message">';
		  html += '<form action="/upload" method="post" id="uploadForm" encType="multipart/form-data">';
		  html += '<p><h3> Upload File</h3>';
		  html += '<input type="file" name="myFile" id="uploadFile" onClick="this.value = null" onChange="displayUploadedFile(this);"/></p>';
		  html += '<img class="img-fluid" id="selectedFile" src=""/>';		  
		  html += '<p><h3> Enter file description</h3>';
		  html += '<textarea name="tags" rows=4 column=80></textarea></p>';
		  html += '<p><input type="button" value="Upload" onClick="submitUploadForm(uploadForm);"/>';
		  html += '<input type="button" value="Cancel" onClick="closeFancyBoxForm();"/></p>';
		  html += '</form></div>';
		  $.fancybox.open(html);
		};
		
	}]);