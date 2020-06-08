'user strict';
var sql = require('./db');

//Photo object constructor
var Photo = function(photo){
    this.name = photo.name;
    this.tags = photo.tags;
};

Photo.createPhoto = function (newPhoto, result) {    
        sql.query("INSERT INTO PHOTOS set ? ON DUPLICATE KEY UPDATE tags = ?", [newPhoto, newPhoto.tags], function (err, res) {
                				
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    console.log(res.insertId);
                    result(null, res.insertId);
                }
            });           
};

Photo.getPhotoById = function (id, result) {
        sql.query("SELECT id, name, tags, album, path FROM PHOTOS WHERE id = ?", id, function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Photo.getPhotoByName = function (name, result) {
        sql.query("SELECT id, name, tags, album, path FROM PHOTOS WHERE name = ?", name, function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Photo.getPhotosByTag = function (tag, result) {
        sql.query("SELECT id, name, tags, album, CONCAT( path, '/', album, '/', name ) AS path FROM PHOTOS WHERE tags like ?", "%" + tag + "%", function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });
};

Photo.getPhotosByAlbum = function (album, result) {
        sql.query("SELECT id, name, tags, album, path FROM PHOTOS WHERE album = ?", album, function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Photo.updateTag = function(changedTag, result){
  sql.query("UPDATE PHOTOS SET tags = ? WHERE name = ? AND album = ?", [changedTag.tags, changedTag.name, changedTag.album], function (err, res) {
          if(err) {
              console.log("error: ", err);
              result(null, err);
           }
           else{   
             result(null, res.affectedRows);
           }
        }); 
};
Photo.remove = function(id, result){
     sql.query("DELETE FROM PHOTOS WHERE id = ?", id, function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(null, err);
                }
                else{
               
                 result(null, res);
                }
            }); 
};

module.exports= Photo;
