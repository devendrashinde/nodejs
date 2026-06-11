# Advanced Features Quick Start Guide

## Installation

1. **Install new dependencies:**
   ```bash
   npm install
   ```

   New packages added:
   - `exif-parser@^0.1.12` - EXIF data extraction
   - `archiver@^6.0.1` - ZIP file creation

2. **Update environment variables:**
   ```bash
   # Add to .env if needed
   EXIF_ENABLED=true
   VIDEO_TRANSCODING_ENABLED=true
   ```

3. **Ensure FFmpeg is installed** (for video features):
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # Windows (via chocolatey)
   choco install ffmpeg
   ```

---

## Quick Examples

### 1. Extract EXIF Data

```bash
# Get EXIF data for a photo
curl -X GET "http://localhost:8082/api/photos/data/pictures/photo.jpg/exif"
```

**Response:**
```json
{
  "exif": {
    "camera": {
      "make": "Canon",
      "model": "Canon EOS R"
    },
    "shooting": {
      "iso": 400,
      "fNumber": "f/2.0",
      "exposureTime": "1/500",
      "dateTime": {"display": "2024:01:15 10:30:45"}
    },
    "image": {
      "width": 6000,
      "height": 4000
    },
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "summary": "📷 Canon EOS R | 📅 2024-01-15 10:30:45 | 🔍 50.0mm | f/2.0"
}
```

### 2. Advanced Search

```bash
# Search for sunset photos from 2024 with landscape tag
curl -X GET "http://localhost:8082/api/search?q=sunset&tags=landscape&dateFrom=2024-01-01&dateTo=2024-12-31&sort=date&order=desc"
```

**Get autocomplete suggestions:**
```bash
curl -X GET "http://localhost:8082/api/search/suggestions?prefix=nat&field=tags"
```

### 3. Bulk Operations

```bash
# Bulk add tags to photos
curl -X POST "http://localhost:8082/api/bulk/tags" \
  -H "Content-Type: application/json" \
  -d '{
    "photoIds": ["photo1", "photo2", "photo3"],
    "tags": ["vacation", "beach", "summer"]
  }'
```

```bash
# Bulk mark photos as favorite
curl -X POST "http://localhost:8082/api/bulk/favorite" \
  -H "Content-Type: application/json" \
  -d '{
    "photoIds": ["photo1", "photo2"],
    "isFavorite": true
  }'
```

```bash
# Prepare bulk download as ZIP
curl -X POST "http://localhost:8082/api/bulk/download" \
  -H "Content-Type: application/json" \
  -d '{
    "photoIds": ["photo1", "photo2", "photo3"]
  }'
```

### 4. Social Features

```bash
# Add comment to photo
curl -X POST "http://localhost:8082/api/photos/photo1/comments" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Beautiful sunset shot!"
  }'
```

```bash
# Rate photo (1-5 stars)
curl -X POST "http://localhost:8082/api/photos/photo1/ratings" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4
  }'
```

```bash
# Generate shareable link (expires in 24 hours)
curl -X POST "http://localhost:8082/api/photos/photo1/share" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 1440
  }'
```

### 5. Image Editing

```bash
# Get available filters
curl -X GET "http://localhost:8082/api/filters"
```

```bash
# Rotate photo 90 degrees
curl -X POST "http://localhost:8082/api/photos/photo1/rotate" \
  -H "Content-Type: application/json" \
  -d '{
    "degrees": 90
  }'
```

```bash
# Apply multiple edits
curl -X POST "http://localhost:8082/api/photos/photo1/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "edits": [
      {"type": "rotate", "degrees": 90},
      {"type": "filter", "filterType": "sepia"},
      {"type": "brightness-contrast", "options": {"brightness": 10, "contrast": 5}}
    ]
  }'
```

### 6. Video Enhancements

```bash
# Get video metadata
curl -X GET "http://localhost:8082/api/videos/myvideo.mp4/metadata"
```

**Response:**
```json
{
  "metadata": {
    "file": {
      "duration": 120.5,
      "size": 52428800,
      "bitrate": 3500000
    },
    "video": {
      "codec": "h264",
      "width": 1920,
      "height": 1080,
      "fps": 30
    },
    "audio": {
      "codec": "aac",
      "channels": 2,
      "sampleRate": 48000
    }
  }
}
```

```bash
# Get available video qualities
curl -X GET "http://localhost:8082/api/videos/qualities"
```

```bash
# Generate video thumbnail at 15 seconds
curl -X POST "http://localhost:8082/api/videos/myvideo.mp4/thumbnail" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "00:00:15",
    "width": 320,
    "height": 240
  }'
```

---

## JavaScript/Frontend Integration

### Using Fetch API

```javascript
// Fetch EXIF data
async function getPhotoExif(photoId) {
    const response = await fetch(`/api/photos/${photoId}/exif`);
    const data = await response.json();
    console.log('Camera:', data.exif.camera.model);
    console.log('GPS:', data.exif.location);
}

