# Advanced Features Implementation Guide

Photo Gallery v3.0 introduces powerful new features for managing, editing, and sharing photos. This document covers all new functionality added.

## 📋 Table of Contents

1. [EXIF Data Handling](#exif-data-handling)
2. [Advanced Search](#advanced-search)
3. [Bulk Operations](#bulk-operations)
4. [Social Features](#social-features)
5. [Image Editing](#image-editing)
6. [Video Enhancements](#video-enhancements)
7. [API Endpoints](#api-endpoints)

---

## EXIF Data Handling

Extract and display comprehensive EXIF metadata from photos including camera info, location data, and shooting parameters.

### Features

- **Camera Information**: Model, make, lens, serial number
- **Shooting Parameters**: ISO, aperture, exposure time, focal length, flash status
- **Image Properties**: Dimensions, orientation, color space, white balance
- **Location Data**: GPS coordinates with Google Maps link
- **Copyright Information**: Artist, photographer, copyright details

### Usage Example

```javascript
import ExifService from './app/services/exifService.js';

// Extract EXIF data from photo
const exifData = ExifService.extractExifData('/path/to/photo.jpg');

// Get readable summary
const summary = ExifService.getSummary(exifData);
// Output: "📷 Canon EOS R | 📅 2024-01-15 10:30:45 | 🔍 50.0mm | f/2.0 | 📍 40.7128, -74.0060"

// Search EXIF data
const found = ExifService.searchExifData(exifData, 'Canon');

// Filter by criteria
const indices = ExifService.filterByExif(exifDataArray, {
    cameraModel: 'Canon EOS R',
    dateFrom: '2024-01-01T00:00:00Z',
    dateTo: '2024-12-31T23:59:59Z',
    focalLengthMin: 35,
    focalLengthMax: 85
});
```

### API Endpoints

```bash
# Get EXIF data for a photo
GET /api/photos/{photoId}/exif

# Response
{
    "exif": {
        "camera": {
            "make": "Canon",
            "model": "Canon EOS R",
            "lens": "RF 50mm F1.8",
            "serialNumber": "ABC123"
        },
        "shooting": {
            "dateTime": { "iso": "2024-01-15T10:30:45Z", "display": "2024:01:15 10:30:45" },
            "iso": 400,
            "fNumber": "f/2.0",
            "exposureTime": "1/500",
            "focalLength": "50.0mm",
            "flash": "Off"
        },
        "image": {
            "width": 6000,
            "height": 4000,
            "orientation": "Normal"
        },
        "location": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "mapUrl": "https://maps.google.com/maps?q=40.7128,-74.0060"
        }
    },
    "summary": "📷 Canon EOS R | 📅 2024-01-15 10:30:45 | 🔍 50.0mm | f/2.0 | 📍 40.7128, -74.0060"
}
```

---

## Advanced Search

Comprehensive search with multiple filter types and full-text capabilities.

### Search Capabilities

- **Full-text search**: Search across name, tags, album, description
- **Tag filtering**: Single or multiple tags with AND/OR logic
- **Date range**: Filter by date created or taken
- **File type**: Filter by image/video format
- **Album filtering**: Search within specific album
- **Size range**: Filter by file size
- **Sorting**: By name, date, size, album, or rating
- **Autocomplete**: Get suggestions for tags, albums, photographers

### Usage Example

```javascript
import AdvancedSearchService from './app/services/searchService.js';

// Basic full-text search
const results = AdvancedSearchService.search(photos, {
    query: 'sunset',
    sortBy: 'date',
    sortOrder: 'desc'
});

// Advanced search with multiple filters
const results = AdvancedSearchService.search(photos, {
    query: 'nature',
    tags: ['landscape', 'mountains'],
    tagMatchMode: 'all', // Match ALL tags (or 'any')
    dateFrom: '2024-01-01T00:00:00Z',
    dateTo: '2024-12-31T23:59:59Z',
    fileTypes: ['jpg', 'png'],
    album: 'Nature',
    minSize: 1000000, // 1MB
    maxSize: 50000000, // 50MB
    sortBy: 'date',
    sortOrder: 'desc'
});

// Get search suggestions
const suggestions = AdvancedSearchService.getSuggestions(
    photos,
    'nat', // prefix
    'tags' // field: tags, album, photographer, camera
);
// Output: ['nature', 'natural', 'native', ...]

// Get search statistics
const stats = AdvancedSearchService.getStatistics(photos);
// {
//   totalPhotos: 1250,
//   albums: ['Nature', 'Travel', ...],
//   tags: ['landscape', 'sunset', ...],
//   fileTypes: ['jpg', 'png', 'mp4', ...],
//   cameras: ['Canon EOS R', 'Nikon D850', ...],
//   dateRange: { earliest: '...', latest: '...' },
//   totalSizeMB: 5430.25
// }
```

### API Endpoints

```bash
# Advanced search
GET /api/search?q=sunset&tags=landscape,nature&dateFrom=2024-01-01&dateTo=2024-12-31&types=jpg,png&sort=date&order=desc

# Get search suggestions
GET /api/search/suggestions?prefix=nat&field=tags

# Response
{
    "results": [...],
    "count": 45,
    "statistics": {
        "totalPhotos": 1250,
        "albums": [...],
        "tags": [...],
        ...
    }
}
```

---

## Bulk Operations

Perform operations on multiple photos at once.

### Supported Operations

- **Bulk tagging**: Add or remove tags from multiple photos
- **Bulk favoriting**: Mark/unmark multiple photos as favorite
- **Bulk rating**: Apply rating to multiple photos
- **Bulk delete**: Delete multiple photos at once
- **Bulk move**: Move photos to different album
- **Bulk download**: Download multiple photos as ZIP archive

### Usage Example

```javascript
import BulkOperationsService from './app/services/bulkOperationsService.js';

// Bulk add tags
const batch = BulkOperationsService.bulkAddTags(
    ['photo1', 'photo2', 'photo3'],
    ['vacation', 'beach'],
    photos
);
// {
//   id: 'batch-123',
//   status: 'completed',
//   total: 3,
//   results: [
//     { photoId: 'photo1', success: true, addedTags: ['vacation', 'beach'] },
//     ...
//   ]
// }

// Bulk favorite
const batch = BulkOperationsService.bulkFavorite(
    ['photo1', 'photo2'],
    'user123'
);

// Bulk rating
const batch = BulkOperationsService.bulkRate(
    ['photo1', 'photo2', 'photo3'],
    'user123',
    5 // Rating 1-5
);

// Prepare bulk download
const downloadInfo = BulkOperationsService.prepareBulkDownload(
    ['photo1', 'photo2', 'photo3', 'video1'],
    photos
);
// {
//   zipFilename: 'photos-1234567890.zip',
//   totalFiles: 4,
//   totalSize: 52428800, // 50MB
//   batchId: 'download-123'
// }

// Create ZIP archive
const zipPath = await BulkOperationsService.createZipArchive(
    ['/path/to/photo1.jpg', '/path/to/photo2.jpg'],
    './downloads/photos.zip'
);
```

### API Endpoints

```bash
# Bulk add tags
POST /api/bulk/tags
{
    "photoIds": ["photo1", "photo2"],
    "tags": ["vacation", "beach"]
}

# Bulk remove tags
POST /api/bulk/tags/remove
{
    "photoIds": ["photo1", "photo2"],
    "tags": ["old-tag"]
}

# Bulk favorite
POST /api/bulk/favorite
{
    "photoIds": ["photo1", "photo2"],
    "isFavorite": true
}

# Bulk rate
POST /api/bulk/rate
{
    "photoIds": ["photo1", "photo2"],
    "rating": 4
}

# Prepare bulk download
POST /api/bulk/download
{
    "photoIds": ["photo1", "photo2"]
}
```

---

## Social Features

Manage comments, ratings, favorites, and sharing.

### Features

- **Comments**: Add comments to photos with nested replies
- **Ratings**: 1-5 star rating system with statistics
- **Favorites**: Mark photos as favorites
- **Share Links**: Generate time-limited shareable links
- **Album Sharing**: Create public/private shared albums
- **Access Control**: Fine-grained permission management

### Usage Example

```javascript
import SocialFeaturesService from './app/services/socialFeaturesService.js';

// Add comment
const comment = SocialFeaturesService.addComment('photo1', {
    userId: 'user123',
    text: 'Beautiful sunset shot!',
    userName: 'John Doe'
});

// Add reply to comment
const reply = SocialFeaturesService.addCommentReply('comment1', {
    userId: 'user456',
    text: 'Thanks! Great location.',
    userName: 'Jane Doe'
});

// Rate photo
const rating = SocialFeaturesService.addRating('photo1', 'user123', 4);

// Toggle favorite
const favorite = SocialFeaturesService.toggleFavorite('photo1', 'user123', true);

// Generate share link
const shareLink = SocialFeaturesService.generateShareLink('photo1', {
    expiresIn: 1440, // 24 hours
    viewerName: 'My Friends'
});
// {
//   id: 'share-123',
//   photoId: 'photo1',
//   url: '/shared/abc123def456...',
//   expiresAt: '2024-01-20T10:30:00Z',
//   createdAt: '2024-01-19T10:30:00Z'
// }

// Create shared album
const shareLink = SocialFeaturesService.generateAlbumShareLink(
    ['photo1', 'photo2', 'photo3'],
    {
        expiresIn: 2880, // 48 hours
        albumName: 'Vacation 2024'
    }
);

// Create album with access control
const album = SocialFeaturesService.createAlbum({
    name: 'Family Photos',
    ownerId: 'user123',
    isPublic: false
});

// Calculate rating statistics
const stats = SocialFeaturesService.calculateRatingStats([
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 3 }
]);
// { average: 4.3, count: 4, distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 } }

// Get activity summary
const activity = SocialFeaturesService.getActivitySummary(photo);
// {
//   totalComments: 12,
//   totalLikes: 45,
//   averageRating: 4.7,
//   totalRatings: 30,
//   shares: 8,
//   activityScore: 182
// }
```

### API Endpoints

```bash
# Add comment
POST /api/photos/{photoId}/comments
{
    "text": "Great photo!"
}

# Get comments
GET /api/photos/{photoId}/comments

# Rate photo
POST /api/photos/{photoId}/ratings
{
    "rating": 4
}

# Get rating stats
GET /api/photos/{photoId}/ratings

# Toggle favorite
POST /api/photos/{photoId}/favorite
{
    "isFavorite": true
}

# Generate share link
POST /api/photos/{photoId}/share
{
    "expiresIn": 1440
}

# Get activity summary
GET /api/photos/{photoId}/activity

# Share album
POST /api/albums/share
{
    "photoIds": ["photo1", "photo2"],
    "expiresIn": 2880
}

# Access public shared album
GET /api/albums/{shareToken}/public
```

---

## Image Editing

Edit photos with rotation, flipping, cropping, filters, and adjustments.

### Supported Operations

- **Rotate**: 90°, 180°, 270° rotations
- **Flip**: Horizontal and vertical flipping
- **Crop**: Crop to specified dimensions
- **Resize**: Resize with fit options
- **Filters**: Sepia, grayscale, solarize, sharpen, blur, emboss, charcoal, negate
- **Brightness/Contrast**: Adjust brightness (-100 to +100) and contrast (-100 to +100)

### Available Filters

- **Sepia Tone**: Warm, vintage look
- **Grayscale**: Black and white conversion
- **Solarize**: Psychedelic effect
- **Negate**: Inverted colors
- **Sharpen**: Enhance details
- **Blur**: Soften image
- **Emboss**: 3D effect
- **Charcoal**: Artistic drawing effect

### Usage Example

```javascript
import ImageEditingService from './app/services/imageEditingService.js';

// Rotate photo
const rotated = await ImageEditingService.rotate('/path/to/photo.jpg', 90);

// Flip photo
const flipped = await ImageEditingService.flip('/path/to/photo.jpg', 'horizontal');

// Crop photo
const cropped = await ImageEditingService.crop('/path/to/photo.jpg', {
    x: 100,
    y: 50,
    width: 300,
    height: 300
});

// Apply filter
const sepia = await ImageEditingService.applyFilter('/path/to/photo.jpg', 'sepia');

// Adjust brightness and contrast
const adjusted = await ImageEditingService.adjustBrightnessContrast(
    '/path/to/photo.jpg',
    { brightness: 20, contrast: -10 }
);

// Apply multiple edits
const edited = await ImageEditingService.applyMultipleEdits('/path/to/photo.jpg', [
    { type: 'rotate', degrees: 90 },
    { type: 'crop', options: { x: 0, y: 0, width: 800, height: 600 } },
    { type: 'filter', filterType: 'sharpen' },
    { type: 'brightness-contrast', options: { brightness: 10, contrast: 5 } }
]);

// Save edited photo
await ImageEditingService.saveEdited(edited, '/path/to/output.jpg', true);

// Get available filters
const filters = ImageEditingService.getAvailableFilters();
// [
//   { name: 'sepia', label: 'Sepia Tone' },
//   { name: 'grayscale', label: 'Grayscale' },
//   ...
// ]
```

### API Endpoints

```bash
# Get available filters
GET /api/filters

# Rotate photo
POST /api/photos/{photoId}/rotate
{
    "degrees": 90
}

# Flip photo
POST /api/photos/{photoId}/flip
{
    "direction": "horizontal"
}

# Crop photo
POST /api/photos/{photoId}/crop
{
    "x": 100,
    "y": 50,
    "width": 300,
    "height": 300
}

# Apply filter
POST /api/photos/{photoId}/filter
{
    "filterType": "sepia"
}

# Adjust brightness/contrast
POST /api/photos/{photoId}/adjust
{
    "brightness": 20,
    "contrast": -10
}

# Apply multiple edits
POST /api/photos/{photoId}/edit
{
    "edits": [
        { "type": "rotate", "degrees": 90 },
        { "type": "filter", "filterType": "sepia" }
    ]
}
```

---

## Video Enhancements

Advanced video handling with metadata extraction, transcoding, and quality options.

### Features

- **Metadata Extraction**: Full video information including codec, resolution, duration
- **Multiple Qualities**: Generate 360p, 480p, 720p, 1080p versions
- **Thumbnail Generation**: Extract frame at any timestamp
- **Video Validation**: Check format, size, and duration
- **Streaming Config**: Get streaming options for video players
- **Codec Recommendations**: Best practices for different scenarios

### Video Qualities

| Quality | Bitrate | Resolution | Use Case |
|---------|---------|------------|----------|
| 360p    | 500k    | 640x360    | Mobile, slow connections |
| 480p    | 1000k   | 854x480    | Standard quality |
| 720p    | 2500k   | 1280x720   | HD, good quality |
| 1080p   | 5000k   | 1920x1080  | Full HD, high quality |

### Usage Example

```javascript
import VideoEnhancementService from './app/services/videoEnhancementService.js';

// Extract metadata
const metadata = await VideoEnhancementService.extractMetadata('/path/to/video.mp4');
// {
//   file: {
//     duration: 120.5,
//     size: 52428800,
//     bitrate: 3500000,
//     format: 'mp4'
//   },
//   video: {
//     codec: 'h264',
//     width: 1920,
//     height: 1080,
//     fps: 30,
//     aspectRatio: '16:9'
//   },
//   audio: {
//     codec: 'aac',
//     channels: 2,
//     sampleRate: 48000
//   }
// }

// Generate thumbnail at specific timestamp
const thumbPath = await VideoEnhancementService.generateThumbnail(
    '/path/to/video.mp4',
    {
        timestamp: '00:00:15', // 15 seconds
        width: 320,
        height: 240,
        outputPath: './thumbnails/video_thumb.jpg'
    }
);

// Generate multiple quality versions
const encodings = await VideoEnhancementService.encodeVideoQualities(
    '/path/to/video.mp4',
    {
        outputDir: './videos/encoded',
        qualities: ['720p', '1080p']
    }
);

// Get streaming configuration
const streamConfig = VideoEnhancementService.getStreamingConfig(
    '/videos/original.mp4',
    encodings
);
// {
//   primary: { src: '/videos/original.mp4', type: 'video/mp4' },
//   qualities: [
//     { src: '/videos/720p.mp4', label: '720p', bitrate: '2500k' },
//     { src: '/videos/1080p.mp4', label: '1080p', bitrate: '5000k' }
//   ],
//   poster: '/videos/original.mp4_thumb.jpg'
// }

// Validate video
const validation = await VideoEnhancementService.validateVideo(
    '/path/to/video.mp4',
    {
        maxDuration: 3600, // 1 hour
        maxSize: 5000000000, // 5GB
        allowedFormats: ['mp4', 'webm', 'mov']
    }
);

// Format duration for display
const duration = VideoEnhancementService.formatDuration(120.5);
// "2:00"

// Get codec recommendations
const codecs = VideoEnhancementService.getCodecRecommendations();
// {
//   web: { video: 'libx264', audio: 'aac', ... },
//   streaming: { video: 'libx264', audio: 'aac', ... }
// }
```

### API Endpoints

```bash
# Get video metadata
GET /api/videos/{videoId}/metadata

# Get available qualities
GET /api/videos/qualities

# Get codec recommendations
GET /api/videos/codecs

# Generate thumbnail
POST /api/videos/{videoId}/thumbnail
{
    "timestamp": "00:00:15",
    "width": 320,
    "height": 240
}

# Transcode to different quality
POST /api/videos/{videoId}/transcode
{
    "quality": "720p"
}

# Get streaming options
GET /api/videos/{videoId}/stream
```

---

## Installation & Setup

### Install Dependencies

```bash
npm install
```

New packages required:
- `exif-parser` - EXIF data extraction
- `archiver` - ZIP file creation

### Environment Configuration

Update `.env` file:

```env
# Advanced Features
EXIF_ENABLED=true
BULK_OPERATIONS_MAX=1000
SHARE_LINK_DEFAULT_EXPIRY=1440
VIDEO_TRANSCODING_ENABLED=true
```

### Database Schema Update

For storing social data, comments, and favorites, update your database:

```sql
-- Comments table
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    INDEX (photo_id)
);

-- Ratings table
CREATE TABLE ratings (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_photo (user_id, photo_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    INDEX (photo_id)
);

-- Favorites table
CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_photo (user_id, photo_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id)
);

-- Share links table
CREATE TABLE share_links (
    id VARCHAR(36) PRIMARY KEY,
    photo_id VARCHAR(36),
    album_id VARCHAR(36),
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT DEFAULT 0
);
```

---

## Performance Considerations

- **EXIF Extraction**: Can be slow for large images. Consider caching results.
- **Video Transcoding**: CPU-intensive operation. Use background job queue for production.
- **Full-text Search**: Use database full-text indexes for better performance.
- **ZIP Creation**: Stream large files to avoid memory issues.
- **Bulk Operations**: Process in batches of 100-500 items.

---

## Security Best Practices

1. **Path Validation**: Always sanitize file paths to prevent directory traversal
2. **File Validation**: Verify file type and size before processing
3. **Access Control**: Validate user permissions before operations
4. **Share Link Security**: Use cryptographic tokens with expiration
5. **Rate Limiting**: Implement rate limiting on bulk operations and editing
6. **EXIF Privacy**: Consider removing EXIF before public sharing

---

## Future Enhancements

- Machine learning-based tagging and search
- Real-time collaborative editing
- Advanced video effects and transitions
- AI-powered photo enhancement
- Cloud storage integration
- Multi-language support for metadata

