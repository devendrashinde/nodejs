-- MySQL 8.0+ migration: local face grouping and person tags
-- Back up the database before running this migration.

CREATE TABLE IF NOT EXISTS `people` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_people_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `face_scans` (
  `photo_id` int NOT NULL,
  `face_count` smallint unsigned NOT NULL DEFAULT 0,
  `scanned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photo_id`),
  CONSTRAINT `fk_face_scans_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `photo_faces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `photo_id` int NOT NULL,
  `face_index` smallint unsigned NOT NULL,
  `embedding` mediumblob NOT NULL,
  `box` mediumtext NOT NULL,
  `confidence` decimal(6,5) NOT NULL,
  `person_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_photo_face_index` (`photo_id`, `face_index`),
  KEY `idx_photo_faces_person` (`person_id`),
  CONSTRAINT `fk_photo_faces_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_photo_faces_person` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `person_photo_tags` (
  `person_id` int NOT NULL,
  `photo_id` int NOT NULL,
  `tag` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`person_id`, `photo_id`),
  CONSTRAINT `fk_person_photo_tags_person` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_person_photo_tags_photo` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `schema_version` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `version` varchar(20) NOT NULL,
  `description` text,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schema_version` (`version`, `description`)
VALUES ('4.1', 'Added local face scans, face groups, and person tag provenance');