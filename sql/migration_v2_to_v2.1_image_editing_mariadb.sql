-- Photo Editions Table - Track image editing history
-- MariaDB Version - Supports non-destructive editing with version history
-- Migration: v2.1 - Add image editing support

CREATE TABLE IF NOT EXISTS `photo_editions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `photo_id` int NOT NULL,
  `version_number` int NOT NULL DEFAULT 1 COMMENT 'Sequential version number (1, 2, 3...)',
  `filename` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Edited filename with version',
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Directory path to edited file',
  `file_size` bigint DEFAULT NULL COMMENT 'File size in bytes',
  `width` int DEFAULT NULL COMMENT 'Image width in pixels',
  `height` int DEFAULT NULL COMMENT 'Image height in pixels',
  `edits_applied` json DEFAULT NULL COMMENT 'JSON array of edits applied',
  `is_original` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Is this the original unedited version',
  `is_current` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Is this the current active version',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this version was created',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_photo_id` (`photo_id`) COMMENT 'Index for looking up all versions of a photo',
  KEY `idx_version` (`photo_id`, `version_number`) COMMENT 'Index for finding specific version',
  KEY `idx_is_current` (`is_current`) COMMENT 'Index for finding current version',
  CONSTRAINT `fk_photo_editions_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Photo editing history and versions';

-- Add metadata columns to photos table for editing support
-- Note: Ignore errors if columns already exist
ALTER TABLE `photos` ADD COLUMN `width` int COMMENT 'Image width in pixels';
ALTER TABLE `photos` ADD COLUMN `height` int COMMENT 'Image height in pixels';
ALTER TABLE `photos` ADD COLUMN `file_size` bigint COMMENT 'File size in bytes';
ALTER TABLE `photos` ADD COLUMN `date_taken` datetime DEFAULT NULL COMMENT 'EXIF date taken';

-- Create indexes for image metadata
-- Note: Ignore errors if indexes already exist
ALTER TABLE `photos` ADD INDEX `idx_dimensions` (`width`, `height`);
ALTER TABLE `photos` ADD INDEX `idx_file_size` (`file_size`);
ALTER TABLE `photos` ADD INDEX `idx_date_taken` (`date_taken`);

-- Version tracking
INSERT INTO `schema_version` (`version`, `description`) VALUES ('2.1.0', 'Add photo_editions table for image editing support');
