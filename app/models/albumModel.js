'user strict';
var sql = require('./db');

//Album object constructor
var Album = function(album){
    this.name = album.name;
    this.tags = album.tags;
};

Album.createAlbum = function (newAlbum, result) {		
        sql.query("INSERT INTO PHOTOS set ?", newAlbum, function (err, res) {
                
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

Album.getAlbum = function (album, result) {
        sql.query("SELECT name, tags FROM PHOTOS where id = ?", album, function (err, res) {             
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Album.getAlbumByName = function (albumName, result) {
        sql.query("SELECT id, tags FROM PHOTOS where name = ?", albumName, function (err, res) {             
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Album.getAlbums = function (result) {
        sql.query("SELECT name, tags FROM PHOTOS", function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
              
                }
            });   
};

Album.updateTag = function(name, tags, result){
  sql.query("UPDATE PHOTOS SET tags = ? WHERE name = ?", [tags, name], function (err, res) {
          if(err) {
              console.log("error: ", err);
                result(null, err);
             }
           else{   
             result(null, res);
                }
            }); 
};
Album.remove = function(name, result){
     sql.query("DELETE FROM PHOTOS WHERE name = ?", [name], function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(null, err);
                }
                else{
               
                 result(null, res);
                }
            }); 
};

module.exports= Album;