import { createReadStream, readdirSync, statSync } from 'fs';
import express from 'express';
import fileUpload from 'express-fileupload';
import { join, sep, extname } from 'path';
import path from 'path';
import ImageDetails from "./ImageDetails.js";
import { fileURLToPath } from 'url';
import { createPhoto, getPhotos, getTags } from './app/controllers/photoController.js';
import media from './app/services/media.js';
import advancedFeaturesRoutes from './app/routes/advancedFeaturesRoutes.js';
import pkg from 'body-parser';

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
const CACHE_CLEAR_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Thumbnail directory - separate from media files
const THUMBNAIL_DIR = process.env.THUMBNAIL_DIR || './temp-pic/thumbnails';
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'];
const ALLOWED_VIDEO_TYPES = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg', '.ogv', '.3gp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.set('view engine', 'pug');
app.set('views', __dirname);

app.use(fileUpload({
    createParentPath: true
}));

app.use(urlencoded({ extended: true }));
app.use(json());

// Mount API routes BEFORE static file serving to prevent conflicts
app.use('/api', advancedFeaturesRoutes);

app.use(express.static(join(__dirname, 'public')));
app.use('/data', express.static(join(__dirname, "data")));

const dataDir = join(__dirname, "data");
const BASE_DIR = 'data/';

// Cache configuration
const imageCache = new Map();
const cacheStats = { hits: 0, misses: 0 };


// Clear cache periodically
setInterval(() => {
    const size = imageCache.size;
    console.log(`Clearing image cache. Stats - Size: ${size}, Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);
    imageCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
}, CACHE_CLEAR_INTERVAL);

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
    
    // Check if page is cached
    const cacheKey = getCacheKey(targetDir, page, items);
    
    if (imageCache.has(cacheKey)) {
        cacheStats.hits++;
        console.log(`✓ Cache HIT for album "${album}" page ${page} items ${items}`);
        const result = imageCache.get(cacheKey);
        
        return res.json({
            totalPhotos: result.totalPhotos,
            data: result.images,
            cached: true
        });
    }
    
    cacheStats.misses++;
    console.log(`✗ Cache MISS for album "${album}" page ${page} items ${items}`);
    
    try {
        const result = getImagesFromDir(targetDir, album, page, false, items);
        imageCache.set(cacheKey, result);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
        
        res.json({
            totalPhotos: result.totalPhotos,
            data: result.images,
            cached: false
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return res.status(500).json({ error: 'Failed to read album directory.' });
    }
}));

app.route('/')
    .post(createPhoto);

app.route('/tags?:id')
    .get(getPhotos);
	
app.route('/tags?:tag')
    .get(getPhotos);

app.route('/alltags')
   .get(getTags);;

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
const server = app.listen(PORT, () => {
    console.log(`✓ Application is running at: http://localhost:${PORT}`);
    console.log(`✓ Cache clear interval: ${CACHE_CLEAR_INTERVAL / 1000}s`);
    console.log(`✓ Data directory: ${dataDir}`);
    console.log(`✓ Advanced features enabled (EXIF, Search, Bulk Ops, Social, Editing, Video)`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n⚠ Received shutdown signal, closing server gracefully...');
    
    server.close(() => {
        console.log('✓ Server closed');
        console.log(`Final cache stats - Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);
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
