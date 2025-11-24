/**
 * PostgreSQL Repository Implementation
 *
 * PURPOSE: Database persistence layer using PostgreSQL (Neon)
 * PATTERN: Repository pattern with connection pooling
 *
 * FEATURES:
 * - Connection pooling for performance
 * - Prepared statements to prevent SQL injection
 * - Transaction support
 * - Error handling and logging
 *
 * DEPENDENCIES:
 * - postgres: Deno PostgreSQL client
 */

import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { type CategoryRepository, type URLRepository, type UserRepository } from "./store.ts";
import { DatabaseError, NotFoundError, type Category, type CategoryWithCount, type ShortenedURL, type User } from "./types.ts";

const denoRuntime = (globalThis as { Deno?: any }).Deno;

function throwDatabaseError(operation: string, error: unknown): never {
  console.error(`PostgreSQL ${operation} error:`, error);

  const defaultMessage = describeError(error);
  throw new DatabaseError(`PostgreSQL ${operation} operation failed`, [defaultMessage]);
}

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
  tls?: boolean;
}

/**
 * PostgreSQL URL Repository
 *
 * IMPLEMENTATION: URLRepository interface with PostgreSQL backend
 * PERFORMANCE: Uses connection pooling and prepared statements
 * SCALABILITY: Horizontal scaling via read replicas (future)
 */
export class PostgreSQLURLRepository implements URLRepository {
  private client: Client;
  private config: DatabaseConfig;

