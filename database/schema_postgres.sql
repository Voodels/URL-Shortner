-- ============================================================================
-- URL Shortener Database Schema - PostgreSQL Version
-- Database: PostgreSQL (Neon)
-- ============================================================================
-- Converted from MySQL schema for Neon PostgreSQL database
-- Changes from MySQL:
-- - CHAR(36) UUID -> UUID type with gen_random_uuid()
-- - TIMESTAMP ON UPDATE -> trigger function for auto-update
-- - INT UNSIGNED -> INTEGER
-- - ENGINE/CHARSET declarations removed (Postgres uses different approach)
-- ============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- URLs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS urls (
  -- Primary key: UUID for globally unique identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Original long URL
  url VARCHAR(2048) NOT NULL,

  -- Short code: alphanumeric, unique, indexed for fast lookups
  short_code VARCHAR(10) NOT NULL UNIQUE,

  -- Owner of the URL
  user_id UUID NULL,

  -- Timestamps for auditing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Analytics: track how many times the URL has been accessed
  access_count INTEGER NOT NULL DEFAULT 0,

  -- Foreign key constraint
  CONSTRAINT fk_urls_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at);
CREATE INDEX IF NOT EXISTS idx_access_count ON urls(access_count);
CREATE INDEX IF NOT EXISTS idx_user_id ON urls(user_id);

-- ============================================================================
-- Categories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  -- Primary key: UUID for globally unique identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category name
  name VARCHAR(100) NOT NULL,

  -- Category description (optional)
  description VARCHAR(500),

  -- Icon/emoji for visual identification
  icon VARCHAR(50) DEFAULT 'folder',

  -- Color theme for the category
  color VARCHAR(50) DEFAULT 'primary',

  -- Owner of the category
  user_id UUID NOT NULL,

  -- Timestamps for auditing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: user can't have duplicate category names
  CONSTRAINT unique_user_category UNIQUE (user_id, name),

  -- Foreign key constraint
  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================================================
-- URL-Category Junction Table (Many-to-Many Relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS url_categories (
  -- Composite primary key
  url_id UUID NOT NULL,
  category_id UUID NOT NULL,

  -- Timestamp for when the URL was added to this category
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (url_id, category_id),

  -- Foreign key constraints
  CONSTRAINT fk_url_categories_url
    FOREIGN KEY (url_id) REFERENCES urls(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_url_categories_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_url_categories_url_id ON url_categories(url_id);
CREATE INDEX IF NOT EXISTS idx_url_categories_category_id ON url_categories(category_id);

-- ============================================================================
-- Trigger Function for Auto-updating updated_at
-- ============================================================================
-- PostgreSQL equivalent of MySQL's ON UPDATE CURRENT_TIMESTAMP

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to tables
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER urls_set_updated_at
  BEFORE UPDATE ON urls
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- List all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Count records
-- SELECT COUNT(*) FROM urls;
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM categories;

-- Show indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('urls', 'users', 'categories');

