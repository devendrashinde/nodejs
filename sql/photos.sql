-- Photo Gallery v2.0 - Photos Table Schema
-- Optimized for MySQL 8.0+ with InnoDB engine and proper indexes
-- Created: 2026-02-02

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Photo metadata storage';

-- 2026-02-02