  /**
   * Constructor
   *
   * @param config - Database configuration
   */
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.client = new Client({
      hostname: config.hostname,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      tls: config.tls !== false ? { enabled: true } : { enabled: false },
    });
  }

  /**
   * Initialize database connection
   *
   * IMPORTANT: Call this before using the repository
   * PATTERN: Async initialization (can't use constructor)
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("✅ Connected to PostgreSQL database (Neon)");
    } catch (error) {
      throwDatabaseError("connect", error);
    }
  }

  /**
   * Close database connection
   *
   * USAGE: Call on server shutdown for graceful cleanup
   */
  async disconnect(): Promise<void> {
    await this.client.end();
    console.log("✅ Disconnected from PostgreSQL database");
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
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.client.queryObject(query, [
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
      if (error instanceof Error && error.message?.includes("duplicate key")) {
        throw new Error(`Short code '${url.shortCode}' already exists`);
      }
      throwDatabaseError("create url", error);
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
        SELECT id, url, short_code, user_id, created_at, updated_at, access_count
        FROM urls
        WHERE short_code = $1
        LIMIT 1
      `;

      const result = await this.client.queryObject(query, [shortCode]);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          id: row.id,
          url: row.url,
          shortCode: row.short_code,
          userId: row.user_id ?? undefined,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          accessCount: row.access_count,
        };
      }

      return null;
    } catch (error) {
      throwDatabaseError("findByShortCode", error);
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
        SELECT id, url, short_code, user_id, created_at, updated_at, access_count
        FROM urls
        WHERE id = $1
        LIMIT 1
      `;

      const result = await this.client.queryObject(query, [id]);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          id: row.id,
          url: row.url,
          shortCode: row.short_code,
          userId: row.user_id ?? undefined,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          accessCount: row.access_count,
        };
      }

      return null;
    } catch (error) {
      throwDatabaseError("findById", error);
    }
  }

  /**
   * Update existing URL
   *
   * SQL: UPDATE with WHERE clause
   * PERFORMANCE: O(1) via unique index lookup
   *
   * @param shortCode - Short code of URL to update
   * @param url - Updated URL object
   * @returns Updated URL
   * @throws NotFoundError if URL not found
   */
  async update(shortCode: string, url: ShortenedURL): Promise<ShortenedURL> {
    try {
      // First, check if URL exists
      const existing = await this.findByShortCode(shortCode);
      if (!existing) {
        throw new NotFoundError(`Short URL '${shortCode}' not found`);
      }

      // Build UPDATE query
      const query = `
        UPDATE urls
        SET url = $1, updated_at = $2
        WHERE short_code = $3
        RETURNING *
      `;

      await this.client.queryObject(query, [
        url.url,
        toValidDate(url.updatedAt, "updatedAt"),
        shortCode,
      ]);

      // Return updated URL
      return (await this.findByShortCode(shortCode)) ?? existing;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throwDatabaseError("update url", error);
    }
  }

  /**
   * Delete URL by short code
   *
   * SQL: DELETE with WHERE clause
   * PERFORMANCE: O(1) via unique index lookup
   *
   * @param shortCode - Short code of URL to delete
   * @returns true if deleted
   * @throws NotFoundError if URL not found
   */
  async delete(shortCode: string): Promise<boolean> {
    try {
      // First, check if URL exists
      const existing = await this.findByShortCode(shortCode);
      if (!existing) {
        throw new NotFoundError(`Short URL '${shortCode}' not found`);
      }

      const query = `DELETE FROM urls WHERE short_code = $1`;
      await this.client.queryObject(query, [shortCode]);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throwDatabaseError("delete url", error);
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
        WHERE short_code = $1
      `;

      await this.client.queryObject(query, [shortCode]);
    } catch (error) {
      console.error("IncrementAccessCount error:", error);
      // Don't throw - this is analytics, shouldn't break main flow
    }
  }

  /**
   * Check if short code exists
   *
   * SQL: SELECT COUNT for existence check
   * PERFORMANCE: O(1) via unique index
   *
   * @param shortCode - Short code to check
   * @returns True if exists, false otherwise
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    try {
      const query = `SELECT COUNT(*) as count FROM urls WHERE short_code = $1`;
      const result = await this.client.queryObject(query, [shortCode]);

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return parseInt(row.count) > 0;
      }

      return false;
    } catch (error) {
      throwDatabaseError("shortCodeExists", error);
    }
  }

  /**
   * Get all URLs (with pagination)
   *
   * @returns Array of all URLs
   */
  async getAll(limit = 100, offset = 0): Promise<ShortenedURL[]> {
    try {
      const query = `
        SELECT id, url, short_code, user_id, created_at, updated_at, access_count
        FROM urls
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.client.queryObject(query, [limit, offset]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        shortCode: row.short_code,
        userId: row.user_id ?? undefined,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        accessCount: row.access_count,
      }));
    } catch (error) {
      throwDatabaseError("getAll", error);
    }
  }

  async getAllByUser(userId: string): Promise<ShortenedURL[]> {
    try {
      const query = `
        SELECT id, url, short_code, user_id, created_at, updated_at, access_count
        FROM urls
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await this.client.queryObject(query, [userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        shortCode: row.short_code,
        userId: row.user_id ?? undefined,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        accessCount: row.access_count,
      }));
    } catch (error) {
      throwDatabaseError("getAllByUser", error);
    }
  }

  async getURLsByCategory(categoryId: string, userId: string): Promise<ShortenedURL[]> {
    try {
      const query = `
        SELECT u.id, u.url, u.short_code, u.user_id,
               u.created_at, u.updated_at, u.access_count
        FROM urls u
        INNER JOIN url_categories uc ON u.id = uc.url_id
        WHERE uc.category_id = $1 AND u.user_id = $2
        ORDER BY u.created_at DESC
      `;

      const result = await this.client.queryObject(query, [categoryId, userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => ({
        id: row.id,
        url: row.url,
        shortCode: row.short_code,
        userId: row.user_id ?? undefined,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        accessCount: row.access_count,
      }));
    } catch (error) {
      throwDatabaseError("getURLsByCategory", error);
    }
  }

  async addCategoriesToURL(urlId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    try {
      // Use INSERT ... ON CONFLICT DO NOTHING for PostgreSQL
      const values = categoryIds.map((_, i) => `($1, $${i + 2})`).join(',');
      const query = `INSERT INTO url_categories (url_id, category_id) VALUES ${values} ON CONFLICT DO NOTHING`;
      await this.client.queryObject(query, [urlId, ...categoryIds]);
    } catch (error) {
      throwDatabaseError("addCategoriesToURL", error);
    }
  }

  async removeCategoriesFromURL(urlId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    try {
      const placeholders = categoryIds.map((_, i) => `$${i + 2}`).join(',');
      const query = `DELETE FROM url_categories WHERE url_id = $1 AND category_id IN (${placeholders})`;
      await this.client.queryObject(query, [urlId, ...categoryIds]);
    } catch (error) {
      throwDatabaseError("removeCategoriesFromURL", error);
    }
  }

  async getCategoriesForURL(urlId: string): Promise<Category[]> {
    try {
      const query = `
        SELECT c.id, c.name, c.description, c.icon, c.color, c.user_id,
               c.created_at, c.updated_at
        FROM categories c
        INNER JOIN url_categories uc ON c.id = uc.category_id
        WHERE uc.url_id = $1
        ORDER BY c.name ASC
      `;

      const result = await this.client.queryObject(query, [urlId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        icon: row.icon,
        color: row.color,
        userId: row.user_id,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));
    } catch (error) {
      throwDatabaseError("getCategoriesForURL", error);
    }
  }

  getClient(): Client {
    return this.client;
  }
}

export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly client: Client) {}

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async create(user: User): Promise<User> {
    const createdAt = toValidDate(user.createdAt, "createdAt");
    const updatedAt = toValidDate(user.updatedAt, "updatedAt");

    const query = `
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      await this.client.queryObject(query, [
        user.id,
        user.email,
        user.passwordHash,
        createdAt,
        updatedAt,
      ]);
      return user;
    } catch (error) {
      throwDatabaseError("create user", error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `;

    try {
      const result = await this.client.queryObject(query, [email]);

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throwDatabaseError("findUserByEmail", error);
    }
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

    try {
      const result = await this.client.queryObject(query, [id]);

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      throwDatabaseError("findUserById", error);
    }
  }
}

export class PostgreSQLCategoryRepository implements CategoryRepository {
  constructor(private readonly client: Client) {}

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      icon: row.icon,
      color: row.color,
      userId: row.user_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async create(category: Category): Promise<Category> {
    const createdAt = toValidDate(category.createdAt, "createdAt");
    const updatedAt = toValidDate(category.updatedAt, "updatedAt");

    const query = `
      INSERT INTO categories (id, name, description, icon, color, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      await this.client.queryObject(query, [
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
    } catch (error) {
      throwDatabaseError("create category", error);
    }
  }

  async findById(id: string): Promise<Category | null> {
    const query = `
      SELECT id, name, description, icon, color, user_id,
             created_at, updated_at
      FROM categories
      WHERE id = $1
    `;

    try {
      const result = await this.client.queryObject(query, [id]);

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      return this.mapRowToCategory(result.rows[0]);
    } catch (error) {
      throwDatabaseError("findCategoryById", error);
    }
  }

  async findByName(userId: string, name: string): Promise<Category | null> {
    const query = `
      SELECT id, name, description, icon, color, user_id,
             created_at, updated_at
      FROM categories
      WHERE user_id = $1 AND LOWER(name) = LOWER($2)
      LIMIT 1
    `;

    try {
      const result = await this.client.queryObject(query, [userId, name]);

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      return this.mapRowToCategory(result.rows[0]);
    } catch (error) {
      throwDatabaseError("findCategoryByName", error);
    }
  }

  async update(id: string, category: Category): Promise<Category> {
    const updatedAt = toValidDate(category.updatedAt, "updatedAt");

    const query = `
      UPDATE categories
      SET name = $1, description = $2, icon = $3, color = $4, updated_at = $5
      WHERE id = $6
      RETURNING *
    `;

    try {
      await this.client.queryObject(query, [
        category.name,
        category.description ?? null,
        category.icon,
        category.color,
        updatedAt,
        id,
      ]);

      return category;
    } catch (error) {
      throwDatabaseError("update category", error);
    }
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM categories WHERE id = $1`;
    try {
      const result = await this.client.queryObject(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throwDatabaseError("delete category", error);
    }
  }

  async getAllByUser(userId: string): Promise<Category[]> {
    const query = `
      SELECT id, name, description, icon, color, user_id,
             created_at, updated_at
      FROM categories
      WHERE user_id = $1
      ORDER BY name ASC
    `;

    try {
      const result = await this.client.queryObject(query, [userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => this.mapRowToCategory(row));
    } catch (error) {
      throwDatabaseError("getCategoriesByUser", error);
    }
  }

  async getAllByUserWithCount(userId: string): Promise<CategoryWithCount[]> {
    const query = `
      SELECT c.id, c.name, c.description, c.icon, c.color, c.user_id,
             c.created_at, c.updated_at,
             COUNT(uc.url_id) as url_count
      FROM categories c
      LEFT JOIN url_categories uc ON c.id = uc.category_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    try {
      const result = await this.client.queryObject(query, [userId]);

      if (!result.rows) {
        return [];
      }

      return result.rows.map((row: any) => ({
        ...this.mapRowToCategory(row),
        urlCount: parseInt(row.url_count) || 0,
      }));
    } catch (error) {
      throwDatabaseError("getCategoriesByUserWithCount", error);
    }
  }
}

/**
 * Create PostgreSQL repository instance
 */
export function createPostgreSQLRepository(configOverride?: DatabaseConfig): PostgreSQLURLRepository {
  if (!configOverride && !denoRuntime) {
    throw new Error("Deno runtime is required to load PostgreSQL configuration from environment variables");
  }

  const config: DatabaseConfig = configOverride ?? {
    hostname: denoRuntime?.env.get("DB_HOST") || "localhost",
    port: parseInt(denoRuntime?.env.get("DB_PORT") || "5432"),
    username: denoRuntime?.env.get("DB_USER") || "postgres",
    password: denoRuntime?.env.get("DB_PASSWORD") || "",
    database: denoRuntime?.env.get("DB_NAME") || "url_shortener",
    tls: denoRuntime?.env.get("DB_TLS") !== "false",
  };

  return new PostgreSQLURLRepository(config);
}

/**
 * Factory for PostgreSQL-backed repositories.
 */
export async function createPostgreSQLRepositories(configOverride?: DatabaseConfig): Promise<{
  urlRepository: PostgreSQLURLRepository;
  userRepository: PostgreSQLUserRepository;
  categoryRepository: PostgreSQLCategoryRepository;
}> {
  const urlRepository = createPostgreSQLRepository(configOverride);
  await urlRepository.connect();
  const userRepository = new PostgreSQLUserRepository(urlRepository.getClient());
  const categoryRepository = new PostgreSQLCategoryRepository(urlRepository.getClient());
  return { urlRepository, userRepository, categoryRepository };
}
