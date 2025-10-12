-- ============================================================================
-- URL Shortener Database Schema
-- Database: MySQL 8.0+
-- ============================================================================

-- Drop existing database (CAUTION: This will delete all data)
-- Comment out in production
DROP DATABASE IF EXISTS url_shortener;

-- Create database with UTF-8 support
CREATE DATABASE url_shortener
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use the database
USE url_shortener;

-- ============================================================================
-- URLs Table
-- ============================================================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE urls (
  -- Primary key: UUID for globally unique identifier
  id CHAR(36) PRIMARY KEY,

  -- Original long URL
  url VARCHAR(2048) NOT NULL,

  -- Short code: alphanumeric, unique, indexed for fast lookups
  short_code VARCHAR(10) NOT NULL UNIQUE,

  -- Owner of the URL
  user_id CHAR(36) NULL,

  -- Timestamps for auditing
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Analytics: track how many times the URL has been accessed
  access_count INT UNSIGNED NOT NULL DEFAULT 0,

  -- Indexes for performance
  INDEX idx_short_code (short_code),
  INDEX idx_created_at (created_at),
  INDEX idx_access_count (access_count),
  INDEX idx_user_id (user_id),

  CONSTRAINT fk_urls_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- INSERT INTO urls (id, url, short_code, created_at, updated_at, access_count)
-- VALUES
--   (UUID(), 'https://github.com/denoland/deno', 'abc123', NOW(), NOW(), 0),
--   (UUID(), 'https://deno.land', 'xyz789', NOW(), NOW(), 5);

-- ============================================================================
-- Useful Queries
-- ============================================================================

-- Get all URLs
-- SELECT * FROM urls ORDER BY created_at DESC;

-- Get URL by short code
-- SELECT * FROM urls WHERE short_code = 'abc123';

-- Get most accessed URLs
-- SELECT * FROM urls ORDER BY access_count DESC LIMIT 10;

-- Count total URLs
-- SELECT COUNT(*) as total_urls FROM urls;

-- Get URLs created in last 24 hours
-- SELECT * FROM urls WHERE created_at >= NOW() - INTERVAL 1 DAY;

-- ============================================================================
-- Maintenance
-- ============================================================================

-- Analyze table for optimization
-- ANALYZE TABLE urls;

-- Check table status
-- SHOW TABLE STATUS WHERE Name = 'urls';

-- Show indexes
-- SHOW INDEX FROM urls;
