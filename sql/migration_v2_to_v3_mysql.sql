-- Photo Gallery Database Migration v2.0 to v3.0
-- MySQL 8.0+ Migration Script
-- Adds album tagging support
-- Created: 2026-02-09

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================
-- Migration Start - v2.0 to v3.0
-- ============================================
-- Purpose: Add album tagging capabilities
-- Changes:
--   1. Create albums table for album-level metadata
--   2. Add album tags support
--   3. Track schema version

USE `mydb`;

-- ============================================
-- Albums Table - Album metadata and tags
-- ============================================
-- This is the primary addition in v3.0
-- Allows tagging and organizing albums separately from photos

CREATE TABLE IF NOT EXISTS `albums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album name',
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Comma-separated album tags',
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album directory path',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Album description',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_album_name` (`name`(255)) COMMENT 'Unique album name',
  KEY `idx_album_path` (`path`(255)) COMMENT 'Index for path queries',
  FULLTEXT KEY `idx_album_tags_fulltext` (`tags`) COMMENT 'Full-text search on album tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Album metadata and tagging';

-- ============================================
-- Update Schema Version
-- ============================================

-- Insert new version record
INSERT INTO `schema_version` (`version`, `description`) VALUES 
('3.0.0', 'Added album tagging support with separate albums table')
ON DUPLICATE KEY UPDATE `applied_at` = CURRENT_TIMESTAMP;

-- ============================================
-- Migration Complete
-- ============================================
-- The migration has successfully created the albums table
-- and updated the schema version. Your application now supports:
--   - Album-level tagging
--   - Album descriptions
--   - Full-text search on album tags
--   - Separate album organization

SET foreign_key_checks = 1;

-- End of migration script
