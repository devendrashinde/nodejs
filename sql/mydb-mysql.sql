-- Adminer 5.3.0 MySQL 8.0.30 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `mydb`;
CREATE DATABASE `mydb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mydb`;

DROP TABLE IF EXISTS `photos`;
CREATE TABLE `photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `album` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `photos` (`id`, `name`, `tags`, `album`, `path`) VALUES
(1,	'000_0147.jpg',	'chimu',	'pictures',	'data'),
(2,	'000_0223.jpg',	'vaishnav',	'pictures',	'data'),
(3,	'100_0004.jpg',	'gopal',	'pictures',	'data'),
(4,	'000_0221_1.jpg',	'chimu',	'pictures',	'data'),
(5,	'Bilateral knees to chest.mp4',	'Bilateral knees to chest.mp4',	'movies',	'data'),
(6,	'000_0011.jpg',	'kabir',	'2004-Feb',	'data/pictures/2003-Jan'),
(7,	'000_0004.jpg',	'geeta, chimu',	'2004-Feb',	'data/pictures/2003-Jan');

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;


-- 2025-06-05 14:11:44 UTC