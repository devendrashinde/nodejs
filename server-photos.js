import { createReadStream, readdirSync, statSync } from 'fs';
import { promises as fs } from 'fs';
import express from 'express';
import fileUpload from 'express-fileupload';
import { join, sep, extname } from 'path';
import path from 'path';
import ImageDetails from "./ImageDetails.js";
import { fileURLToPath } from 'url';
import { createPhoto, getPhotos, getTags, getPhoto, updatePhotoTag, removePhoto, getAlbumTags, createPhotoAlbum, getPhotoAlbum, getPhotoAlbums, updateAlbumTag, removeAlbum, getAlbumsByTag } from './app/controllers/photoController.js';
import { createPlaylist, getPlaylists, getPlaylist, getPlaylistsByTag, updatePlaylist, updatePlaylistTag, addPlaylistItems, getPlaylistItems, removePlaylistItem, removePlaylist, getPlaylistTags } from './app/controllers/playlistController.js';
import media from './app/services/media.js';
import advancedFeaturesRoutes from './app/routes/advancedFeaturesRoutes.js';
import pkg from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { urlencoded, json } = pkg;
const app = express();

// Constants
const MIME_TYPES = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const SKIP_FILE_TYPES = ['.db','.exe','.tmp','.doc','.dat','.ini', '.srt','.idx','.rar','.sub','.zip','.php','.wmdb'];
const ITEMS_PER_PAGE = 20;

// Cache configuration - optimized for static albums
const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE) || 500; // maximum cached pages
const MAX_CACHE_BYTES = parseInt(process.env.MAX_CACHE_BYTES) || (100 * 1024 * 1024); // 100MB max cache size
const CACHE_FILE = process.env.CACHE_FILE_PATH || './cache/album-cache.json';

// Thumbnail directory - separate from media files
const THUMBNAIL_DIR = process.env.THUMBNAIL_DIR || './temp-pic/thumbnails';
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'];
const ALLOWED_VIDEO_TYPES = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg', '.ogv', '.3gp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const dataDir = join(__dirname, "data");
const BASE_DIR = 'data/';

app.set('view engine', 'pug');
app.set('views', __dirname);

app.use(fileUpload({
    createParentPath: true
}));

app.use(urlencoded({ extended: true }));
app.use(json());

// Handle favicon.ico requests - prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content response
});

// Mount API routes BEFORE static file serving to prevent conflicts
app.use('/api', advancedFeaturesRoutes);

app.use(express.static(join(__dirname, 'public')));
app.use('/data', express.static(join(__dirname, "data")));

// ============================================================
// OPTIMIZED CACHING SYSTEM FOR STATIC ALBUMS
// ============================================================

// In-memory cache with mtime tracking and size limits
const imageCache = new Map(); // { cacheKey: cacheData }
const albumMetaCache = new Map(); // { albumPath: { mtime, indexed, hits } }
const cacheStats = { hits: 0, misses: 0, diskLoads: 0, cacheSizeBytes: 0 };

/**
 * Calculate size of cache entry in bytes (approximate)
 */
const calculateCacheSize = (value) => {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 1000; // fallback estimate
  }
};

/**
 * Add item to cache with size-based eviction
 */
const addToCache = (key, value) => {
  const size = calculateCacheSize(value);
  
  // Size limit check - evict oldest entries if needed
  if (cacheStats.cacheSizeBytes + size > MAX_CACHE_BYTES || imageCache.size >= MAX_CACHE_SIZE) {
    evictCacheEntries(Math.ceil((imageCache.size * 0.2))); // Remove 20% oldest
  }
  
  imageCache.set(key, value);
  cacheStats.cacheSizeBytes += size;
};

/**
 * Evict oldest cache entries by hit count
 */
const evictCacheEntries = (count) => {
  const entries = Array.from(imageCache.entries());
  
  // Sort by last hit (albums with most hits are kept)
  entries.sort((a, b) => {
    const keyA = a[0];
    const keyB = b[0];
    const hitsA = albumMetaCache.get(extractAlbumFromKey(keyA))?.hits || 0;
    const hitsB = albumMetaCache.get(extractAlbumFromKey(keyB))?.hits || 0;
    return hitsA - hitsB;
  });
  
  // Remove oldest
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    const size = calculateCacheSize(entries[i][1]);
    imageCache.delete(entries[i][0]);
    cacheStats.cacheSizeBytes -= size;
  }
  
  console.log(`🗑️  Evicted ${Math.min(count, entries.length)} cache entries. Cache size: ${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB`);
};

