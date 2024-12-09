'user strict';
import sql from './db.js';

//Photo object constructor
class Photo {
    constructor(photo) {
        this.id = photo.id;
        this.name = photo.name;
        this.tags = photo.tags;
    }
    static createPhoto(newPhoto, result) {
        var newTag = {};
        newTag.tag = newPhoto.tags;
        sql.query("INSERT INTO tags set ? ON DUPLICATE KEY UPDATE tag = ?; INSERT INTO photos set ? ON DUPLICATE KEY UPDATE tags = ?", [newTag, newPhoto.tags, newPhoto, newPhoto.tags], function (err, res) {

            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                console.log(res[1].insertId);
                result(null, res[1].insertId);
            }
        });
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
        sql.query("SELECT id, name, tags, album, CONCAT( path, '/', album, '/', name ) AS path FROM photos WHERE tags like ?", "%" + tag + "%", function (err, res) {
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
        sql.query("UPDATE photos SET tags = ? WHERE name = ? AND album = ?", [changedTag.tags, changedTag.name, changedTag.album], function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                result(null, res.affectedRows);
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
