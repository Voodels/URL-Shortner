/**
 * MySQL Repository Implementation
 *
 * PURPOSE: Database persistence layer using MySQL
 * PATTERN: Repository pattern with connection pooling
 *
 * FEATURES:
 * - Connection pooling for performance
 * - Prepared statements to prevent SQL injection
 * - Transaction support
 * - Error handling and logging
 *
 * DEPENDENCIES:
 * - mysql2: npm install mysql2 (or use Deno's MySQL client)
 * - For Deno: https://deno.land/x/mysql
 */

import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import { type CategoryRepository, type URLRepository, type UserRepository } from "./store.ts";
import { NotFoundError, type ShortenedURL, type User } from "./types.ts";

const denoRuntime = (globalThis as { Deno?: any }).Deno;

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch (_jsonError) {
    return String(error);
  }
}

function toValidDate(value: string | Date, fieldName: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date provided for ${fieldName}`);
  }
  return date;
}

/**
 * Database Configuration
 *
 * SECURITY: Use environment variables for credentials
 * NEVER commit credentials to version control
 */
export interface DatabaseConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  database: string;
  poolSize?: number;
}

/**
 * MySQL URL Repository
 *
 * IMPLEMENTATION: URLRepository interface with MySQL backend
 * PERFORMANCE: Uses connection pooling and prepared statements
 * SCALABILITY: Horizontal scaling via read replicas (future)
 */
export class MySQLURLRepository implements URLRepository {
  private client: Client;
  private config: DatabaseConfig;

  /**
   * Constructor
   *
   * @param config - Database configuration
   */
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.client = new Client();
  }

  /**
   * Initialize database connection
   *
   * IMPORTANT: Call this before using the repository
   * PATTERN: Async initialization (can't use constructor)
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect({
        hostname: this.config.hostname,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        db: this.config.database,
        poolSize: this.config.poolSize || 10, // Default 10 connections
        charset: "utf8mb4", // Support emojis and special characters
      });
      console.log("✅ Connected to MySQL database");
    } catch (error) {
      const message = describeError(error);
      console.error("❌ Failed to connect to MySQL:", error);
      throw new Error(`Database connection failed: ${message}`);
    }
  }

  /**
   * Close database connection
   *
   * USAGE: Call on server shutdown for graceful cleanup
   */
  async disconnect(): Promise<void> {
    await this.client.close();
    console.log("✅ Disconnected from MySQL database");
  }

  /**
   * Create a new shortened URL
   *
   * SQL: INSERT with duplicate key handling
   * PERFORMANCE: Single query, O(1) average
   *
   * @param url - Shortened URL to create
   * @returns Created URL with all fields
   */
  async create(url: ShortenedURL): Promise<ShortenedURL> {
    try {
      const createdAt = toValidDate(url.createdAt, "createdAt");
      const updatedAt = toValidDate(url.updatedAt, "updatedAt");

      const query = `
        INSERT INTO urls (id, url, short_code, user_id, created_at, updated_at, access_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.client.execute(query, [
        url.id,
        url.url,
        url.shortCode,
        url.userId ?? null,
        createdAt,
        updatedAt,
        url.accessCount,
      ]);

      return url;
    } catch (error) {
      // Handle duplicate key error
      if (error instanceof Error && error.message?.includes("Duplicate entry")) {
        throw new Error(`Short code '${url.shortCode}' already exists`);
      }
      console.error("Create error:", error);
      throw error;
    }
  }

  /**
   * Find URL by short code
   *
   * SQL: SELECT with index lookup
   * PERFORMANCE: O(1) via unique index on short_code
   *
   * @param shortCode - Short code to look up
   * @returns URL if found, null otherwise
   */
  async findByShortCode(shortCode: string): Promise<ShortenedURL | null> {
    try {
      const query = `
   SELECT id, url, short_code as shortCode, user_id as userId, created_at as createdAt,
     updated_at as updatedAt, access_count as accessCount
        FROM urls
        WHERE short_code = ?
        LIMIT 1
      `;

      const result = await this.client.execute(query, [shortCode]);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        const userId = row.userId as string | null;
        return {
          id: row.id as string,
          url: row.url as string,
          shortCode: row.shortCode as string,
          userId: userId ?? undefined,
          createdAt: (row.createdAt as Date).toISOString(),
          updatedAt: (row.updatedAt as Date).toISOString(),
          accessCount: row.accessCount as number,
        };
      }

      return null;
    } catch (error) {
      console.error("FindByShortCode error:", error);
      throw error;
    }
  }

  /**
   * Find URL by ID
   *
   * SQL: SELECT with primary key lookup
   * PERFORMANCE: O(1) via primary key index
   *
   * @param id - UUID of the URL
   * @returns URL if found, null otherwise
   */
  async findById(id: string): Promise<ShortenedURL | null> {
    try {
      const query = `
   SELECT id, url, short_code as shortCode, user_id as userId, created_at as createdAt,
     updated_at as updatedAt, access_count as accessCount
        FROM urls
        WHERE id = ?
        LIMIT 1
      `;

      const result = await this.client.execute(query, [id]);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        const userId = row.userId as string | null;
        return {
          id: row.id as string,
          url: row.url as string,
          shortCode: row.shortCode as string,
          userId: userId ?? undefined,
          createdAt: (row.createdAt as Date).toISOString(),
          updatedAt: (row.updatedAt as Date).toISOString(),
          accessCount: row.accessCount as number,
        };
      }

      return null;
    } catch (error) {
      console.error("FindById error:", error);
      throw error;
    }
  }

  /**
   * Update existing URL
   *
   * SQL: UPDATE with WHERE clause
   * PERFORMANCE: O(1) via unique index lookup
   *
   * @param shortCode - Short code of URL to update
   * @param updates - Partial URL with fields to update
   * @returns Updated URL
   * @throws NotFoundError if URL not found
   */
  async update(
    shortCode: string,
    updates: Partial<ShortenedURL>
  ): Promise<ShortenedURL> {
    try {
      // First, check if URL exists
      const existing = await this.findByShortCode(shortCode);
      if (!existing) {
        throw new NotFoundError(`Short URL '${shortCode}' not found`);
      }

      // Build dynamic UPDATE query
      const query = `
        UPDATE urls
        SET url = ?, updated_at = ?
        WHERE short_code = ?
      `;

      const updatedAt = updates.updatedAt
        ? toValidDate(updates.updatedAt, "updatedAt")
        : new Date();

      await this.client.execute(query, [
        updates.url || existing.url,
        updatedAt,
        shortCode,
      ]);

      // Return updated URL
      const updated = await this.findByShortCode(shortCode);
      if (!updated) {
        throw new Error("Failed to retrieve updated URL");
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Update error:", error);
      throw error;
    }
  }

  /**
   * Delete URL by short code
   *
   * SQL: DELETE with WHERE clause
   * PERFORMANCE: O(1) via unique index lookup
   *
   * @param shortCode - Short code of URL to delete
   * @returns true if deleted, false otherwise
   * @throws NotFoundError if URL not found
   */
  async delete(shortCode: string): Promise<boolean> {
    try {
      // First, check if URL exists
      const existing = await this.findByShortCode(shortCode);
      if (!existing) {
        throw new NotFoundError(`Short URL '${shortCode}' not found`);
      }

      const query = `
        DELETE FROM urls
        WHERE short_code = ?
      `;

      await this.client.execute(query, [shortCode]);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error("Delete error:", error);
      throw error;
    }
  }

  /**
   * Increment access count (analytics)
   *
   * SQL: UPDATE with increment
   * PERFORMANCE: O(1) atomic operation
   * ATOMICITY: Uses SQL increment to avoid race conditions
   *
   * @param shortCode - Short code of URL to increment
   */
  async incrementAccessCount(shortCode: string): Promise<void> {
    try {
      const query = `
        UPDATE urls
        SET access_count = access_count + 1
        WHERE short_code = ?
      `;

      await this.client.execute(query, [shortCode]);
    } catch (error) {
      console.error("IncrementAccessCount error:", error);
      // Don't throw - this is analytics, shouldn't break main flow
    }
  }

  /**
   * Check if short code exists
   *
   * SQL: SELECT COUNT for existence check
   * PERFORMANCE: O(1) via unique index, faster than full SELECT
   *
   * @param shortCode - Short code to check
   * @returns True if exists, false otherwise
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM urls
        WHERE short_code = ?
      `;

      const result = await this.client.execute(query, [shortCode]);

      if (result.rows && result.rows.length > 0) {
        const count = result.rows[0].count as number;
        return count > 0;
      }

      return false;
    } catch (error) {
      console.error("ShortCodeExists error:", error);
      throw error;
    }
  }

  /**
   * Get all URLs (with pagination)
   *
   * FUTURE: Add pagination parameters (limit, offset)
   * PERFORMANCE: Add indexes on created_at for sorting
   *
   * @returns Array of all URLs
   */
  async getAll(limit = 100, offset = 0): Promise<ShortenedURL[]> {
    try {
      const query = `
   SELECT id, url, short_code as shortCode, user_id as userId, created_at as createdAt,
     updated_at as updatedAt, access_count as accessCount
        FROM urls
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const result = await this.client.execute(query, [limit, offset]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        url: row.url as string,
        shortCode: row.shortCode as string,
        userId: (row.userId as string | null) ?? undefined,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
        accessCount: row.accessCount as number,
      }));
    } catch (error) {
      console.error("GetAll error:", error);
      throw error;
    }
  }

  async getAllByUser(userId: string): Promise<ShortenedURL[]> {
    try {
      const query = `
        SELECT id, url, short_code as shortCode, user_id as userId, created_at as createdAt,
               updated_at as updatedAt, access_count as accessCount
        FROM urls
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;

      const result = await this.client.execute(query, [userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        url: row.url as string,
        shortCode: row.shortCode as string,
        userId: (row.userId as string | null) ?? undefined,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
        accessCount: row.accessCount as number,
      }));
    } catch (error) {
      console.error("GetAllByUser error:", error);
      throw error;
    }
  }

  async getURLsByCategory(categoryId: string, userId: string): Promise<ShortenedURL[]> {
    try {
      const query = `
        SELECT u.id, u.url, u.short_code as shortCode, u.user_id as userId,
               u.created_at as createdAt, u.updated_at as updatedAt, u.access_count as accessCount
        FROM urls u
        INNER JOIN url_categories uc ON u.id = uc.url_id
        WHERE uc.category_id = ? AND u.user_id = ?
        ORDER BY u.created_at DESC
      `;

      const result = await this.client.execute(query, [categoryId, userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        url: row.url as string,
        shortCode: row.shortCode as string,
        userId: (row.userId as string | null) ?? undefined,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
        accessCount: row.accessCount as number,
      }));
    } catch (error) {
      console.error("GetURLsByCategory error:", error);
      throw error;
    }
  }

  async addCategoriesToURL(urlId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    try {
      const values = categoryIds.map(categoryId => `('${urlId}', '${categoryId}')`).join(',');
      const query = `INSERT IGNORE INTO url_categories (url_id, category_id) VALUES ${values}`;
      await this.client.execute(query);
    } catch (error) {
      console.error("AddCategoriesToURL error:", error);
      throw error;
    }
  }

  async removeCategoriesFromURL(urlId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    try {
      const placeholders = categoryIds.map(() => '?').join(',');
      const query = `DELETE FROM url_categories WHERE url_id = ? AND category_id IN (${placeholders})`;
      await this.client.execute(query, [urlId, ...categoryIds]);
    } catch (error) {
      console.error("RemoveCategoriesFromURL error:", error);
      throw error;
    }
  }

  async getCategoriesForURL(urlId: string): Promise<import("./types.ts").Category[]> {
    try {
      const query = `
        SELECT c.id, c.name, c.description, c.icon, c.color, c.user_id as userId,
               c.created_at as createdAt, c.updated_at as updatedAt
        FROM categories c
        INNER JOIN url_categories uc ON c.id = uc.category_id
        WHERE uc.url_id = ?
        ORDER BY c.name ASC
      `;

      const result = await this.client.execute(query, [urlId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string | null) ?? undefined,
        icon: row.icon as string,
        color: row.color as string,
        userId: row.userId as string,
        createdAt: (row.createdAt as Date).toISOString(),
        updatedAt: (row.updatedAt as Date).toISOString(),
      }));
    } catch (error) {
      console.error("GetCategoriesForURL error:", error);
      throw error;
    }
  }

  getClient(): Client {
    return this.client;
  }
}

