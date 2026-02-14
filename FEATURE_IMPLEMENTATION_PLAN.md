# Feature Implementation Plan - Photo Gallery v2.1

**Start Date:** February 13, 2026  
**Features:** Advanced Organization | Image Editing | Advanced Filtering  
**Deployment Type:** In-house only

---

## 📋 FEATURE 1: ADVANCED ORGANIZATION

### 1.1 Smart Albums (Auto-Generated)
**Purpose:** Automatically group photos by date taken

#### Database Changes
```sql
-- New table for smart albums
CREATE TABLE `smart_albums` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `type` enum('by_date', 'by_tag', 'by_color', 'by_rating') NOT NULL,
  `criteria` json NOT NULL,
  `photo_count` int DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_smart_name` (`name`)
);

-- New table to track EXIF dates
ALTER TABLE `photos` ADD COLUMN `date_taken` datetime DEFAULT NULL;
ALTER TABLE `photos` ADD INDEX `idx_date_taken` (`date_taken`);
```

**Smart Album Types:**
- By Month (e.g., "February 2024", "January 2024")
- By Year (e.g., "2024", "2023")
- By Tag (auto-group by existing tags)
- By Color (requires image analysis)

#### Backend Implementation
- Add `SmartAlbumService` to analyze EXIF/file dates
- Rebuild smart albums on startup & monthly
- Endpoint: `GET /api/smart-albums` - list all
- Endpoint: `GET /api/smart-albums/:type/rebuild` - regenerate

#### Frontend
- New section: "Smart Albums" above regular albums
- Show: Month, Year, Tag-based groups
- Auto-update when photos are added/tagged

---

### 1.2 Collections/Folders (User-Created)
**Purpose:** Create custom groupings of albums

#### Database Changes
```sql
CREATE TABLE `collections` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `parent_id` int,
  `order` int DEFAULT 0,
  `is_expand` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_collection_name` (`name`),
  FOREIGN KEY (`parent_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE
);

CREATE TABLE `collection_albums` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `collection_id` int NOT NULL,
  `album_id` int NOT NULL,
  `order` int DEFAULT 0,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_coll_album` (`collection_id`, `album_id`),
  FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE CASCADE
);
```

**Features:**
- Create nested collections (folders within folders)
- Drag-and-drop to reorder albums
- Edit collection name/description
- Delete (only collection, not albums)

#### Backend Endpoints
- `POST /api/collections` - Create
- `GET /api/collections` - List all (hierarchical)
- `PUT /api/collections/:id` - Edit
- `DELETE /api/collections/:id` - Delete
- `POST /api/collections/:id/albums` - Add album
- `DELETE /api/collections/:id/albums/:albumId` - Remove album

#### Frontend
- Sidebar navigation showing collections tree
- Drag-drop areas for reordering
- Right-click context menu (Create, Rename, Delete)
- Expand/collapse arrow for nested collections

---

### 1.3 Custom Sorting

#### Database Changes
```sql
ALTER TABLE `albums` ADD COLUMN `sort_by` enum('name', 'date_created', 'date_modified', 'photo_count') DEFAULT 'name';
ALTER TABLE `albums` ADD COLUMN `sort_order` enum('asc', 'desc') DEFAULT 'asc';
```

**Sorting Options:**
- By Name (A-Z)
- By Date Created
- By Date Modified
- By Number of Photos
- Custom (manual order - drag-drop)

#### Backend
- Store user's preferred sort in album settings
- Apply during `GET /photos` response
- Endpoint: `PUT /api/albums/:id/sort-settings`

#### Frontend
- Dropdown in album header: "Sort by..."
- Remember user preference (localStorage)
- Icon showing current sort direction

---

### 1.4 Calendar View (Nice-to-Have)
**Purpose:** Navigate photos by date taken

#### Frontend Only (Leverage existing EXIF data)
- Show calendar widget in sidebar
- Click date to see photos from that day
- Highlight dates with photos
- Uses `date_taken` from EXIF/metadata

---

## 📸 FEATURE 2: IMAGE EDITING

### 2.1 Database Schema for Versions

