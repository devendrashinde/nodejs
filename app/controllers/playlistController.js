'use strict';

import Playlist from '../models/playlistModel.js';
import { query } from '../models/db.js';

// Create new playlist
export function createPlaylist(req, res) {
  var new_playlist = new Playlist(req.body);

  if (!new_playlist.name || !new_playlist.name.trim()) {
    return res.status(400).send({ error: true, message: 'Playlist name is required' });
  }

  Playlist.createPlaylist(new_playlist, function(err, playlistId) {
    if (err) {
      console.error("Error creating playlist:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send({ error: true, message: 'Playlist name already exists' });
      }
      return res.status(500).send({ error: true, message: err.message || 'Failed to create playlist' });
    }
    
    if (!playlistId) {
      return res.status(500).send({ error: true, message: 'Failed to get playlist ID from database' });
    }
    
    res.json({ id: playlistId, message: 'Playlist created successfully', success: true });
  });
}

// Get all playlists
export function getPlaylists(req, res) {
  Playlist.getPlaylists(function(err, playlists) {
    if (err) {
      console.error("Error fetching playlists:", err);
      return res.status(500).send(err);
    }
    
    res.json(playlists);
  });
}

// Get playlist by ID
export function getPlaylist(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  Playlist.getPlaylistById(req.params.playlistId, function(err, playlist) {
    if (err) {
      console.error("Error fetching playlist:", err);
      return res.status(500).send(err);
    }
    
    if (!playlist || playlist.length === 0) {
      return res.status(404).send({ error: true, message: 'Playlist not found' });
    }
    
    res.json(playlist[0]);
  });
}

// Get playlists by tag
export function getPlaylistsByTag(req, res) {
  const tag = req.query.tag;
  
  if (!tag) {
    return res.status(400).send({ error: true, message: 'Please provide a tag query parameter' });
  }

  Playlist.getPlaylistsByTag(tag, function(err, playlists) {
    if (err) {
      console.error("Error fetching playlists by tag:", err);
      return res.status(500).send(err);
    }
    
    res.json(playlists);
  });
}

// Update playlist metadata
export function updatePlaylist(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).send({ error: true, message: 'Playlist name is required' });
  }

  Playlist.updatePlaylist(req.params.playlistId, req.body, function(err, result) {
    if (err) {
      console.error("Error updating playlist:", err);
      return res.status(500).send(err);
    }
    
    if (result === 0) {
      return res.status(404).send({ error: true, message: 'Playlist not found' });
    }
    
    res.json({ message: 'Playlist updated successfully', affectedRows: result });
  });
}

// Update playlist tags
export function updatePlaylistTag(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  if (!req.body.tags && req.body.tags !== '') {
    return res.status(400).send({ error: true, message: 'Please provide tags' });
  }

  Playlist.updateTag(req.params.playlistId, req.body.tags, function(err, result) {
    if (err) {
      console.error("Error updating playlist tags:", err);
      return res.status(500).send(err);
    }
    
    if (result === 0) {
      return res.status(404).send({ error: true, message: 'Playlist not found' });
    }
    
    res.json({ message: 'Playlist tags updated successfully', affectedRows: result });
  });
}

