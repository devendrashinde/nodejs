'use strict';
module.exports = function(app) {
  var todoList = require('../controllers/taskController');
  var photos = require('../controllers/photoController');

  // todoList Routes
  app.route('/tasks')
    .get(todoList.list_all_tasks)
    .post(todoList.create_a_task);
   
  app.route('/tasks/:taskId')
    .get(todoList.read_a_task)
    .put(todoList.update_a_task)
    .delete(todoList.delete_a_task);

  // photo-album Routes
  app.route('/photos')
	.post(photos.createPhoto)
	.patch(photos.updatePhotoTag);
   
  app.route('/photos?:id?:name?:tag')
    .get(photos.getPhoto)
    .delete(photos.removePhoto);

  app.route('/albums')
    .get(photos.getAlbums)
	.post(photos.createAlbum);

  app.route('/albums/:albumId')
    .get(photos.getAlbum)
    .put(photos.updateAlbumTag)
    .delete(photos.removeAlbum);
};