'use strict';
import pool, { query } from './db.js';

// Album object constructor
class Album {
    constructor(album) {
        this.id = album.id;
        this.name = album.name;
        this.tags = album.tags;
        this.path = album.path;
        this.description = album.description;
    }

    // Create album (async version)
    static async createAlbum(newAlbum, result) {
        try {
            const res = await query(
                "INSERT INTO albums (name, tags, path, description) VALUES (?, ?, ?, ?)",
                [newAlbum.name, newAlbum.tags || '', newAlbum.path, newAlbum.description || '']
            );
            console.log(`Created album with ID: ${res.insertId}`);
            result(null, res.insertId);
        } catch (err) {
            console.error("Error creating album:", err);
            result(err, null);
        }
    }

    // Get all albums
    static async getAlbums(result) {
        try {
            const res = await query(
                "SELECT id, name, tags, path, description, created_at, updated_at FROM albums"
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching albums:", err);
            result(err, null);
        }
    }

    // Get album by ID
    static async getAlbumById(id, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, path, description, created_at, updated_at FROM albums WHERE id = ?",
                [id]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching album by ID:", err);
            result(err, null);
        }
    }

    // Get album by name
    static async getAlbumByName(albumName, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, path, description, created_at, updated_at FROM albums WHERE name = ?",
                [albumName]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching album by name:", err);
            result(err, null);
        }
    }

    // Get albums by tag
    static async getAlbumsByTag(tag, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, path, description FROM albums WHERE tags LIKE ?",
                [`%${tag.trim()}%`]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching albums by tag:", err);
            result(err, null);
        }
    }

    // Update album tags
    static async updateTag(id, tags, result) {
        try {
            const res = await query(
                "UPDATE albums SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [tags.trim(), id]
            );
            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error updating album tags:", err);
            result(err, null);
        }
    }

    // Remove album
    static async remove(id, result) {
        try {
            const res = await query("DELETE FROM albums WHERE id = ?", [id]);
            result(null, res);
        } catch (err) {
            console.error("Error removing album:", err);
            result(err, null);
        }
    }
}

export default Album;