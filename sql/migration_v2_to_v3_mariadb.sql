-- Photo Gallery Database Migration v2.0 to v3.0
-- MariaDB 10.5+ Migration Script
-- Adds album tagging support
-- Created: 2026-02-09

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

DROP TABLE IF EXISTS `albums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `albums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album name',
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Comma-separated album tags',
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Album directory path',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Album description',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Record creation time',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Last update time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_album_name` (`name`(255)) COMMENT 'Unique album name',
  KEY `idx_album_path` (`path`(255)) COMMENT 'Index for path queries',
  FULLTEXT KEY `idx_album_tags_fulltext` (`tags`) COMMENT 'Full-text search on album tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
  COMMENT='Album metadata and tagging';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `albums`
--

LOCK TABLES `albums` WRITE;
/*!40000 ALTER TABLE `albums` DISABLE KEYS */;
/*!40000 ALTER TABLE `albums` ENABLE KEYS */;
UNLOCK TABLES;

-- ============================================
-- Update Schema Version
-- ============================================

INSERT INTO `schema_version` (`version`, `description`) VALUES 
('3.0.0', 'Added album tagging support with separate albums table')
ON DUPLICATE KEY UPDATE `applied_at` = current_timestamp();

-- ============================================
-- Migration Complete
-- ============================================
-- The migration has successfully created the albums table
-- and updated the schema version. Your application now supports:
--   - Album-level tagging
--   - Album descriptions
--   - Full-text search on album tags
--   - Separate album organization

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET @OLD_SQL_NOTES=@OLD_SQL_NOTES */;

-- End of migration script
