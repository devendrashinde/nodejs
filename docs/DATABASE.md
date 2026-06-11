# Photo Gallery Database Schema

**Database setup, tables, migrations, and metadata strategy.**

---

## Database Configuration

### Connection Settings

**File:** `app/models/db.js`

```javascript
const pool = createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'photos',
    database: process.env.DB_NAME || 'mydb',
    multipleStatements: true,
    waitForConnections: true,
    enableKeepAlive: true
});
```

### Environment Variables

**File:** `.env.example`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=photos
DB_NAME=mydb
DB_CONNECTION_LIMIT=10
```

### Connection Pooling

- **Pool Size:** 10 connections
- **Behavior:** Waits for available connection
- **Keep-Alive:** Enabled to prevent disconnects
- **Error Handling:** Automatic reconnection on connection loss

---

## Schema Overview

### Current Tables

| Table | Purpose | Rows |
|-------|---------|------|
| `photos` | Photo metadata | Main storage |
| `albums` | Album groupings | Organization |
| `tags` | Photo tags | Classification |
| `favorites` | Favorite photos | User preferences |
| `playlists` | Photo sequences | Collections |
| `users` | User accounts | Auth (partial) |
| `tasks` | Background tasks | Job queue |

### Core Tables

#### `photos`
```sql
CREATE TABLE photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(255) UNIQUE NOT NULL,
  album_id INT,
  type ENUM('image', 'video', 'document') DEFAULT 'image',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
  INDEX idx_album (album_id),
  INDEX idx_created (created_at)
);
```

**Notes:**
- `path` is unique per photo file
- `metadata` JSON column stores EXIF and custom data
- Albums are optional (photos can exist without albums)

#### `albums`
```sql
CREATE TABLE albums (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES albums(id) ON DELETE CASCADE,
  INDEX idx_parent (parent_id)
);
```

**Notes:**
- Hierarchical with `parent_id` for folder nesting
- Linked to photos via foreign key

#### `tags`
```sql
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  photo_id INT NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  tag_type ENUM('manual', 'auto', 'exif') DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tag (photo_id, tag_name),
  INDEX idx_tag_name (tag_name)
);
```

**Notes:**
- Multiple tags per photo
- `tag_type` tracks origin (manual, auto-generated, EXIF)
- Case-insensitive tag matching via MySQL collation

#### `favorites`
```sql
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  photo_id INT NOT NULL UNIQUE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  INDEX idx_added (added_at)
);
```

**Notes:**
- Simple one-to-one with photos
- Timestamp tracks when favorited

#### `playlists`
```sql
CREATE TABLE playlists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
);
```

#### `playlist_photos` (join table)
```sql
CREATE TABLE playlist_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  playlist_id INT NOT NULL,
  photo_id INT NOT NULL,
  sequence INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_entry (playlist_id, photo_id),
  INDEX idx_sequence (playlist_id, sequence)
);
```

---

## Metadata Storage Strategy

### Current State ⚠️ (PLANNED FOR IMPROVEMENT)

**Metadata is stored in THREE places:**

1. **Database** - Photo basic info, tags, favorites
2. **JSON Files** - Album cache, PDF thumbnail mapping
3. **File System** - Generated thumbnails in `temp-pic/`

This causes:
- ❌ Data consistency issues
- ❌ Hard to query by metadata
- ❌ Loss of data if JSON files deleted
- ❌ Slow searches requiring file system operations

### Proposed Solution (Phase 2)

Add metadata columns to `photos` table:

```sql
ALTER TABLE photos ADD COLUMN (
  thumbnail_path VARCHAR(255) NULL,
  thumbnail_type ENUM('auto', 'custom_pdf', 'custom_image') DEFAULT 'auto',
  thumbnail_generated_at TIMESTAMP NULL,
  file_size INT NULL,
  dimensions JSON NULL,  -- {"width": 1920, "height": 1080}
  exif_data JSON NULL,
  processing_status ENUM('pending', 'complete', 'error') DEFAULT 'pending'
);
```

**Benefits:**
- Single source of truth
- Queryable: "Find all photos with custom thumbnails"
- Automatic backup with database
- Better performance with indexing

### JSON File Cache (To Be Deprecated)

**Current files:**
- `cache/album-cache.json` - Cached album listings
- `cache/pdf-thumbnail-map.json` - PDF thumbnail associations

**Migration path:**
1. Read JSON files at startup
2. Populate database tables
3. Update code to query database instead
4. Archive JSON files

---

## Migrations

### Version History

| From | To | Reason | Date | File |
|------|----|---------| -----|------|
| v1 | v2 | Schema expansion | Initial | `migration_v1_to_v2.sql` |
| v2 | v2.1 | Image editing | 2024 | `migration_v2_to_v2.1_image_editing.sql` |
| v2 | v3 | Playlists | 2024 | `migration_v2_to_v3.sql` (MariaDB variant) |
| v3 | v4 | Advanced features | 2024 | `migration_v3_to_v4_*.sql` |

### Migration Files Location

```
sql/
├── migration_v1_to_v2.sql
├── migration_v1_to_v2_mariadb.sql
├── migration_v2_to_v2.1_image_editing.sql
├── migration_v2_to_v2.1_image_editing_mariadb.sql
├── migration_v2_to_v3_mysql.sql
├── migration_v2_to_v3_mariadb.sql
├── migration_v3_to_v4_mysql.sql
├── migration_v3_to_v4_mariadb.sql
└── DEPLOYMENT.md
```

### Running Migrations

```bash
# Backup first!
mysqldump -u root -p mydb > backup_before_migration.sql

