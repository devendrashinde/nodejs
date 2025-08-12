'use strict';
export default function(app) {
  var photos = require('../controllers/photoController');

  // photo-album Routes
  app.route('/photos')
	.post(photos.createPhoto)
	.patch(photos.updatePhotoTag);
   
  app.route('/photos?:id?:name?:tag')
    .get(photos.getPhoto)
    .delete(photos.removePhoto);

  app.route('/albums')
    .get(photos.getPhotoAlbums)
	.post(photos.createPhotoAlbum);

  app.route('/albums/:albumId')
    .get(photos.getPhotoAlbum)
    .put(photos.updateAlbumTag)
    .delete(photos.removeAlbum);
};