// Add items to playlist
export function addPlaylistItems(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  if (!req.body.photoIds || !Array.isArray(req.body.photoIds) || req.body.photoIds.length === 0) {
    return res.status(400).send({ error: true, message: 'Please provide an array of photo IDs' });
  }

  const photoIds = req.body.photoIds;
  
  // Check if we received paths instead of IDs (for bulk operations compatibility)
  const isFilePath = (val) => typeof val === 'string' && (val.includes('/') || val.includes('\\'));
  const hasFilePaths = photoIds.some(isFilePath);
  
  if (hasFilePaths) {
    // Convert file paths to photo IDs by looking them up in database
    const pathsToLookup = photoIds.filter(isFilePath);
    const placeholders = pathsToLookup.map(() => '?').join(',');
    
    // Query photos table - construct full path from path/album/name columns
    const lookupSql = `
      SELECT id, CONCAT(path, '/', album, '/', name) AS fullPath 
      FROM photos 
      WHERE CONCAT(path, '/', album, '/', name) IN (${placeholders})
    `;
    
    query(lookupSql, pathsToLookup)
      .then(async (photoRecords) => {
        // Build map of path -> id
        const pathToIdMap = {};
        photoRecords.forEach(record => {
          pathToIdMap[record.fullPath] = record.id;
        });
        
        // Find paths not in database and insert them
        const notFoundPaths = pathsToLookup.filter(path => !pathToIdMap[path]);
        
        if (notFoundPaths.length > 0) {
          console.log(`Auto-inserting ${notFoundPaths.length} new media file(s) into database...`);
          
          // Insert missing photos into database
          for (const fullPath of notFoundPaths) {
            try {
              // Parse path: "data/music/filename.mp3" -> path="data", album="music", name="filename.mp3"
              const parts = fullPath.split('/');
              if (parts.length >= 3) {
                const name = parts[parts.length - 1]; // filename
                const album = parts[parts.length - 2]; // album/folder
                const path = parts.slice(0, -2).join('/'); // base path
                
                // Insert photo
                const insertSql = 'INSERT INTO photos (name, album, path, tags) VALUES (?, ?, ?, ?)';
                const result = await query(insertSql, [name, album, path, '']);
                
                // Add to our map
                pathToIdMap[fullPath] = result.insertId;
                console.log(`✓ Inserted: ${fullPath} with ID ${result.insertId}`);
              }
            } catch (err) {
              console.error(`Failed to insert ${fullPath}:`, err.message);
            }
          }
        }
        
        // Convert all paths to IDs
        const resolvedIds = [];
        const stillNotFound = [];
        
        photoIds.forEach(id => {
          if (isFilePath(id)) {
            const resolved = pathToIdMap[id];
            if (resolved) {
              resolvedIds.push(resolved);
            } else {
              stillNotFound.push(id);
            }
          } else {
            resolvedIds.push(parseInt(id));
          }
        });
        
        if (stillNotFound.length > 0) {
          console.warn(`Still couldn't add ${stillNotFound.length} photo(s):`, stillNotFound);
        }
        
        if (resolvedIds.length === 0) {
          return res.status(400).send({ 
            error: true, 
            message: 'No valid photos could be added to database',
            notFound: stillNotFound
          });
        }
        
        // Now call Playlist.addItems with resolved IDs
        Playlist.addItems(req.params.playlistId, resolvedIds, function(err, result) {
          if (err) {
            console.error("Error adding items to playlist:", err);
            return res.status(500).send(err);
          }
          
          const message = stillNotFound.length > 0 
            ? `Added ${result} items to playlist (${stillNotFound.length} failed to process)`
            : `Added ${result} items to playlist`;
          
          res.json({ 
            message, 
            itemsAdded: result, 
            success: true,
            skipped: stillNotFound.length 
          });
        });
      })
      .catch((err) => {
        console.error("Error looking up photo IDs:", err);
        res.status(500).send({ error: true, message: 'Error processing photo IDs', details: err.message });
      });
  } else {
    // Already have numeric IDs, proceed normally
    Playlist.addItems(req.params.playlistId, photoIds, function(err, result) {
      if (err) {
        console.error("Error adding items to playlist:", err);
        return res.status(500).send(err);
      }
      
      res.json({ message: `Added ${result} items to playlist`, itemsAdded: result, success: true });
    });
  }
}

// Get playlist items
export function getPlaylistItems(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  Playlist.getPlaylistItems(req.params.playlistId, function(err, items) {
    if (err) {
      console.error("Error fetching playlist items:", err);
      return res.status(500).send(err);
    }
    
    res.json(items);
  });
}

// Remove item from playlist
export function removePlaylistItem(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  if (!req.params.itemId) {
    return res.status(400).send({ error: true, message: 'Item ID is required' });
  }

  Playlist.removeItem(req.params.playlistId, req.params.itemId, function(err, result) {
    if (err) {
      console.error("Error removing playlist item:", err);
      return res.status(500).send(err);
    }
    
    if (result === 0) {
      return res.status(404).send({ error: true, message: 'Item not found in playlist' });
    }
    
    res.json({ message: 'Item removed from playlist', success: true });
  });
}

// Delete playlist
export function removePlaylist(req, res) {
  if (!req.params.playlistId) {
    return res.status(400).send({ error: true, message: 'Playlist ID is required' });
  }

  Playlist.remove(req.params.playlistId, function(err, result) {
    if (err) {
      console.error("Error removing playlist:", err);
      return res.status(500).send(err);
    }
    
    res.json({ message: 'Playlist deleted successfully', success: true });
  });
}

// Get all playlist tags - unique tags used in playlists
export function getPlaylistTags(req, res) {
  Playlist.getPlaylists(function(err, playlists) {
    if (err) return res.status(500).send(err);

    // Return full playlist objects (name, id, tags, item_count)
    const playlistsWithTags = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      tags: playlist.tags || '',
      item_count: playlist.item_count,
      description: playlist.description || ''
    }));

    res.json(playlistsWithTags);
  });
}