// Bulk add tags
async function bulkTagPhotos(photoIds, tags) {
    const response = await fetch('/api/bulk/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds, tags })
    });
    const result = await response.json();
    console.log(`Tagged ${result.total} photos`);
}

// Search with advanced filters
async function searchPhotos(criteria) {
    const params = new URLSearchParams(criteria);
    const response = await fetch(`/api/search?${params}`);
    const results = await response.json();
    return results;
}

// Add comment
async function addComment(photoId, text) {
    const response = await fetch(`/api/photos/${photoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const comment = await response.json();
    return comment;
}

// Rate photo
async function ratePhoto(photoId, rating) {
    const response = await fetch(`/api/photos/${photoId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
    });
    return response.json();
}

// Generate share link
async function sharePhoto(photoId, expiresIn = 1440) {
    const response = await fetch(`/api/photos/${photoId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn })
    });
    const shareLink = await response.json();
    console.log('Share URL:', shareLink.url);
    return shareLink;
}

// Edit photo
async function editPhoto(photoId, edits) {
    const response = await fetch(`/api/photos/${photoId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits })
    });
    return response.json();
}

// Get video metadata
async function getVideoInfo(videoId) {
    const response = await fetch(`/api/videos/${videoId}/metadata`);
    const data = await response.json();
    console.log('Duration:', data.duration);
    console.log('Resolution:', `${data.metadata.video.width}x${data.metadata.video.height}`);
}
```

---

## Service Integration Examples

### Using EXIF Service Directly

```javascript
import ExifService from './app/services/exifService.js';

// Extract and filter EXIF data
const exifArray = photos.map(p => ExifService.extractExifData(p.path));

// Filter photos by date and camera
const filtered = photos.filter((photo, index) => {
    const exif = exifArray[index];
    return exif.shooting?.dateTimeOriginal?.iso >= '2024-01-01' &&
           exif.camera?.model?.includes('Canon');
});
```

### Using Search Service

```javascript
import AdvancedSearchService from './app/services/searchService.js';

// Search and get statistics
const results = AdvancedSearchService.search(photos, {
    query: 'nature',
    tags: ['landscape', 'mountains'],
    dateFrom: '2024-01-01'
});

const stats = AdvancedSearchService.getStatistics(photos);
console.log(`Total albums: ${stats.albums.length}`);
console.log(`Unique tags: ${stats.tags.length}`);
```

### Using Bulk Operations

```javascript
import BulkOperationsService from './app/services/bulkOperationsService.js';

// Validate before bulk operation
const validation = BulkOperationsService.validateBulkOperation(photoIds);
if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
}

// Perform bulk operation
const batch = BulkOperationsService.bulkAddTags(photoIds, tags, photos);
console.log(`Successfully tagged ${batch.results.filter(r => r.success).length} photos`);
```

---

## Database Setup for Social Features

Run these SQL commands to set up tables for comments, ratings, and favorites:

```sql
-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_photo (photo_id),
    KEY idx_user (user_id)
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_photo_user (photo_id, user_id),
    KEY idx_photo (photo_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_photo_user (photo_id, user_id),
    KEY idx_photo (photo_id)
);

-- Share Links
CREATE TABLE IF NOT EXISTS share_links (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36),
    album_id VARCHAR(36),
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT DEFAULT 0,
    KEY idx_token (token),
    KEY idx_photo (photo_id)
);
```

---

## Troubleshooting

### EXIF extraction not working
- Ensure `exif-parser` is installed: `npm install exif-parser`
- Check file permissions for photo files
- Verify GraphicsMagick is installed for ImageMagick integration

### Video features not working
- Install FFmpeg: `brew install ffmpeg` (macOS) or `sudo apt-get install ffmpeg` (Linux)
- Check video file format is supported (MP4, WebM, MOV, MKV)
- Ensure sufficient disk space for video processing

### Bulk operations timing out
- Reduce batch size (max recommended: 500 photos)
- Process in smaller chunks
- Implement job queue for very large operations

### Search performance issues
- Add database indexes on `tags`, `album`, `created_at` columns
- Use database full-text search for better performance
- Cache search results

---

## Performance Tips

1. **Cache EXIF data** after first extraction (store in database)
2. **Lazy load** thumbnails and video metadata
3. **Paginate** search results (20-50 items per page)
4. **Queue** video transcoding operations
5. **Compress** ZIP archives before download
6. **Index** frequently searched fields in database

---

## Security Reminders

✅ Always validate and sanitize user input
✅ Check file paths to prevent directory traversal  
✅ Validate user permissions before operations
✅ Use HTTPS for share links in production
✅ Rate limit bulk operations
✅ Remove sensitive EXIF data before public sharing