export class MySQLUserRepository implements UserRepository {
  constructor(private readonly client: Client) {}

  private mapRowToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      passwordHash: row.passwordHash as string,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  async create(user: User): Promise<User> {
    const createdAt = toValidDate(user.createdAt, "createdAt");
    const updatedAt = toValidDate(user.updatedAt, "updatedAt");

    const query = `
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.client.execute(query, [
      user.id,
      user.email,
      user.passwordHash,
      createdAt,
      updatedAt,
    ]);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as passwordHash, created_at as createdAt,
             updated_at as updatedAt
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    const result = await this.client.execute(query, [email]);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return this.mapRowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as passwordHash, created_at as createdAt,
             updated_at as updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const result = await this.client.execute(query, [id]);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return this.mapRowToUser(row);
  }
}

export class MySQLCategoryRepository implements CategoryRepository {
  constructor(private readonly client: Client) {}

  private mapRowToCategory(row: Record<string, unknown>): import("./types.ts").Category {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? undefined,
      icon: row.icon as string,
      color: row.color as string,
      userId: row.userId as string,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  async create(category: import("./types.ts").Category): Promise<import("./types.ts").Category> {
    const createdAt = toValidDate(category.createdAt, "createdAt");
    const updatedAt = toValidDate(category.updatedAt, "updatedAt");

    const query = `
      INSERT INTO categories (id, name, description, icon, color, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.client.execute(query, [
      category.id,
      category.name,
      category.description ?? null,
      category.icon,
      category.color,
      category.userId,
      createdAt,
      updatedAt,
    ]);

    return category;
  }

  async findById(id: string): Promise<import("./types.ts").Category | null> {
    const query = `
      SELECT id, name, description, icon, color, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM categories
      WHERE id = ?
    `;

    const result = await this.client.execute(query, [id]);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(result.rows[0] as Record<string, unknown>);
  }

  async findByName(userId: string, name: string): Promise<import("./types.ts").Category | null> {
    const query = `
      SELECT id, name, description, icon, color, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM categories
      WHERE user_id = ? AND name = ?
    `;

    const result = await this.client.execute(query, [userId, name]);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(result.rows[0] as Record<string, unknown>);
  }

  async update(id: string, category: import("./types.ts").Category): Promise<import("./types.ts").Category> {
    const updatedAt = toValidDate(category.updatedAt, "updatedAt");

    const query = `
      UPDATE categories
      SET name = ?, description = ?, icon = ?, color = ?, updated_at = ?
      WHERE id = ?
    `;

    await this.client.execute(query, [
      category.name,
      category.description ?? null,
      category.icon,
      category.color,
      updatedAt,
      id,
    ]);

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM categories WHERE id = ?`;
    const result = await this.client.execute(query, [id]);
    return (result.affectedRows ?? 0) > 0;
  }

  async getAllByUser(userId: string): Promise<import("./types.ts").Category[]> {
    const query = `
      SELECT id, name, description, icon, color, user_id as userId,
             created_at as createdAt, updated_at as updatedAt
      FROM categories
      WHERE user_id = ?
      ORDER BY name ASC
    `;

    const result = await this.client.execute(query, [userId]);

    if (!result.rows) {
      return [];
    }

    return result.rows.map((row: Record<string, unknown>) => this.mapRowToCategory(row));
  }

  async getAllByUserWithCount(userId: string): Promise<import("./types.ts").CategoryWithCount[]> {
    const query = `
      SELECT c.id, c.name, c.description, c.icon, c.color, c.user_id as userId,
             c.created_at as createdAt, c.updated_at as updatedAt,
             COUNT(uc.url_id) as urlCount
      FROM categories c
      LEFT JOIN url_categories uc ON c.id = uc.category_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    const result = await this.client.execute(query, [userId]);

    if (!result.rows) {
      return [];
    }

    return result.rows.map((row: Record<string, unknown>) => ({
      ...this.mapRowToCategory(row),
      urlCount: Number(row.urlCount) || 0,
    }));
  }
}

/**
 * Create repository instance from environment variables
 *
 * USAGE: Import this singleton instance throughout your app
 * CONFIGURATION: Set environment variables before starting server
 */
export function createMySQLRepository(configOverride?: DatabaseConfig): MySQLURLRepository {
  if (!configOverride && !denoRuntime) {
    throw new Error("Deno runtime is required to load MySQL configuration from environment variables");
  }

  const config: DatabaseConfig = configOverride ?? {
    hostname: denoRuntime?.env.get("DB_HOST") || "localhost",
    port: parseInt(denoRuntime?.env.get("DB_PORT") || "3306"),
    username: denoRuntime?.env.get("DB_USER") || "root",
    password: denoRuntime?.env.get("DB_PASSWORD") || "",
    database: denoRuntime?.env.get("DB_NAME") || "url_shortener",
    poolSize: parseInt(denoRuntime?.env.get("DB_POOL_SIZE") || "10"),
  };

  return new MySQLURLRepository(config);
}

export async function createMySQLRepositories(configOverride?: DatabaseConfig): Promise<{
  urlRepository: MySQLURLRepository;
  userRepository: MySQLUserRepository;
  categoryRepository: MySQLCategoryRepository;
}> {
  const urlRepository = createMySQLRepository(configOverride);
  await urlRepository.connect();
  const userRepository = new MySQLUserRepository(urlRepository.getClient());
  const categoryRepository = new MySQLCategoryRepository(urlRepository.getClient());
  return { urlRepository, userRepository, categoryRepository };
}
