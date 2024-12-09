'user strict';
import sql from './db.js';

//Album object constructor
class Album {
    constructor(album) {
        this.name = album.name;
        this.tags = album.tags;
    }
    static createAlbum(newAlbum, result) {
        sql.query("INSERT INTO PHOTOS set ?", newAlbum, function (err, res) {

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
    static getAlbum(album, result) {
        sql.query("SELECT name, tags FROM PHOTOS where id = ?", album, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getAlbumByName(albumName, result) {
        sql.query("SELECT id, tags FROM PHOTOS where name = ?", albumName, function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static getAlbums(result) {
        sql.query("SELECT name, tags FROM PHOTOS", function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(err, null);
            }
            else {
                result(null, res);

            }
        });
    }
    static updateTag(name, tags, result) {
        sql.query("UPDATE PHOTOS SET tags = ? WHERE name = ?", [tags, name], function (err, res) {
            if (err) {
                console.log("error: ", err);
                result(null, err);
            }
            else {
                result(null, res);
            }
        });
    }
    static remove(name, result) {
        sql.query("DELETE FROM PHOTOS WHERE name = ?", [name], function (err, res) {

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

export default Album;