```sql
CREATE TABLE `photo_editions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `photo_id` int NOT NULL,
  `version_number` int NOT NULL,
  `filename` varchar(500) NOT NULL,
  `path` varchar(1000) NOT NULL,
  `file_size` bigint,
  `width` int,
  `height` int,
  `edits_applied` json, -- stores edit history
  `is_original` tinyint(1) DEFAULT 0,
  `is_current` tinyint(1) DEFAULT 1,
  `created_by` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON DELETE CASCADE,
  KEY `idx_photo_version` (`photo_id`, `version_number`)
);
```

### 2.2 Supported Edits

#### Basic Edits (Phase 1 - Required)
- ✅ **Crop** - Select region, save as new version
- ✅ **Rotate** - 90°, 180°, 270° rotations
- ✅ **Resize** - Constrain proportions, select target size
- ✅ **Flip** - Horizontal, Vertical

#### Advanced Edits (Phase 2 - Optional)
- Brightness, Contrast, Saturation
- Grayscale conversion
- Basic filter effects

#### Implementation Strategy
- Use **Sharp.js** (already used for thumbnails) for image processing
- Save edited versions with suffix: `_v1.jpg`, `_v2.jpg`
- Keep original file intact
- Store edit metadata in JSON

### 2.3 Backend Image Processing Service

```javascript
// app/services/imageEditingService.js
class ImageEditingService {
  async crop(imagePath, coordinates, photoId)
  async rotate(imagePath, degrees, photoId)
  async resize(imagePath, width, height, photoId)
  async flip(imagePath, direction, photoId)
  async saveAsVersion(originalPhotoId, editedFile, editMetadata)
  async getVersionHistory(photoId)
  async restoreVersion(photoId, versionNumber)
}
```

### 2.4 Frontend Editor

#### UI Components
- Preview canvas showing current edit
- Tool buttons: Crop, Rotate, Resize, Flip
- Before/After comparison slider
- Version history panel (left sidebar)
- Save/Export options

#### Workflow
1. Click "Edit" on photo in Fancybox
2. Open editor modal with live preview
3. Apply edits (crop, rotate, etc.)
4. Preview changes
5. Click "Save as New Version" or "Save & Replace"
6. Photo updates in gallery

---

## 🔍 FEATURE 3: ADVANCED FILTERING

### 3.1 Database Schema

```sql
-- Add metadata columns to photos
ALTER TABLE `photos` ADD COLUMN `file_size` bigint;
ALTER TABLE `photos` ADD COLUMN `width` int;
ALTER TABLE `photos` ADD COLUMN `height` int;
ALTER TABLE `photos` ADD COLUMN `file_type` varchar(10);
ALTER TABLE `photos` ADD COLUMN `color_dominant` varchar(7); -- HEX color
ALTER TABLE `photos` ADD INDEX `idx_file_size` (`file_size`);
ALTER TABLE `photos` ADD INDEX `idx_dimensions` (`width`, `height`);

-- Duplicate detection table
CREATE TABLE `duplicate_groups` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `hash` varchar(64) NOT NULL, -- SHA256 of image content
  `is_deleted` tinyint(1) DEFAULT 0,
  `checked_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_hash` (`hash`)
);

CREATE TABLE `duplicate_photos` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `duplicate_group_id` int NOT NULL,
  `photo_id` int NOT NULL,
  `similarity_score` decimal(3,2), -- 0.00 to 1.00
  FOREIGN KEY (`duplicate_group_id`) REFERENCES `duplicate_groups`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON DELETE CASCADE
);
```

### 3.2 Filtering Options

#### Date Range Filter
- Slider: Start date → End date
- Show photos taken between dates
- Uses EXIF `date_taken` or file modification date

#### File Size Filter
- Range: 100KB to 50MB
- Filter out too-small or too-large files
- Show file size in results

#### Object Detection (Using Existing TensorFlow)
- Reuse `imageEditingService`'s TensorFlow capabilities
- Detect objects: "person", "cat", "dog", "car", "landscape", etc.
- Store detected objects in `photo_metadata` JSON
- Filter UI: Checkboxes for object types

#### Color-Based Search
- Color picker: Select color
- Find photos with dominant/secondary colors matching
- Result ranking by color match percentage

#### Duplicate Detection
- Button: "Find Duplicates"
- Shows groups of similar photos
- Batch delete duplicates
- Similarity slider (90%, 95%, 99%)

### 3.3 Backend Filtering Service

```javascript
// app/services/advancedFilterService.js
class AdvancedFilterService {
  async filterByDateRange(startDate, endDate)
  async filterByFileSize(minSize, maxSize)
  async filterByObjects(objectTypes)
  async filterByColor(hexColor, tolerance)
  async findDuplicates(similarityThreshold)
  async combineFilters(criteria) // AND all filters
}

