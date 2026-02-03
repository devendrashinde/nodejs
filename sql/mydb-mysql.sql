-- Photo Gallery v2.0 - Complete Database Schema
-- MySQL 8.0.30+ compatible with InnoDB engine
-- Optimized for connection pooling and production use
-- Created: 2026-02-02

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Create database
DROP DATABASE IF EXISTS `mydb`;
CREATE DATABASE `mydb` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `mydb`;

-- ============================================
-- Photos Table - Main photo metadata storage
-- ============================================
DROP TABLE IF EXISTS `photos`;
CREATE TABLE `photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Photo filename',
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Comma-separated tags',
  `album` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album name',
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Directory path',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  KEY `idx_album` (`album`(255)) COMMENT 'Index for album queries',
  KEY `idx_name` (`name`(255)) COMMENT 'Index for name queries',
  FULLTEXT KEY `idx_tags_fulltext` (`tags`) COMMENT 'Full-text search on tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Photo metadata storage';

-- Sample data for testing (optional - remove in production)
INSERT INTO `photos` (`id`, `name`, `tags`, `album`, `path`) VALUES
(1, '000_0147.jpg', 'sample, demo', 'pictures', 'data'),
(2, '000_0223.jpg', 'sample, demo', 'pictures', 'data'),
(3, '100_0004.jpg', 'sample, demo', 'pictures', 'data');

-- ============================================
-- Tags Table - Tag management for autocomplete
-- ============================================
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tag name',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tag_unique` (`tag`) COMMENT 'Ensure unique tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Available tags for photos';

-- ============================================
-- Users Table - User authentication
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User unique ID (UUID)',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Username for login',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Bcrypt hashed password',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User email address',
  `role` enum('admin','user','viewer') NOT NULL DEFAULT 'viewer' COMMENT 'User role',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Account active status',
  `registered` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration date',
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Last login timestamp',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`) COMMENT 'Unique username',
  UNIQUE KEY `idx_email` (`email`) COMMENT 'Unique email',
  KEY `idx_active` (`active`) COMMENT 'Index for active users'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='User accounts for authentication';

-- ============================================
-- Tasks Table - Background task management (optional)
-- ============================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Task description',
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending' COMMENT 'Task status',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Task creation time',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'Task completion time',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`) COMMENT 'Index for status queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Background task queue';

-- ============================================
-- Database Schema Version Tracking
-- ============================================
DROP TABLE IF EXISTS `schema_version`;
CREATE TABLE `schema_version` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT 'Schema version number',
  `description` text COMMENT 'Version description',
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Version applied timestamp',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Database schema version history';

INSERT INTO `schema_version` (`version`, `description`) VALUES
('2.0.0', 'Initial v2.0 schema with InnoDB, indexes, and optimizations');

-- ============================================
-- Useful Views for Analytics (Optional)
-- ============================================

-- View: Photo count by album
CREATE OR REPLACE VIEW `v_photos_by_album` AS
SELECT 
  `album`,
  COUNT(*) as `photo_count`,
  MAX(`updated_at`) as `last_updated`
FROM `photos`
GROUP BY `album`
ORDER BY `photo_count` DESC;

-- View: Most used tags
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

-- ============================================
-- Database Info
-- ============================================
-- Database: mydb
-- Version: 2.0.0
-- Engine: InnoDB (ACID compliant, supports transactions and foreign keys)
-- Character Set: utf8mb4 (full Unicode support including emojis)
-- Compatible with: MySQL 8.0+, MariaDB 10.5+
-- Optimized for: Connection pooling, concurrent queries, full-text search
-- 
-- Notes:
-- - All timestamps use UTC timezone
-- - Indexes optimized for common query patterns
-- - VARCHAR used instead of TEXT where possible for better indexing
-- - FULLTEXT index on tags for advanced search
-- - Views provided for common analytics queries
-- 
-- 2026-02-02