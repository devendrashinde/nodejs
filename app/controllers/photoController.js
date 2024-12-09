'use strict';

import Photo from '../models/photoModel.js';
import Album from '../models/albumModel.js';

export function createPhoto(req, res) {
  console.log(req.body);
  var new_photo = new Photo(req.body);
  //handles null error 
   if(!new_photo.name){

        res.status(400).send({ error:true, message: 'Please provide name' });

    }
	else{
		Photo.createPhoto(getNameAndAlbum(new_photo), function(err, photoId) {
			if (err)
				res.send(err);
			res.json(photoId);
		});
	}
}

function getNameAndAlbum(photo){
	var s = photo.name.split("/");
	var path = "";
	for(var i = 0; i < s.length-2; i++){
		path = path + (i == 0 ? "" : "/") + s[i];
	}	
	photo.path = path;	
	photo.album = s[s.length-2];
	photo.name = s[s.length-1];	
	console.log(photo);
	return photo;
}

export function getPhoto(req, res) {
	console.log(req.query);
	if(req.query.id){
	  Photo.getPhotoById(req.query.id, function(err, photo) {
		if (err)
		  res.send(err);
		res.json(photo);
		});
	} else if(req.query.name){
	  Photo.getPhotoByName(req.query.name, function(err, photo) {
		if (err)
		  res.send(err);
		res.json(photo);
		});
	} else if(req.query.tag){
	  Photo.getPhotosByTag(req.query.tag, function(err, photo) {
		if (err)
		  res.send(err);
		res.json(photo);
		});
	} else{
		res.status(400).end('Bad Request');
	}
}

function getAlbumName(album){
	album = !album || !album.length ? "data":album;
	var s = album.split("/");
	return s[s.length-1];	
}

export function getPhotos(req, res) {
	if(req.query.tag){
	  Photo.getPhotosByTag(req.query.tag, function(err, photo) {
		if (err)
		  res.send(err);
		res.json(photo);
		});
	} else{
	  Photo.getPhotosByAlbum(getAlbumName(req.query.id), function(err, photo) {
		if (err)
		  res.send(err);
		console.log(photo);
		res.json(photo);
		});
	}	
}

export function updatePhotoTag(req, res) {
  var changedTag = new Photo(req.body);
  //handles null error 
   if(!changedTag.name || !changedTag.tags){

        res.status(400).send({ error:true, message: 'Please provide name and tags' });

    }
	else{
  
	  Photo.updateTag(req.body, function(err, result) {
		if (err)
		  res.send(err);
		res.json(result);
	  });
	}
}

export function removePhoto(req, res) {

  Photo.remove( req.query.id, function(err, photo) {
    if (err)
      res.send(err);
    res.json({ message: 'Photo successfully deleted' });
  });
}

export function updateAlbumTag(req, res) {
	Album.updateTag(req.params.albumId, req.body, function(err, result) {
    if (err)
      res.send(err);
    res.json(result);
  });
}

export function createPhotoAlbum(req, res) {
  var new_album = new Album(req.body);

  //handles null error 
   if(!new_album.name){

        res.status(400).send({ error:true, message: 'Please provide name' });
    }
	else{
  
		Album.createAlbum(new_album, function(err, albumId) {
    
			if (err)
				res.send(err);
			res.json(albumId);
		});
	}
}

export function getPhotoAlbums(req, res) {
	Album.getAlbums(function(err, albums) {

    console.log('controller')
    if (err)
      res.send(err);
    console.log('res', albums);
    res.send(albums);
  });
}

export function getPhotoAlbum(req, res) {
	Album.getAlbum(req.params.albumId, function(err, album) {
    if (err)
      res.send(err);
    res.json(album);
  });
}

export function removeAlbum(req, res) {

	Album.remove( req.params.albumId, function(err, photo) {
    if (err)
      res.send(err);
    res.json({ message: 'Photo successfully deleted' });
  });
}