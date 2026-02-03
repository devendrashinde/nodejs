-- Photo Gallery v2.0 - Favorites Table
-- Stores user favorite photos for persistence across sessions
-- Created: 2026-02-03

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

USE `mydb`;

-- Create favorites table
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'guest' COMMENT 'User ID (guest for anonymous)',
  `photo_path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Photo file path',
  `photo_name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Photo filename',
  `album` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album name',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When favorited',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_photo` (`user_id`, `photo_path`(255)) COMMENT 'One favorite per user per photo',
  KEY `idx_user_id` (`user_id`) COMMENT 'Index for user lookups',
  KEY `idx_album` (`album`) COMMENT 'Index for album queries',
  KEY `idx_created_at` (`created_at`) COMMENT 'Index for sorting by date'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='User favorite photos storage';

SELECT '✓ Favorites table created' AS Status;

SET foreign_key_checks = 1;
