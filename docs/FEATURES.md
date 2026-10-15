# Photo Gallery Features

**Complete list of implemented features and their current status.**

---

## Gallery & Browsing

### Sidebar Navigation
- Album and playlist lists use the remaining sidebar height and scroll independently of the search and navigation controls.
- The compact shortcut row includes **All**, a heart button for **Favorites**, and a clock button for **Recently Viewed**. Hover labels and accessible names identify the icon buttons.
- Recently viewed albums open in a separate scrollable dialog, so history never takes space from the album or playlist list. Select an album to open it, or use **Clear History** to clear recent history.
- Desktop uses a stable-width sidebar with compact rows and wrapping album names. On small screens, use the header navigation toggle to display the sidebar.

### Missing Media Record Cleanup
- Open the database maintenance menu in the gallery header, then **Missing Media Records**.
- **Scan Database** reports database records whose files are missing under `data/`, including nested albums and all media types. It does not modify records or files.
- Select individual missing entries or **Select All Missing**, then **Remove Selected** and confirm permanent database cleanup. Associated playlist memberships, favorites, and edit-history records are removed too; no media, edited-version files, thumbnails, or albums are deleted.
- Inaccessible paths, invalid locations, and broken album links are reported as **Blocked** and cannot be deleted. Ensure external drives and linked album storage are online before scanning and cleaning up.
- Each record's location and file absence are checked again immediately before deletion. Restored files and changed records are skipped. Cleanup uses transactions in batches of up to 250; a failed batch rolls back, while earlier successful batches remain committed.
- Reports expire after 30 minutes or a server restart; scan again if a report expires. The report table displays 100 records per page, and selection can span pages.
- Back up the database before permanent cleanup. This tool uses the app's existing access model; restrict access to trusted users.

**API:** `POST /api/maintenance/missing-media/scan` with JSON `{}` returns `scanId`, counts, and `entries`. `POST /api/maintenance/missing-media/clear` requires JSON `{ "scanId": "...", "ids": [123], "confirm": true }` and returns `deleted`, `deletedIds`, and `skipped`. Only missing IDs from that report are accepted. No schema or environment changes are required.

**Focused safety checks:** `node --test scripts/media-maintenance.test.js` uses temporary filesystem fixtures and a mock database; it never modifies gallery records.

### Basic Gallery View ✅
- Browse photos in organized albums
- Tag-based filtering and search
- Pagination (20 items per page by default)
- Grid and list view options

**Files:** `views/index.pug`, `app/controllers/photoController.js`

### Album Organization ✅
- Create, edit, delete albums
- Organize photos into albums
- Nested folder browsing (via `/data/` structure)
- Album metadata (name, description, photo count)

**Files:** `app/models/albumModel.js`, `app/controllers/photoController.js`

### Photo Viewing (Lightbox) ✅
- Fancybox 3.5.7 lightbox gallery
- Full-screen image viewing
- Navigation between photos
- Zoom and pan controls
- Mobile-friendly image display

**Files:** `public/main.js`, `views/index.pug`

### Tag Management ✅
- Auto-generated tags from filenames and EXIF
- Manual tag creation and editing
- Tag-based search and filtering
- Case-insensitive tag matching
- Bulk tag operations

**Files:** `app/models/tagModel.js`, `public/js/controllers/photoController.js`

---

## Image Processing

### Image Editing ✅
- Crop functionality
- Rotate (90°, 180°, 270°)
- Flip (horizontal, vertical)
- Filters (grayscale, sepia, etc.)
- Brightness and contrast adjustment
- Gaussian blur effect

**Implementation:** Sharp 0.34.5 (server-side)  
**Files:** `app/services/mediaService.js`, `public/js/image-editor.js`

### Thumbnail Generation ✅
- Automatic thumbnail generation for all photos
- PDF thumbnail extraction (from first page)
- Custom thumbnail storage in `temp-pic/`
- Configurable size (default 200x200px)
- Hash-based filename for cache busting

**Files:** `app/services/mediaService.js`, `scripts/cleanup-thumbnails.js`

