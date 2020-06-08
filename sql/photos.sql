-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jun 08, 2020 at 08:51 PM
-- Server version: 5.7.26
-- PHP Version: 7.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mydb`
--

-- --------------------------------------------------------

--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `photos`;
CREATE TABLE IF NOT EXISTS `photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `tags` varchar(2000) DEFAULT NULL,
  `album` varchar(256) NOT NULL,
  `path` varchar(512) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`album`,`name`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=46 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `photos`
--

INSERT INTO `photos` (`id`, `name`, `tags`, `album`, `path`) VALUES
(29, '100_0004.JPG', 'vaishnav 1 year', 'pictures', ''),
(30, '000_0036.JPG', 'Geeta and Vaishnav', '2003-Jan', 'pictures'),
(35, '000_0011.JPG', 'Kabir 1.5 years', '2004-Feb', 'pictures/2003-Jan'),
(36, 'IMG_20181122_085248.jpg', 'aatya, anna, dada, aakka, vittal, nalini', '2018-Nov', 'pictures/2003-Jan/2004-Feb'),
(37, '000_0147.jpg', 'vaishnav', 'pictures', ''),
(38, '000_0221_1.jpg', 'vaishnav', 'pictures', ''),
(39, '000_0026.JPG', 'kabu', '2003-Jan', 'pictures'),
(40, '000_0151.jpg', 'vaishnav', 'pictures', ''),
(41, '100_0013.JPG', 'vaishnav', 'pictures', ''),
(42, '000_0223.JPG', 'vaishnav', 'pictures', ''),
(43, 'IMG_20181119_115115.jpg', 'devendra', '2018-Nov', 'pictures'),
(44, '20150523_055806.jpg', 'pine lake resort cottage, uk', '2015-May', 'pictures'),
(45, 'IMG20200605114312.jpg', 'abc', '2020-Jun', 'pictures');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
