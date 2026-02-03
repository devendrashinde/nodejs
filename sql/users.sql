-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 09, 2020 at 09:42 PM
-- Server version: 5.7.26
-- PHP Version: 7.2.18

-- Photo Gallery v2.0 - Users Table Schema
-- Optimized for MySQL 8.0+ with InnoDB engine and security features
-- Created: 2026-02-02

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts for authentication';

-- Note: Passwords should be hashed with bcrypt (bcryptjs package in Node.js)
