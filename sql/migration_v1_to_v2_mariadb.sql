-- Photo Gallery v1.0 to v2.0 Database Migration - MariaDB Version
-- This script upgrades existing MariaDB database schema without data loss
-- IMPORTANT: Backup your database before running this script!
-- 
-- Usage: mysql -u root -p mydb < migration_v1_to_v2_mariadb.sql
-- Created: 2026-02-02

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

USE `mydb`;

-- ============================================
-- Step 1: Backup existing data (within database)
-- ============================================
-- Create temporary backup tables
DROP TABLE IF EXISTS `photos_backup`;
CREATE TABLE `photos_backup` AS SELECT * FROM `photos`;

DROP TABLE IF EXISTS `tags_backup`;
CREATE TABLE `tags_backup` AS SELECT * FROM `tags`;

DROP TABLE IF EXISTS `users_backup`;
CREATE TABLE `users_backup` AS SELECT * FROM `users`;

SELECT '✓ Backup tables created' AS Status;

-- ============================================
-- Step 2: Migrate Photos Table
-- ============================================

-- Create new photos table with updated schema
DROP TABLE IF EXISTS `photos_new`;
CREATE TABLE `photos_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Photo filename',
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Comma-separated tags',
  `album` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album name',
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Directory path',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  KEY `idx_album` (`album`(255)) COMMENT 'Index for album queries',
  KEY `idx_name` (`name`(255)) COMMENT 'Index for name queries',
  FULLTEXT KEY `idx_tags_fulltext` (`tags`) COMMENT 'Full-text search on tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copy data from old to new (MariaDB syntax)
INSERT INTO `photos_new` (`id`, `name`, `tags`, `album`, `path`, `created_at`, `updated_at`)
SELECT 
  `id`,
  LEFT(`name`, 500),  -- Truncate if needed
  `tags`,
  LEFT(`album`, 500), -- Truncate if needed
  LEFT(`path`, 1000), -- Truncate if needed
  current_timestamp(),
  current_timestamp()
FROM `photos_backup`;

-- Swap tables
DROP TABLE `photos`;
RENAME TABLE `photos_new` TO `photos`;

SELECT CONCAT('✓ Photos table migrated: ', COUNT(*), ' records') AS Status FROM `photos`;

-- ============================================
-- Step 3: Migrate Tags Table
-- ============================================

-- Create new tags table
DROP TABLE IF EXISTS `tags_new`;
CREATE TABLE `tags_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tag name',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Record creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tag_unique` (`tag`) COMMENT 'Ensure unique tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copy data (only unique tags)
INSERT IGNORE INTO `tags_new` (`id`, `tag`, `created_at`)
SELECT 
  `id`,
  LEFT(`tag`, 255),  -- Truncate if needed
  current_timestamp()
FROM `tags_backup`;

-- Swap tables
DROP TABLE `tags`;
RENAME TABLE `tags_new` TO `tags`;

SELECT CONCAT('✓ Tags table migrated: ', COUNT(*), ' records') AS Status FROM `tags`;

-- ============================================
-- Step 4: Migrate Users Table
-- ============================================

-- Check if users table exists
SET @users_exists = (SELECT COUNT(*) FROM information_schema.TABLES 
                     WHERE TABLE_SCHEMA = 'mydb' AND TABLE_NAME = 'users_backup');

-- Create new users table
DROP TABLE IF EXISTS `users_new`;
CREATE TABLE `users_new` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User unique ID (UUID)',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Username for login',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Bcrypt hashed password',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User email address',
  `role` enum('admin','user','viewer') NOT NULL DEFAULT 'viewer' COMMENT 'User role',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Account active status',
  `registered` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Registration date',
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Last login timestamp',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`) COMMENT 'Unique username',
  UNIQUE KEY `idx_email` (`email`) COMMENT 'Unique email',
  KEY `idx_active` (`active`) COMMENT 'Index for active users'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy data if users table existed
INSERT IGNORE INTO `users_new` (`id`, `username`, `password`, `role`, `active`, `registered`, `last_login`)
SELECT 
  `id`,
  LEFT(`username`, 100),
  `password`,
  'user',  -- Default role
  1,       -- Active by default
  `registered`,
  `last_login`
FROM `users_backup`
WHERE @users_exists > 0;