### EXIF Data Extraction ✅
- Read EXIF metadata from photos
- Display camera, lens, settings
- Extract GPS coordinates (when available)
- Show photo date taken

**Files:** `app/services/exifService.js`

### Auto-Tagging ✅
- Select up to 100 files and use **AI Auto-Tag** in the bulk toolbar. JPEG, PNG, BMP, and GIF images are supported; other media types are reported as skipped.
- Local TensorFlow.js MobileNet classification is combined with filename, folder, and optional EXIF/date tags. The first supported image loads model weights from the internet; later predictions reuse the model in memory.
- The default AI confidence threshold remains 50%. Images without confident predictions can still receive metadata tags; if neither source provides tags, they are reported as **No tags found** rather than saved.
- Existing tags are merged and preserved. Files without a `photos` record receive a new record when tags are saved.
- Completion reports saved, failed, skipped, and no-tag counts with failure details. Model failures are not reported as successful tagging. Successful saves remain if another file fails.
- MobileNet recognizes ImageNet object categories; it is not OCR or a person-identification model. CPU inference can take time on large batches.

**API:** `GET /api/photos/autotag/batch` accepts `photoIds` as an encoded JSON array (legacy comma-separated selections remain supported). `POST` to the same route accepts `{ "photoIds": ["data/album/image.jpg"], "options": {} }`. Both stream progress and completion via SSE. Optional `confidenceThreshold` is 0-1 and `maxTags` is 1-100. Single-image tagging remains available at `POST /api/photos/autotag`.

**Focused checks:** `node --test scripts/auto-tagging.test.js` tests inference input, confidence filtering, error handling, tensor cleanup, and mixed batch outcomes without downloading a model or changing gallery tags.

**Files:** `app/services/autoTaggingService.js`, `app/controllers/advancedFeaturesController.js`, `public/js/bulk-operations.js`

### Video Support ✅
- Video file preview (thumbnail from first frame)
- Video metadata extraction
- FFmpeg integration for frame extraction
- Video filtering by type

**Files:** `app/services/videoService.js`, `public/main.js`

---

## Advanced Features

### Image Editing v2 ✅
- Modern editor with canvas-based editing
- Real-time preview
- Save edited version separately
- Non-destructive editing

**Status:** Full implementation v2.0  
**Database:** Migration v2→v2.1 adds `edited_photos` table (if needed)

### Playlists ✅
- Create named playlists
- Add/remove photos from playlists
- Sequential playback
- Playlist management (rename, edit tags, delete)
- Drag-and-drop reorder: `PUT /playlists/:playlistId/items/order` with `{ itemIds: [...] }` (full order of `playlist_items.id` values)
- Adding items already in the playlist is skipped, not an error
- Export playlist metadata

**Files:** `app/models/playlistModel.js`, `app/controllers/playlistController.js`

### Favorites ✅
- Mark photos as favorites
- Persistent storage across sessions
- Favorite-specific view
- Quick favorite toggle
- Favorite count tracking
- Bulk **Favorite** and **Unfavorite** persist the selected media paths and refresh the gallery hearts and count. Removing favorites while viewing Favorites also refreshes that view.
- Bulk Favorites accepts 1-1000 selected media paths per request; invalid paths are rejected before writing. Repeated additions do not create duplicate favorites.

**Files:** `app/models/favoriteModel.js`, `sql/favorites.sql`  
**Migration:** `scripts/migrate-favorites.js`

### Advanced Search ✅
- Search by filename
- Filter by tags
- Date range filtering
- Combined filter criteria
- Search result pagination

**Files:** `public/js/advanced-search.js`, `app/routes/advancedFeaturesRoutes.js`

### Bulk Operations ✅
- Bulk tag addition/removal
- Bulk delete with confirmation
- Select multiple photos
- Batch operations

**Files:** `public/js/bulk-operations.js`

---

## File & Upload Management

### Photo Upload ✅
- Browser-based upload interface
- Server-side file validation
- File size limits (default 100MB)
- Duplicate filename handling
- Automatic thumbnail generation on upload

