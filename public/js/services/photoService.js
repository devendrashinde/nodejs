angular.module('PhotoService', [])

	// super simple service
	// each function returns a promise object 
	.factory('PhotoService', ['$http',function($http) {
		return {
			getTagsByAlbum : function(id) {
				return $http.get('/tags?id=' + id);
			},
			getTagsByTag : function(id) {
				return $http.get('/tags?tag=' + id);
			},
			getPhotosByTag : function(tag) {
				return $http.get('/photos?tag=' + tag);
			},
			getPhotos : function(id, page, items) {
				return $http.get('/photos?id=' + id + '&page=' + page + '&items=' + items)
					.then(function(response) {
            			return response.data; // { totalPhotos, data }
        			});
			},
			getAllTags : function() {
				return $http.get('/alltags')
					.then(function(response) {
            			return response.data; // { [{"tag": "1"},]}
        			});
			},
			// Album tagging methods
			getAlbumTags : function() {
				return $http.get('/albums/tags')
					.then(function(response) {
						return response.data;
					});
			},
			getAlbumsByTag : function(tag) {
				return $http.get('/albums/tags/search?tag=' + tag)
					.then(function(response) {
						return response.data;
					});
			},
			updateAlbumTag : function(albumId, tags) {
				return $http.put('/albums/' + albumId, { tags: tags })
					.then(function(response) {
						return response.data;
					});
			},
			getAlbum : function(albumId) {
				return $http.get('/albums/' + albumId)
					.then(function(response) {
						return response.data;
					});
			},
			getAlbumByName : function(albumName) {
				return $http.get('/albums/name/' + encodeURIComponent(albumName))
					.then(function(response) {
						return response.data;
					});
			},
			// Photo tagging
			create : function(photoData) {
				return $http.post('/', photoData);
			},
			delete : function(id) {
				return $http.delete('/api/photos/' + id);
			},
			upload : function(file, tags, album) {
				var fd = new FormData();
				fd.append('file', file);
				fd.append('tags', tags);
				fd.append('album', album);
				return $http.post('/upload', fd, {
					transformRequest: angular.identity,
					headers: {'Content-Type': undefined}
				});
			}	
		}
	}]);