-- Swap tables
DROP TABLE IF EXISTS `users`;
RENAME TABLE `users_new` TO `users`;

SELECT CONCAT('✓ Users table migrated: ', COUNT(*), ' records') AS Status FROM `users`;

-- ============================================
-- Step 5: Create New Tables
-- ============================================

-- Tasks table for background jobs
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Task description',
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending' COMMENT 'Task status',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Task creation time',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last update time',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'Task completion time',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`) COMMENT 'Index for status queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT '✓ Tasks table created' AS Status;

-- Schema version tracking
DROP TABLE IF EXISTS `schema_version`;
CREATE TABLE `schema_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT 'Schema version number',
  `description` text COMMENT 'Version description',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Version applied timestamp',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schema_version` (`version`, `description`) VALUES
('1.0.0', 'Legacy schema before migration'),
('2.0.0', 'Migrated to v2.0: InnoDB engine, indexes, timestamps - MariaDB');

SELECT '✓ Schema version table created' AS Status;

-- ============================================
-- Step 6: Create Views (MariaDB compatible)
-- ============================================

-- Photo count by album
DROP VIEW IF EXISTS `v_photos_by_album`;
CREATE OR REPLACE VIEW `v_photos_by_album` AS
SELECT 
  `album`,
  COUNT(*) as `photo_count`,
  MAX(`updated_at`) as `last_updated`
FROM `photos`
GROUP BY `album`
ORDER BY `photo_count` DESC;

SELECT '✓ View v_photos_by_album created' AS Status;

-- Popular tags (MariaDB compatible)
DROP VIEW IF EXISTS `v_popular_tags`;
CREATE OR REPLACE VIEW `v_popular_tags` AS
SELECT 
  TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(`tags`, ',', numbers.n), ',', -1)) as `tag`,
  COUNT(*) as `usage_count`
FROM `photos`
CROSS JOIN (
  SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
  UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
) numbers
WHERE `tags` IS NOT NULL 
  AND CHAR_LENGTH(`tags`) > 0
  AND numbers.n <= 1 + CHAR_LENGTH(`tags`) - CHAR_LENGTH(REPLACE(`tags`, ',', ''))
GROUP BY `tag`
HAVING `tag` != ''
ORDER BY `usage_count` DESC;

SELECT '✓ View v_popular_tags created' AS Status;

-- ============================================
-- Step 7: Verification
-- ============================================

-- Verify table engines
SELECT 
  TABLE_NAME,
  ENGINE,
  TABLE_COLLATION,
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb' 
  AND TABLE_NAME IN ('photos', 'tags', 'users', 'tasks', 'schema_version')
ORDER BY TABLE_NAME;

-- Verify indexes on photos
SELECT 
  INDEX_NAME,
  COLUMN_NAME,
  INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mydb' 
  AND TABLE_NAME = 'photos'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- Step 8: Cleanup (Optional)
-- ============================================

-- UNCOMMENT THE FOLLOWING LINES AFTER VERIFYING MIGRATION SUCCESS:
-- DROP TABLE IF EXISTS `photos_backup`;
-- DROP TABLE IF EXISTS `tags_backup`;
-- DROP TABLE IF EXISTS `users_backup`;

-- Keep backup tables for now for safety
SELECT '⚠ Backup tables preserved. Drop manually after verification.' AS Warning;

-- ============================================
-- Migration Complete
-- ============================================

SELECT '=====================================' AS '';
SELECT '✓✓✓ MIGRATION COMPLETE (MariaDB) ✓✓✓' AS '';
SELECT '=====================================' AS '';
SELECT '' AS '';
SELECT 'Next Steps:' AS '';
SELECT '1. Verify data integrity in migrated tables' AS '';
SELECT '2. Test application connection and functionality' AS '';
SELECT '3. Monitor for any errors in application logs' AS '';
SELECT '4. After 24-48 hours of successful operation:' AS '';
SELECT '   DROP TABLE photos_backup, tags_backup, users_backup;' AS '';
SELECT '' AS '';
SELECT 'Schema Version: 2.0.0' AS '';
SELECT CONCAT('Migration Date: ', NOW()) AS '';
SELECT 'Database Engine: MariaDB' AS '';

SET foreign_key_checks = 1;
