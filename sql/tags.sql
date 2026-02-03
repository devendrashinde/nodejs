-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 09, 2020 at 09:42 PM
-- Server version: 5.7.26
-- PHP Version: 7.2.18

-- Photo Gallery v2.0 - Tags Table Schema
-- Optimized for MySQL 8.0+ with InnoDB engine
-- Created: 2026-02-02

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE IF NOT EXISTS `tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tag name',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tag_unique` (`tag`) COMMENT 'Ensure unique tags'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Available tags for photos';

-- Note: This table can be used for tag autocomplete functionality

