'use strict';
import sql from './db.js';

//Photo object constructor
class Photo {
    constructor(photo) {
        this.id = photo.id;
        this.name = photo.name;
        this.tags = photo.tags;
    }
    static createPhoto(newPhoto, result) {
        if(newPhoto.id != null) {
            console.log(newPhoto.id);
            Photo.updateTagById(newPhoto.id, newPhoto.tags.trim(), result);
            result(null, newPhoto.id);

        } else {
            sql.query("INSERT INTO photos set ?", newPhoto, function (err, res) {

                if (err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else {
                    console.log(res.insertId);
                    result(null, res.insertId);
                }
            });
        }
    }

    static getPhotoById(id, result) {
        sql.query("SELECT id, name, tags, album, path FROM photos WHERE id = ?", id, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getPhotoByName(name, result) {
        sql.query("SELECT id, name, tags, album, path FROM photos WHERE name = ?", name, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getPhotosByTag(tag, result) {
        sql.query("SELECT id, name, tags, album, CONCAT( path, '/', album, '/', name ) AS path FROM photos WHERE tags like ?", "%" + tag.trim() + "%", function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getPhotosByAlbum(album, result) {
        sql.query("SELECT id, name, tags, album, path FROM photos WHERE album = ?", album, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static updateTag(changedTag, result) {
        sql.query("UPDATE photos SET tags = ? WHERE name = ? AND album = ?", [changedTag.tags.trim(), changedTag.name, changedTag.album], function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                result(null, res.affectedRows);
            }
        });
    }
    
    static updateTagById(id, changedTag) {
        sql.query("UPDATE photos SET tags = ? WHERE id = ?", [changedTag.trim(), id], function (err, res) {
            if (err) {
                console.log("failed to update tag, error: ", err);                
            }
        });
    }

    static remove(id, result) {
        sql.query("DELETE FROM photos WHERE id = ?", id, function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {

                result(null, res);
            }
        });
    }
}

export default Photo;
