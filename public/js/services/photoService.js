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