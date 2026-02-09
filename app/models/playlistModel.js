'use strict';
import pool, { query } from './db.js';

// Playlist object constructor
class Playlist {
    constructor(playlist) {
        this.id = playlist.id;
        this.name = playlist.name;
        this.tags = playlist.tags;
        this.description = playlist.description;
        this.item_count = playlist.item_count || 0;
    }

    // Create playlist
    static async createPlaylist(newPlaylist, result) {
        try {
            const res = await query(
                "INSERT INTO playlists (name, tags, description, item_count) VALUES (?, ?, ?, ?)",
                [newPlaylist.name, newPlaylist.tags || '', newPlaylist.description || '', 0]
            );
            console.log(`Created playlist with ID: ${res.insertId}`);
            result(null, res.insertId);
        } catch (err) {
            console.error("Error creating playlist:", err);
            result(err, null);
        }
    }

    // Get all playlists
    static async getPlaylists(result) {
        try {
            const res = await query(
                "SELECT id, name, tags, description, item_count, created_at, updated_at FROM playlists ORDER BY name"
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching playlists:", err);
            result(err, null);
        }
    }

    // Get playlist by ID
    static async getPlaylistById(id, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, description, item_count, created_at, updated_at FROM playlists WHERE id = ?",
                [id]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching playlist by ID:", err);
            result(err, null);
        }
    }

    // Get playlist by name
    static async getPlaylistByName(playlistName, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, description, item_count, created_at, updated_at FROM playlists WHERE name = ?",
                [playlistName]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching playlist by name:", err);
            result(err, null);
        }
    }

    // Get playlists by tag
    static async getPlaylistsByTag(tag, result) {
        try {
            const res = await query(
                "SELECT id, name, tags, description, item_count FROM playlists WHERE tags LIKE ? ORDER BY name",
                [`%${tag.trim()}%`]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching playlists by tag:", err);
            result(err, null);
        }
    }

    // Update playlist tags
    static async updateTag(id, tags, result) {
        try {
            const res = await query(
                "UPDATE playlists SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [tags.trim(), id]
            );
            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error updating playlist tags:", err);
            result(err, null);
        }
    }

    // Update playlist metadata
    static async updatePlaylist(id, playlist, result) {
        try {
            const res = await query(
                "UPDATE playlists SET name = ?, tags = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [playlist.name, playlist.tags || '', playlist.description || '', id]
            );
            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error updating playlist:", err);
            result(err, null);
        }
    }

    // Add items to playlist
    static async addItems(playlistId, photoIds, result) {
        try {
            // Get current max position
            const maxRes = await query(
                "SELECT MAX(position) as maxPos FROM playlist_items WHERE playlist_id = ?",
                [playlistId]
            );
            let position = (maxRes[0]?.maxPos || -1) + 1;

            // Insert items
            const values = photoIds.map(photoId => [playlistId, photoId, position++]);
            const res = await query(
                "INSERT INTO playlist_items (playlist_id, photo_id, position) VALUES ?",
                [values]
            );

            // Update item count
            await query(
                "UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [playlistId, playlistId]
            );

            console.log(`Added ${res.affectedRows} items to playlist ${playlistId}`);
            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error adding items to playlist:", err);
            result(err, null);
        }
    }

    // Get playlist items
    static async getPlaylistItems(playlistId, result) {
        try {
            const res = await query(
                `SELECT pi.id as item_id, 
                        p.id, 
                        p.name, 
                        p.tags, 
                        p.album,
                        CONCAT(p.path, '/', p.album, '/', p.name) AS path,
                        pi.position 
                 FROM playlist_items pi 
                 JOIN photos p ON pi.photo_id = p.id 
                 WHERE pi.playlist_id = ? 
                 ORDER BY pi.position ASC`,
                [playlistId]
            );
            result(null, res);
        } catch (err) {
            console.error("Error fetching playlist items:", err);
            result(err, null);
        }
    }

    // Remove item from playlist
    static async removeItem(playlistId, itemId, result) {
        try {
            const res = await query(
                "DELETE FROM playlist_items WHERE id = ? AND playlist_id = ?",
                [itemId, playlistId]
            );

            // Update item count
            if (res.affectedRows > 0) {
                await query(
                    "UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    [playlistId, playlistId]
                );
            }

            result(null, res.affectedRows);
        } catch (err) {
            console.error("Error removing playlist item:", err);
            result(err, null);
        }
    }

    // Remove playlist
    static async remove(id, result) {
        try {
            const res = await query("DELETE FROM playlists WHERE id = ?", [id]);
            result(null, res);
        } catch (err) {
            console.error("Error removing playlist:", err);
            result(err, null);
        }
    }
}

export default Playlist;