/**
 * Extract album path from cache key (format: "albumPath_page_items")
 */
const extractAlbumFromKey = (cacheKey) => {
  const parts = cacheKey.split('_');
  // Last two parts are page and items
  return cacheKey.substring(0, cacheKey.length - parts[parts.length - 1].length - parts[parts.length - 2].length - 2);
};

/**
 * Load persistent cache from disk on startup
 */
const loadPersistentCache = async () => {
  try {
    // Ensure cache directory exists
    await fs.mkdir(join(__dirname, 'cache'), { recursive: true });
    
    const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
    
    // Skip if file is empty (first run)
    if (!cacheData || cacheData.trim() === '') {
      console.log(`ℹ️  Cache file is empty (first run)`);
      return false;
    }
    
    const cached = JSON.parse(cacheData);
    
    // New format: { imageCache: {...}, albumMeta: {...} }
    // Old format: { key1: value1, key2: value2 } (direct entries)
    const isNewFormat = cached.imageCache !== undefined;
    
    if (isNewFormat) {
      // Load image cache
      if (cached.imageCache) {
        for (const [key, value] of Object.entries(cached.imageCache)) {
          imageCache.set(key, value);
          cacheStats.cacheSizeBytes += calculateCacheSize(value);
        }
      }
      
      // Load album metadata cache
      if (cached.albumMeta) {
        for (const [album, meta] of Object.entries(cached.albumMeta)) {
          // Restore Date objects from ISO strings
          albumMetaCache.set(album, {
            mtime: meta.mtime,
            indexed: meta.indexed ? new Date(meta.indexed) : null,
            hits: meta.hits || 0,
            discovered: meta.discovered ? new Date(meta.discovered) : null
          });
        }
      }
      
      console.log(`✓ Loaded ${imageCache.size} cached pages and ${albumMetaCache.size} album metadata entries (${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
    } else {
      // Backward compatibility - old format (direct entries)
      for (const [key, value] of Object.entries(cached)) {
        imageCache.set(key, value);
        cacheStats.cacheSizeBytes += calculateCacheSize(value);
      }
      console.log(`✓ Loaded ${imageCache.size} cached albums from disk (old format, ${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    cacheStats.diskLoads++;
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist - first run
      console.log(`ℹ️  No persistent cache found (first run)`);
      return false;
    } else if (err instanceof SyntaxError) {
      // Corrupted JSON - delete and start fresh
      console.warn(`⚠️  Cache file corrupted, starting fresh. Error: ${err.message}`);
      try {
        await fs.unlink(CACHE_FILE);
        console.log(`✓ Removed corrupted cache file`);
      } catch (unlinkErr) {
        console.error('Failed to remove corrupted cache:', unlinkErr.message);
      }
      return false;
    } else {
      console.error('Error loading persistent cache:', err.message);
      return false;
    }
  }
};

/**
 * Save cache to disk for persistence across restarts
 */
const savePersistentCache = async () => {
  try {
    await fs.mkdir(join(__dirname, 'cache'), { recursive: true });
    
    // Save both image cache and album metadata
    const cacheData = {
      imageCache: Object.fromEntries(imageCache),
      albumMeta: Object.fromEntries(albumMetaCache),
      savedAt: new Date().toISOString(),
      stats: {
        entries: imageCache.size,
        albums: albumMetaCache.size,
        sizeBytes: cacheStats.cacheSizeBytes
      }
    };
    
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`✓ Saved ${imageCache.size} pages and ${albumMetaCache.size} album metadata to persistent cache (${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
  } catch (err) {
    console.error('Error saving persistent cache:', err);
  }
};

/**
 * Lightweight scan for new albums (folders) in data directory
 * Only reads directory names, doesn't scan contents
 */
const scanForNewAlbums = async () => {
  try {
    const knownAlbums = new Set(albumMetaCache.keys());
    const discoveredAlbums = [];
    
    // Scan top-level data directory
    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const albumName = entry.name;
        
        // Check if this is a new album
        if (!knownAlbums.has(albumName)) {
          // Initialize metadata for new album
          albumMetaCache.set(albumName, {
            mtime: null,
            indexed: null,
            hits: 0,
            discovered: new Date()
          });
          discoveredAlbums.push(albumName);
        }
        
        // Also scan one level deep for nested albums (e.g., "pictures/2020-Jan")
        try {
          const subPath = join(dataDir, albumName);
          const subEntries = await fs.readdir(subPath, { withFileTypes: true });
          
          for (const subEntry of subEntries) {
            if (subEntry.isDirectory()) {
              const nestedAlbumName = `${albumName}/${subEntry.name}`;
              
              if (!knownAlbums.has(nestedAlbumName)) {
                albumMetaCache.set(nestedAlbumName, {
                  mtime: null,
                  indexed: null,
                  hits: 0,
                  discovered: new Date()
                });
                discoveredAlbums.push(nestedAlbumName);
              }
            }
          }
        } catch (err) {
          // Skip if can't read subdirectory
        }
      }
    }
    
    if (discoveredAlbums.length > 0) {
      console.log(`🆕 Discovered ${discoveredAlbums.length} new album(s): ${discoveredAlbums.join(', ')}`);
    }
    
    return discoveredAlbums;
  } catch (err) {
    console.error('Error scanning for new albums:', err.message);
    return [];
  }
};

/**
 * Save cache every 5 minutes
 */
setInterval(savePersistentCache, 5 * 60 * 1000);

/**
 * Log cache statistics every 10 minutes
 */
setInterval(() => {
  console.log(`📊 Cache Stats - Size: ${imageCache.size} entries (${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB), Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}, Hit Rate: ${((cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100) || 0).toFixed(1)}%`);
}, 10 * 60 * 1000);

/**
 * Scan for new albums every 15 minutes (lightweight directory scan)
 */
setInterval(scanForNewAlbums, 15 * 60 * 1000);

// Validation helpers
const isValidFileType = (filename) => {
    const ext = extname(filename).toLowerCase();
    return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(ext);
};

const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const isValidAlbumName = (album) => {
    // Prevent path traversal attacks
    return album && !album.includes('..') && !album.includes('\0');
};

const validatePagination = (page, items) => {
    const pageNum = parseInt(page) || 0;
    const itemsNum = parseInt(items) || ITEMS_PER_PAGE;
    
    return {
        page: Math.max(0, pageNum),
        items: Math.min(Math.max(1, itemsNum), 100) // Max 100 items per page
    };
};

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

app.post('/upload', asyncHandler(async (req, res) => {
    // Validate file presence
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedFile = req.files.file;
    const album = req.body.album;

    // Validate album name
    if (!isValidAlbumName(album)) {
        return res.status(400).json({ error: 'Invalid album name.' });
    }

    // Validate file type
    if (!isValidFileType(uploadedFile.name)) {
        return res.status(400).json({ 
            error: 'Invalid file type. Allowed types: images and videos only.' 
        });
    }

    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
        return res.status(400).json({ 
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
        });
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(uploadedFile.name);
    const fileName = `${BASE_DIR}${album}/${safeFilename}`.replace(/\\/g, '/');
    
    console.log(`Uploading file: ${fileName}`);

    try {
        await uploadedFile.mv(fileName);
        req.body.name = fileName;
        createPhoto(req, res);
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Failed to upload file.', details: err.message });
    }
}));


app.get('/thumb?:id', asyncHandler(async (req, res) => {
    if (req.query.id) {
        console.log(`Generating thumbnail for: ${req.query.id}`);
        const image = new media(req.query.id, THUMBNAIL_DIR);
        image.thumb(req, res);
    } else {
        res.status(403).json({ error: 'Missing image ID parameter.' });
    }
}));

// Root path - Main gallery interface
app.get('/', (req, res) => {
    res.render('index', { title: 'Our Photo Gallery', images: {} })
});

// Alias for backward compatibility
app.get('/get-images', (req, res) => {
    res.render('index', { title: 'Our Photo Gallery', images: {} })
});

app.get('/photos', asyncHandler(async (req, res) => {
    let album = req.query.id;
    
    // Validate album name
    if (album && !isValidAlbumName(album)) {
        return res.status(400).json({ error: 'Invalid album name.' });
    }
    
    let targetDir = dataDir;
    if (!album || album === "Home") {
        album = "Home";
    } else {
        targetDir = join(dataDir, album);
    }

    // Validate and sanitize pagination
    const { page, items } = validatePagination(req.query.page, req.query.items);
    
    // ===== OPTIMIZED MTIME-BASED CACHING =====
    const cacheKey = getCacheKey(targetDir, page, items);
    
    try {
        // Check directory modification time (single fast stat call)
        const stats = await fs.stat(targetDir);
        const currentMtime = stats.mtime.getTime();
        
        // Get or initialize album metadata
        let albumMeta = albumMetaCache.get(album) || { mtime: null, indexed: null, hits: 0 };
        albumMeta.hits++;
        
        // If cached and mtime matches, return cached result
        if (albumMeta.mtime === currentMtime && imageCache.has(cacheKey)) {
            cacheStats.hits++;
            console.log(`✓ Cache HIT (mtime match) for album "${album}" page ${page} items ${items} [${albumMeta.hits} hits]`);
            albumMetaCache.set(album, albumMeta);
            
            const result = imageCache.get(cacheKey);
            return res.json({
                totalPhotos: result.totalPhotos,
                data: result.images,
                cached: true,
                mtimeMatch: true
            });
        }
        
        // Directory changed or first access - read from disk
        if (albumMeta.mtime !== currentMtime) {
            console.log(`✗ Cache MISS (mtime changed) for album "${album}" - was ${albumMeta.mtime}, now ${currentMtime}`);
        } else {
            console.log(`✗ Cache MISS (page not cached) for album "${album}" page ${page} items ${items}`);
        }
        
        cacheStats.misses++;
        albumMeta.mtime = currentMtime;
        albumMeta.indexed = new Date();
        albumMetaCache.set(album, albumMeta);
        
        // Get images from directory
        const result = getImagesFromDir(targetDir, album, page, false, items);
        
        // Add to cache with size tracking
        addToCache(cacheKey, result);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // Browser cache 5 minutes
        
        res.json({
            totalPhotos: result.totalPhotos,
            data: result.images,
            cached: false,
            mtimeMatch: false
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return res.status(500).json({ error: 'Failed to read album directory.' });
    }
}));

// ===== CACHE MANAGEMENT ENDPOINTS =====

/**
 * Manual cache invalidation endpoint
 * POST /api/cache/invalidate?album=optional_album_name
 */
app.post('/api/cache/invalidate', (req, res) => {
    const { album } = req.body || req.query;
    let count = 0;
    
    try {
        if (album) {
            // Clear specific album from cache
            for (const [key, _] of imageCache.entries()) {
                if (key.includes(album)) {
                    const size = calculateCacheSize(_);
                    imageCache.delete(key);
                    cacheStats.cacheSizeBytes -= size;
                    count++;
                }
            }
            albumMetaCache.delete(album);
            console.log(`✓ Cleared cache for album: ${album} (${count} entries)`);
        } else {
            // Clear all cache
            count = imageCache.size;
            const totalSize = cacheStats.cacheSizeBytes;
            imageCache.clear();
            albumMetaCache.clear();
            cacheStats.cacheSizeBytes = 0;
            console.log(`✓ Cleared entire cache (${count} entries, ${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
        }
        
        res.json({ 
            success: true, 
            cleared: album || 'all', 
            entriesRemoved: count,
            cacheSize: `${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB`
        });
    } catch (err) {
        console.error('Cache invalidation error:', err);
        res.status(500).json({ error: 'Failed to invalidate cache', details: err.message });
    }
});

/**
 * Cache health/stats endpoint
 * GET /api/cache/stats
 */
app.get('/api/cache/stats', (req, res) => {
    const hitRate = ((cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100) || 0).toFixed(1);
    const topAlbums = Array.from(albumMetaCache.entries())
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, 10)
        .map(([album, meta]) => ({
            album,
            hits: meta.hits,
            lastIndexed: meta.indexed,
            mtime: new Date(meta.mtime)
        }));
    
    res.json({
        stats: {
            cacheEntries: imageCache.size,
            cacheSizeBytes: cacheStats.cacheSizeBytes,
            cacheSizeMB: (cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2),
            maxCacheBytes: (MAX_CACHE_BYTES / 1024 / 1024).toFixed(2),
            maxCacheEntries: MAX_CACHE_SIZE,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            hitRate: `${hitRate}%`,
            diskLoads: cacheStats.diskLoads,
            totalAlbumsTracked: albumMetaCache.size
        },
        topAlbums
    });
});

/**
 * Trigger manual album scan
 * GET /api/cache/scan-albums
 */
app.get('/api/cache/scan-albums', asyncHandler(async (req, res) => {
    const discoveredAlbums = await scanForNewAlbums();
    
    res.json({
        success: true,
        newAlbumsFound: discoveredAlbums.length,
        albums: discoveredAlbums,
        totalAlbumsTracked: albumMetaCache.size
    });
}));

app.route('/')
    .post(createPhoto);

app.route('/tags?:id')
    .get(getPhotos);
	
app.route('/tags?:tag')
    .get(getPhotos);

app.route('/alltags')
   .get(getTags);

// ============================================================
// ALBUM TAGGING ROUTES (v3.0)
// ============================================================
// Note: More specific routes MUST come before parameterized routes

// Photo tags endpoint
app.route('/tags')
    .get(getTags);

// Album tags endpoints (specific routes BEFORE parameterized routes)
app.route('/albums/tags')
    .get(getAlbumTags);

app.route('/albums/tags/search')
    .get(getAlbumsByTag);

// General photo routes
app.route('/photos')
    .post(createPhoto)
    .patch(updatePhotoTag);

app.route('/photos?:id?:name?:tag')
    .get(getPhoto)
    .delete(removePhoto);

// General album routes (parameterized routes come last)
app.route('/albums')
    .get(getPhotoAlbums)
    .post(createPhotoAlbum);

app.route('/albums/:albumId')
    .get(getPhotoAlbum)
    .put(updateAlbumTag)
    .delete(removeAlbum);

// ============================================================
// PLAYLIST ROUTES (v4.0)
// ============================================================
// Note: More specific routes MUST come before parameterized routes

app.route('/playlists/tags')
    .get(getPlaylistTags);

app.route('/playlists/tags/search')
    .get(getPlaylistsByTag);

app.route('/playlists')
    .get(getPlaylists)
    .post(createPlaylist);

app.route('/playlists/:playlistId')
    .get(getPlaylist)
    .put(updatePlaylist)
    .delete(removePlaylist);

app.route('/playlists/:playlistId/items')
    .get(getPlaylistItems)
    .post(addPlaylistItems);

app.route('/playlists/:playlistId/items/:itemId')
    .delete(removePlaylistItem);

// Legacy support for updating tags
app.route('/playlists/:playlistId/tags')
    .put(updatePlaylistTag);

app.get('*', (req, res) => {
    const file = join(dataDir, req.path.replace(/\/$/, '/index.html'));

    // Security check for path traversal
    if (file.indexOf(dataDir + sep) !== 0) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    const type = MIME_TYPES[extname(file).slice(1)] || 'text/plain';
    const stream = createReadStream(file);
    
    stream.on('open', () => {
        res.set('Content-Type', type);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        stream.pipe(res);
    });
    
    stream.on('error', (err) => {
        console.error('File read error:', err);
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

const getAlbumName = (file) => {
    let filename = file
        .replace("IMG", "")
        .replace("VID", "")
        .replace("_", "")
        .replace("-", "");
    
    if (filename.indexOf(".") > 0) {
        const str = filename.substr(filename.indexOf(".") - 1);
        filename = filename.replace(str, "");
    }
    
    let dir = "uploaded";
    filename = filename.substr(0, 6);
    
    const parsed = parseInt(filename);
    if (parsed > 0) {
        const year = filename.substr(0, 4);
        const month = filename.substr(4);
        const monthNum = parseInt(month);
        
        if (monthNum >= 1 && monthNum <= 12) {
            dir = `${year}-${MONTHS[monthNum - 1]}`;
        }
    }
    
    console.log(`Album name for ${file}: ${dir}`);
    return dir;
};

const getTagFromFileName = (file) => {
    // Remove directory path if present
    const base = file.split(/[\\/]/).pop();
    // Remove extension
    const tag = base.replace(/\.[^/.]+$/, "");
    console.log(`Tag from filename ${file}: ${tag}`);
    return tag;
};

const getCacheKey = (album, page, items) => `${album}_${page}_${items}`;

// Get images from directory with pagination
const getImagesFromDir = (dirPath, album, page, onlyDir, numberOfItems) => {
    const allImages = [];
    const files = readdirSync(dirPath);
    
    let id = 0;
    let imageCnt = 0;
    let imageIndex = 0;
    const firstImageId = page * numberOfItems;
    const root = album === "Home";
    
    // Add parent album
    if (!root) {
        const fileparts = album.split("/");
        const albumName = fileparts[fileparts.length - 1];
        allImages.push(new ImageDetails(`album${id}`, albumName, album, true, albumName));
    } else {
        allImages.push(new ImageDetails(`album${id}`, album, "", true, album));
    }
    
    for (const file of files) {
        const fileLocation = join(dirPath, file);
        
        try {
            const stat = statSync(fileLocation);
            id++;
            
            if (stat && stat.isDirectory()) {
                const album_name = (root ? "" : `${album}/`) + file;
                const imageDetails = new ImageDetails(`album${id}`, file, album_name, true, file);
                allImages.push(imageDetails);
            } else if (!onlyDir && stat && stat.isFile()) {
                const ext = extname(fileLocation).toLowerCase();
                
                if (!SKIP_FILE_TYPES.includes(ext)) {
                    if (imageIndex >= firstImageId && imageCnt < numberOfItems) {
                        const filePath = BASE_DIR + (root ? "" : `${album}/`) + file;
                        allImages.push(new ImageDetails(
                            `photo${id}`, 
                            file, 
                            filePath, 
                            false, 
                            album, 
                            getTagFromFileName(file)
                        ));
                        imageCnt++;
                    }
                    imageIndex++;
                }
            }
        } catch (err) {
            console.error(`Error processing file ${fileLocation}:`, err);
            continue;
        }
    }
    
    console.log(`Found ${imageIndex} total images, returning ${allImages.length} items`);
    
    return {
        totalPhotos: imageIndex,
        images: allImages,
        page,
        itemsPerPage: numberOfItems
    };
};
 
// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler should be defined after error handler in this case it's handled by app.get('*')

const PORT = process.env.PORT || 8082;
const server = app.listen(PORT, async () => {
    // Load persistent cache from disk on startup
    await loadPersistentCache();
    
    // Initial album scan to populate metadata
    const newAlbums = await scanForNewAlbums();
    if (newAlbums.length > 0) {
        console.log(`✓ Initial scan discovered ${newAlbums.length} albums`);
    }
    
    console.log(`✓ Application is running at: http://localhost:${PORT}`);
    console.log(`✓ Max cache size: ${MAX_CACHE_SIZE} entries / ${(MAX_CACHE_BYTES / 1024 / 1024).toFixed(0)}MB`);
    console.log(`✓ Cache persistence: ${CACHE_FILE}`);
    console.log(`✓ Data directory: ${dataDir}`);
    console.log(`✓ Album discovery: Scanning every 15 minutes`);
    console.log(`✓ Advanced features enabled (EXIF, Search, Bulk Ops, Social, Editing, Video)`);
});

// Graceful shutdown - save cache before exit
const gracefulShutdown = async () => {
    console.log('\n⚠ Received shutdown signal, closing server gracefully...');
    
    // Save cache to disk
    await savePersistentCache();
    
    server.close(() => {
        const hitRate = ((cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100) || 0).toFixed(1);
        console.log('✓ Server closed');
        console.log(`📊 Final cache stats - Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}, Hit Rate: ${hitRate}%`);
        console.log(`💾 Cache saved: ${imageCache.size} page entries, ${albumMetaCache.size} album metadata (${(cacheStats.cacheSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
        process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠ Forcing shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