// Endpoints
GET /api/photos/filter?dateStart=2024-01-01&dateEnd=2024-12-31&minSize=1000000&maxSize=50000000&objects=person,dog&color=%23FF5733
POST /api/photos/duplicates/scan
GET /api/photos/duplicates
```

### 3.4 Frontend Advanced Filter Panel

**Location:** Sidebar or collapsible panel above gallery

**Controls:**
- 📅 Date Range Picker (calendar input)
- 📏 File Size Slider (KB to MB)
- 🎨 Color Picker (select dominant color)
- 🤖 Object Detection Checkboxes
- 🔍 Duplicate Detection Button

**Results:**
- Live update as filters change
- Show match counts
- "Clear All Filters" button
- Save filter preset (optional)

---

## 🗺️ IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [x] Database migrations for all 3 features
- [x] Photo metadata extraction (dimensions, size, EXIF dates)
- [ ] Smart Album service & endpoints
- [ ] Collections service & endpoints

### Phase 2: Organization UI (Week 2)
- [ ] Collections sidebar navigation
- [ ] Smart Albums display
- [ ] Sorting UI in album header
- [ ] Drag-drop reordering

### Phase 3: Image Editing (Week 3-4)
- [ ] Image processing service (crop, rotate, resize)
- [ ] Photo versions database & tracking
- [ ] Editor modal UI with preview
- [ ] Version history & restore

### Phase 4: Advanced Filtering (Week 5-6)
- [ ] Filter service & endpoints
- [ ] Duplicate detection algorithm
- [ ] Filter UI components
- [ ] Object detection (TensorFlow integration)
- [ ] Color search implementation

### Phase 5: Polish & Testing (Week 7)
- [ ] Performance optimization
- [ ] Error handling & edge cases
- [ ] User testing & feedback
- [ ] Documentation

---

## 📊 ESTIMATED EFFORT

| Feature | Components | Effort | Priority |
|---------|-----------|--------|----------|
| Smart Albums | 1 service, 2 endpoints, 1 UI section | 20 hrs | HIGH |
| Collections | 1 service, 4 endpoints, 1 sidebar UI | 25 hrs | HIGH |
| Custom Sorting | Config storage, 1 endpoint, UI dropdown | 8 hrs | MEDIUM |
| Image Editing | 1 service, 3 endpoints, 1 modal UI | 35 hrs | HIGH |
| Advanced Filtering | 1 service, 5 endpoints, 1 panel UI | 30 hrs | HIGH |
| **TOTAL** | | **~118 hours** | |

**Recommended Team:** 1-2 developers, 8 weeks part-time

---

## 🔧 TECHNICAL STACK

**Backend:**
- Node.js + Express (existing)
- Sharp.js (image processing)
- TensorFlow.js (object detection - existing)
- MySQL/MariaDB (existing)

**Frontend:**
- AngularJS (existing)
- Bootstrap 5 (existing)
- Fancybox 3 (existing for editing trigger)
- Canvas API (crop preview)

---

## 📝 SUCCESS CRITERIA

✅ Smart albums auto-generate and update  
✅ Collections allow nested grouping  
✅ Images can be edited without losing originals  
✅ Filter combinations work reliably  
✅ Duplicate detection finds similar images  
✅ Performance remains <2s for gallery load  
✅ All features work on in-house network only  

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Status:** Ready for Implementation
