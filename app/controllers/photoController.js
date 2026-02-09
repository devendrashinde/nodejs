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


export function getTags(req, res) {
  Photo.getTags(function(err, rows) {
    if (err) return res.status(500).send(err);

    const allTags = rows
      .map(row => row.tags)
      .filter(Boolean)
      .flatMap(tagStr =>
        tagStr
          .split(/[\s,]+/) // split by space or comma
          .map(tag => tag.trim().toLowerCase())
		  .filter(tag => tag.length > 0) // remove empty strings
      );

    const uniqueTags = [...new Set(allTags)].sort();

    res.json(uniqueTags.map(tag => ({ tag })));
  });
}

// Get album tags from both albums and photos with album names
export function getAlbumTags(req, res) {
  Album.getAlbums(function(err, albums) {
    if (err) return res.status(500).send(err);

    // Return full album objects (name, id, tags, path)
    // This allows the frontend to merge tags with folder objects
    const albumsWithTags = albums.map(album => ({
      id: album.id,
      name: album.name,
      tags: album.tags || '',
      path: album.path,
      description: album.description || ''
    }));

    res.json(albumsWithTags);
  });
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
  console.log('Updating album tags for:', req.params.albumId, 'Tags:', req.body.tags);
  
  if (!req.body.tags) {
    return res.status(400).send({ error: true, message: 'Please provide tags' });
  }

  Album.updateTag(req.params.albumId, req.body.tags, function(err, result) {
    if (err) {
      console.error("Error updating album tags:", err);
      return res.status(500).send(err);
    }
    
    if (result === 0) {
      return res.status(404).send({ error: true, message: 'Album not found' });
    }
    
    res.json({ message: 'Album tags updated successfully', affectedRows: result });
  });
}

export function createPhotoAlbum(req, res) {
  var new_album = new Album(req.body);

  if (!new_album.name || !new_album.name.trim()) {
    return res.status(400).send({ error: true, message: 'Album name is required' });
  }

  // Path can be optional, default to empty string
  if (!new_album.path) {
    new_album.path = '';
  }

  Album.createAlbum(new_album, function(err, albumId) {
    if (err) {
      console.error("Error creating album:", err);
      // Return meaningful error messages
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send({ error: true, message: 'Album name already exists' });
      }
      return res.status(500).send({ error: true, message: err.message || 'Failed to create album' });
    }
    
    if (!albumId) {
      return res.status(500).send({ error: true, message: 'Failed to get album ID from database' });
    }
    
    res.json({ id: albumId, message: 'Album created successfully', success: true });
  });
}

export function getPhotoAlbums(req, res) {
  Album.getAlbums(function(err, albums) {
    if (err) {
      console.error("Error fetching albums:", err);
      return res.status(500).send(err);
    }
    
    res.json(albums);
  });
}

export function getPhotoAlbum(req, res) {
  Album.getAlbumById(req.params.albumId, function(err, album) {
    if (err) {
      console.error("Error fetching album:", err);
      return res.status(500).send(err);
    }
    
    if (!album || album.length === 0) {
      return res.status(404).send({ error: true, message: 'Album not found' });
    }
    
    res.json(album[0]);
  });
}

// Get albums by tag
export function getAlbumsByTag(req, res) {
  const tag = req.query.tag;
  
  if (!tag) {
    return res.status(400).send({ error: true, message: 'Please provide a tag query parameter' });
  }

  Album.getAlbumsByTag(tag, function(err, albums) {
    if (err) {
      console.error("Error fetching albums by tag:", err);
      return res.status(500).send(err);
    }
    
    res.json(albums);
  });
}

export function removeAlbum(req, res) {
  Album.remove(req.params.albumId, function(err, result) {
    if (err) {
      console.error("Error removing album:", err);
      return res.status(500).send(err);
    }
    res.json({ message: 'Album successfully deleted' });
  });
}