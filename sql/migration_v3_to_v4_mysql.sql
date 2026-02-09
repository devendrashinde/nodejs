-- Migration Script: Photo Gallery v3.0 to v4.0
-- MySQL 8.0+ compatible
-- Adds playlist functionality to v3.0 database
-- Date: 2026-02-02

-- Safety check
SELECT 'Starting migration from v3.0 to v4.0...' as status;

-- ============================================
-- Verify existing tables from v3
-- ============================================
-- The migration relies on IF NOT EXISTS clauses for table creation
-- If this fails, ensure Photo Gallery v3.0 schema is already installed

-- ============================================
-- Create Playlists Table (NEW in v4)
-- ============================================
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Playlist name',
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Comma-separated playlist tags',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Playlist description',
  `item_count` int NOT NULL DEFAULT 0 COMMENT 'Number of items in playlist',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_playlist_name` (`name`(255)) COMMENT 'Unique playlist name',
  KEY `idx_item_count` (`item_count`) COMMENT 'Index for sorting by size',
  FULLTEXT KEY `idx_playlist_tags_fulltext` (`tags`) COMMENT 'Full-text search on playlist tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='User-created playlists for grouping media' AUTO_INCREMENT=1;

-- ============================================
-- Create Playlist Items Table (NEW in v4)
-- ============================================
-- Many-to-many relationship: playlists <-> photos
CREATE TABLE IF NOT EXISTS `playlist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playlist_id` int NOT NULL COMMENT 'Reference to playlist',
  `photo_id` int NOT NULL COMMENT 'Reference to photo/media',
  `position` int NOT NULL DEFAULT 0 COMMENT 'Order position in playlist',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_playlist_photo` (`playlist_id`, `photo_id`) COMMENT 'Prevent duplicates in playlist',
  KEY `idx_playlist_id` (`playlist_id`) COMMENT 'Index for playlist queries',
  KEY `idx_photo_id` (`photo_id`) COMMENT 'Index for photo queries',
  KEY `idx_position` (`playlist_id`, `position`) COMMENT 'Index for ordering items',
  CONSTRAINT `fk_playlist_items_playlist` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlist_items_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Media items in playlists (many-to-many relationship)' AUTO_INCREMENT=1;

-- ============================================
-- Update Schema Version
-- ============================================
-- Check if schema_version table exists (from previous migrations)
CREATE TABLE IF NOT EXISTS `schema_version` (
  `version` varchar(20) NOT NULL PRIMARY KEY,
  `applied_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `description` text
);

-- Record this migration
INSERT INTO `schema_version` (`version`, `description`) 
VALUES ('4.0', 'Added playlists and playlist_items tables for playlist functionality')
ON DUPLICATE KEY UPDATE `applied_at` = CURRENT_TIMESTAMP;

-- ============================================
-- Migration Complete
-- ============================================
SELECT 'Migration from v3.0 to v4.0 completed successfully!' as status;
SELECT * FROM `schema_version` WHERE `version` = '4.0';