# Run migration for your database
mysql -u root -p mydb < sql/migration_vX_to_vY_mysql.sql

# Or for MariaDB
mysql -u root -p mydb < sql/migration_vX_to_vY_mariadb.sql

# Verify
mysql -u root -p mydb -e "SHOW TABLES;"
```

### Creating New Migrations

1. **Never modify existing migration files** - they've already been run
2. **Create new file** with incremental version: `migration_v4_to_v4.1_feature.sql`
3. **Keep changes minimal** - one feature per file
4. **Test on dev database first**
5. **Update DEPLOYMENT_CHECKLIST.md** with new migration step

Example:
```sql
-- migration_v4_to_v4.1_custom_thumbnails.sql
ALTER TABLE photos ADD COLUMN (
  thumbnail_type ENUM('auto', 'custom') DEFAULT 'auto',
  thumbnail_generated_at TIMESTAMP NULL
);

CREATE INDEX idx_thumbnail_type ON photos(thumbnail_type);
```

---

## Query Examples

### Common Queries

```sql
-- Get all photos in album
SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC;

-- Get photos with specific tag
SELECT DISTINCT p.* FROM photos p
JOIN tags t ON p.id = t.photo_id
WHERE t.tag_name = ? ORDER BY p.created_at DESC;

-- Get favorite photos
SELECT p.* FROM photos p
JOIN favorites f ON p.id = f.photo_id
ORDER BY f.added_at DESC;

-- Get photos in playlist
SELECT p.* FROM photos p
JOIN playlist_photos pp ON p.id = pp.photo_id
WHERE pp.playlist_id = ? ORDER BY pp.sequence ASC;

-- Search photos by name
SELECT * FROM photos WHERE name LIKE ? ORDER BY created_at DESC;

-- Get albums with photo counts
SELECT a.id, a.name, COUNT(p.id) as photo_count
FROM albums a
LEFT JOIN photos p ON a.id = p.album_id
GROUP BY a.id ORDER BY a.name;
```

### Performance Tips

1. **Always use indexes** on frequently-queried columns:
   ```sql
   CREATE INDEX idx_album ON photos(album_id);
   CREATE INDEX idx_tag_name ON tags(tag_name);
   CREATE INDEX idx_created ON photos(created_at);
   ```

2. **Use LIMIT for pagination:**
   ```sql
   SELECT * FROM photos ORDER BY created_at DESC LIMIT 20 OFFSET 0;
   ```

3. **Avoid SELECT \*** when you only need specific columns:
   ```sql
   SELECT id, name, path FROM photos;  -- Better
   ```

---

## Database Backup & Recovery

### Automatic Backup

```bash
# Schedule with cron (Linux/Mac)
0 2 * * * mysqldump -u root -p mydb > /backups/mydb_$(date +\%Y\%m\%d).sql

# Or on Windows with Task Scheduler
# Run: mysqldump -u root -p mydb > C:\backups\mydb_%date:~10,4%%date:~4,2%%date:~7,2%.sql
```

### Manual Backup

```bash
mysqldump -u root -p mydb > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
mysql -u root -p mydb < backup_20240611_143022.sql
```

### Verify Backup Integrity

```bash
# Check backup file size (should be reasonable)
ls -lh backup_*.sql

# Test restore on separate database
mysql -u root -p -e "CREATE DATABASE mydb_restore;"
mysql -u root -p mydb_restore < backup_20240611_143022.sql
mysql -u root -p mydb_restore -e "SHOW TABLES;"
```

---

## Database Maintenance

### Regular Tasks

```bash
# Check for corrupt tables
mysqlcheck -u root -p mydb

# Optimize tables
mysqloptimize -u root -p mydb

# Analyze tables for query optimization
mysqlanalyze -u root -p mydb
```

### Check Connection Status

```javascript
// In Node.js
import { query } from './app/models/db.js';
try {
  const result = await query('SELECT 1');
  console.log('✓ Database connected');
} catch (err) {
  console.error('✗ Database error:', err.message);
}
```

---

## Future Improvements

### Phase 2 (Recommended)
- [ ] Move thumbnail metadata to database (from JSON files)
- [ ] Add `thumbnail_path`, `thumbnail_type`, `file_size` columns to photos
- [ ] Index frequently-queried columns for performance
- [ ] Update database library from `mysql` to `mysql2/promise`

### Phase 3+
- [ ] Add photo geolocation table (GPS from EXIF)
- [ ] Implement photo collections (similar to playlists)
- [ ] Add photo modification history (audit trail)
- [ ] Consider NoSQL for unstructured metadata (MongoDB for EXIF variants)

---

**Last Updated:** June 11, 2026  
**Database Version:** v4 (current)  
**Next Migration:** v4 → v4.1 (metadata improvements)

See [DEVELOPMENT.md](DEVELOPMENT.md) for schema queries and examples.