**Files:** `app/controllers/photoController.js`, `server-photos.js`

### File Organization ✅
- Automatic folder scanning (`/data/` directory)
- Recursive folder browsing
- Album-to-folder mapping
- Dynamic photo discovery

**Files:** `app/services/photoScannerService.js`

### PDF Support ✅
- PDF viewing in browser (recently fixed for mobile)
- PDF thumbnail extraction
- PDF page count metadata
- Filename-based streaming (mobile compatibility fix)

**Status:** Mobile PDF viewing fixed (June 11, 2026)  
**URL Pattern:** `/pdf-stream/<filename>.pdf?id=<photoId>`

---

## Social & Sharing

### Social Features 📋 (Framework exists)
- Social metadata extraction (planned future use)
- Share buttons (framework in place)

**Files:** `public/js/social-features.js`

---

## Technical Infrastructure

### Caching ✅
- In-memory cache for album metadata
- JSON file cache for persistent storage
- TTL-based cache invalidation
- Manual cache clearing

**Files:** `server-photos.js`, `cache/` directory

### Logging ✅ (Configured but underused)
- Winston logger integration
- File and console output
- Structured logging format (planned)

**Files:** `app/config/logger.js`

### Database Migrations ✅
- Version-controlled schema changes
- Forward migrations: v1→v2→v2.1→v3→v4
- Rollback procedures documented
- Database backup before migration

**Files:** `sql/` directory

### API Endpoints
- RESTful photo API
- Album management
- Tag operations
- Playlist endpoints
- Favorites endpoints

**Documentation:** See [API.md](API.md) (to be created) or `docs/archive/DEPLOYMENT_CHECKLIST.md`

---

## Security Features

### Input Validation ⚠️ (Scattered, needs consolidation)
- Filename validation
- File type checking
- File size limits
- Database parameterized queries ✅

### Authentication 📋 (Framework exists)
- User model exists (`app/models/usersModel.js`)
- JWT support framework
- Password hashing (bcryptjs 2.4.3)

**Status:** Available but not fully implemented

### Rate Limiting 📋 (Library installed, not configured)
- express-rate-limit available
- Per-IP rate limiting (planned)
- Auth endpoint protection (planned)

---

## Completed but Documented Features

These features were significant implementations and have detailed documentation in `docs/archive/`:

1. **Image Editing (v2.0)** - Complete canvas-based editor
2. **Playlists** - Full playlist management
3. **Favorites** - Persistent favorite tracking
4. **Advanced Search** - Multi-criteria search with date ranges

---

## Known Limitations & Planned Improvements

### Current Limitations
- ❌ No automated tests (0% coverage)
- ❌ AngularJS frontend (end-of-life, security risk)
- ❌ No modern type system (TypeScript not used)
- ⚠️ PDF metadata in JSON files (should be in database)
- ⚠️ Logging inconsistent (Winston available but underused)

### Planned Improvements (See PROJECT_REVIEW.md)
1. Add Jest test framework
2. Migrate frontend to Vue 3 or React
3. Standardize logging
4. Add error handling middleware
5. Move metadata to database
6. Update database library (mysql → mysql2/promise)

---

## Feature Statistics

| Category | Count | Status |
|----------|-------|--------|
| Core Features | 8 | ✅ Complete |
| Advanced Features | 5 | ✅ Complete |
| Upload/Files | 3 | ✅ Complete |
| Technical | 4 | ⚠️ Partial |
| Social/Sharing | 2 | 📋 Framework only |
| **Total** | **22** | **15 Complete, 4 Partial, 2 Planned** |

---

## How Features Are Organized

```
Gallery Interface (AngularJS + Pug)
    ↓
Photo Model (Database queries)
    ↓
Photo Service (Business logic)
    ↓
Media Service (File processing)
    ↓
Sharp / FFmpeg / GraphicsMagick (External tools)
```

Each feature follows this pipeline for consistency.

---

**Last Updated:** June 11, 2026  
**For Implementation Details:** See `docs/archive/` or CHANGELOG.md  
**For Issues:** See PROJECT_REVIEW.md
