'use strict';
import pool, { query } from './db.js';

// Photo object constructor
class Photo {
    constructor(photo) {
        this.id = photo.id;
        this.name = photo.name;
        this.tags = photo.tags;
    }

    // Create or update photo (async version)
    static async createPhoto(newPhoto, result) {
        try {
            if (newPhoto.id != null) {
                console.log(`Updating photo ID: ${newPhoto.id}`);
                await Photo.updateTagById(newPhoto.id, newPhoto.tags.trim());
                result(null, newPhoto.id);
            } else {
                const res = await query("INSERT INTO photos SET ?", newPhoto);
                console.log(`Created photo with ID: ${res.insertId}`);
                result(null, res.insertId);
            }
        } catch (err) {
            console.error("Error creating/updating photo:", err);
            result(err, null);
        }
    }

    static async getPhotoById(id, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, album, path FROM photos WHERE id = ?", 
                [id]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching photo by ID:", err);
            result(err, null);
        }
    }

    static async getPhotoByName(name, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, album, path FROM photos WHERE name = ?", 
                [name]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching photo by name:", err);
            result(err, null);
        }
    }

    static async getPhotosByTag(tag, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, album, CONCAT(path, '/', album, '/', name) AS path FROM photos WHERE tags LIKE ?", 
                [`%${tag.trim()}%`]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching photos by tag:", err);
            result(err, null);
        }
    }

    static async getPhotosByAlbum(album, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, album, path FROM photos WHERE album = ?", 
                [album]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching photos by album:", err);
            result(err, null);
        }
    }

    static async getTags(result) {
        try {
            const res = await query("SELECT DISTINCT tags FROM photos WHERE tags IS NOT NULL AND tags != ''");
            result(null, res);
        } catch (err) {
            console.error("Error fetching tags:", err);
            result(err, null);
        }
    }

    static async updateTag(changedTag, result) {
        try {
            const res = await query(
                "UPDATE photos SET tags = ? WHERE name = ? AND album = ?", 
                [changedTag.tags.trim(), changedTag.name, changedTag.album]
            );
            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error updating tag:", err);
            result(err, null);
        }
    }
    
    static async updateTagById(id, changedTag) {
        try {
            await query(
                "UPDATE photos SET tags = ? WHERE id = ?", 
                [changedTag.trim(), id]
            );
            console.log(`✓ Updated tag for photo ID: ${id}`);
        } catch (err) {
            console.error(`Failed to update tag for photo ID ${id}:`, err);
            throw err;
        }
    }

    static async remove(id, result) {
        try {
            const res = await query("DELETE FROM photos WHERE id = ?", [id]);
            result(null, res);
        } catch (err) {
            console.error("Error deleting photo:", err);
            result(err, null);
        }
    }
}

export default Photo;
