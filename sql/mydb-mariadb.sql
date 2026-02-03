-- Photo Gallery v2.0 - Complete Database Schema for MariaDB
-- MariaDB 10.5+ compatible with InnoDB engine
-- Optimized for connection pooling and production use
-- Created: 2026-02-02

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Create database
--

DROP DATABASE IF EXISTS `mydb`;
CREATE DATABASE `mydb` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `mydb`;

-- ============================================
-- Photos Table - Main photo metadata storage
-- ============================================

DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Photo metadata storage';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Sample data for testing (optional - remove in production)
--

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` (`id`, `name`, `tags`, `album`, `path`) VALUES 
(1,'000_0147.jpg','sample, demo','pictures','data'),
(2,'000_0223.jpg','sample, demo','pictures','data'),
(3,'100_0004.jpg','sample, demo','pictures','data');
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Tags Table - Tag management for autocomplete
-- ============================================

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tag name',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Record creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tag_unique` (`tag`) COMMENT 'Ensure unique tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Available tags for photos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Users Table - User authentication
-- ============================================

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='User accounts for authentication';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Tasks Table - Background task management
-- ============================================

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Task description',
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending' COMMENT 'Task status',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Task creation time',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last update time',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'Task completion time',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`) COMMENT 'Index for status queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Background task queue';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Database Schema Version Tracking
-- ============================================

DROP TABLE IF EXISTS `schema_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version` varchar(20) NOT NULL COMMENT 'Schema version number',
  `description` text COMMENT 'Version description',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Version applied timestamp',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Database schema version history';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_version`
--

LOCK TABLES `schema_version` WRITE;
/*!40000 ALTER TABLE `schema_version` DISABLE KEYS */;
INSERT INTO `schema_version` (`version`, `description`) VALUES
('2.0.0', 'Initial v2.0 schema with InnoDB, indexes, and optimizations for MariaDB');
/*!40000 ALTER TABLE `schema_version` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Useful Views for Analytics
-- ============================================

--
-- View: Photo count by album
--

DROP VIEW IF EXISTS `v_photos_by_album`;
CREATE OR REPLACE VIEW `v_photos_by_album` AS
SELECT 
  `album`,
  COUNT(*) as `photo_count`,
  MAX(`updated_at`) as `last_updated`
FROM `photos`
GROUP BY `album`
ORDER BY `photo_count` DESC;

--
-- View: Most used tags (MariaDB compatible)
--

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

-- ============================================
-- Restore session variables
-- ============================================

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- ============================================
-- Database Info
-- ============================================
-- Database: mydb
-- Version: 2.0.0
-- Engine: InnoDB (ACID compliant, supports transactions)
-- Character Set: utf8mb4 (full Unicode support including emojis)
-- Compatible with: MariaDB 10.5+
-- Optimized for: Connection pooling, concurrent queries, full-text search
-- 
-- MariaDB Specific Notes:
-- - Uses current_timestamp() instead of CURRENT_TIMESTAMP for compatibility
-- - InnoDB engine for ACID compliance and better concurrency
-- - All indexes optimized for MariaDB query optimizer
-- - FULLTEXT indexes work on InnoDB in MariaDB 10.0+
-- 
-- Dump completed on 2026-02-02
