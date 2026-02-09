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

  // Photo tags endpoint
  app.route('/tags')
    .get(photos.getTags);

  // Album routes - MORE SPECIFIC ROUTES MUST COME FIRST!
  // Album tags endpoints (specific routes before parameterized routes)
  app.route('/albums/tags')
    .get(photos.getAlbumTags);

  app.route('/albums/tags/search')
    .get(photos.getAlbumsByTag);

  // General album routes (parameterized routes come last)
  app.route('/albums')
    .get(photos.getPhotoAlbums)
	.post(photos.createPhotoAlbum);

  app.route('/albums/:albumId')
    .get(photos.getPhotoAlbum)
    .put(photos.updateAlbumTag)
    .delete(photos.removeAlbum);
};