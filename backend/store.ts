/**
 * Data Store Layer - Repository Pattern Implementation
 *
 * DESIGN PATTERNS APPLIED:
 * 1. Repository Pattern: Abstracts data access logic from business logic
 * 2. Singleton Pattern: Single instance manages all URL data
 * 3. In-Memory Storage: Fast access, suitable for MVP (can swap to DB later)
 *
 * WHY THIS ARCHITECTURE:
 * - Repository pattern allows easy database migration (swap implementation)
 * - Interface-based design enables testing with mock implementations
 * - Separation of concerns: business logic doesn't know about storage details
 *
 * FUTURE SCALABILITY:
 * - Can replace with PostgreSQL/MongoDB/Redis implementation
 * - Interface contract remains the same, no code changes needed elsewhere
 * - Multiple implementations can coexist (cache + persistent store)
 */

import type { ShortenedURL, User } from "./types.ts";
import { NotFoundError } from "./types.ts";

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

/**
 * Repository interface defining data access contract
 *
 * SOLID PRINCIPLE: Dependency Inversion - depend on abstractions, not concretions
 * BENEFIT: Routes layer doesn't need to know how data is stored
 */
export interface URLRepository {
  create(url: ShortenedURL): Promise<ShortenedURL>;
  findByShortCode(shortCode: string): Promise<ShortenedURL | null>;
  findById(id: string): Promise<ShortenedURL | null>;
  update(shortCode: string, url: ShortenedURL): Promise<ShortenedURL>;
  delete(shortCode: string): Promise<boolean>;
  incrementAccessCount(shortCode: string): Promise<void>;
  shortCodeExists(shortCode: string): Promise<boolean>;
  getAllByUser(userId: string): Promise<ShortenedURL[]>;
  getURLsByCategory(categoryId: string, userId: string): Promise<ShortenedURL[]>;
  addCategoriesToURL(urlId: string, categoryIds: string[]): Promise<void>;
  removeCategoriesFromURL(urlId: string, categoryIds: string[]): Promise<void>;
  getCategoriesForURL(urlId: string): Promise<import("./types.ts").Category[]>;
}

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export interface CategoryRepository {
  create(category: import("./types.ts").Category): Promise<import("./types.ts").Category>;
  findById(id: string): Promise<import("./types.ts").Category | null>;
  findByName(userId: string, name: string): Promise<import("./types.ts").Category | null>;
  update(id: string, category: import("./types.ts").Category): Promise<import("./types.ts").Category>;
  delete(id: string): Promise<boolean>;
  getAllByUser(userId: string): Promise<import("./types.ts").Category[]>;
  getAllByUserWithCount(userId: string): Promise<import("./types.ts").CategoryWithCount[]>;
}

// ============================================================================
// IN-MEMORY IMPLEMENTATION
// ============================================================================

/**
 * In-memory implementation of URL repository
 *
 * DATA STRUCTURES CHOSEN:
 * 1. Map for O(1) lookups by shortCode (primary access pattern)
 * 2. Map for O(1) lookups by ID (needed for some operations)
 *
 * PERFORMANCE: O(1) for all operations except initialization
 * LIMITATION: Data is lost on restart (acceptable for MVP)
 *
 * PRODUCTION CONSIDERATION: For production, this would be replaced with:
 * - PostgreSQL for ACID compliance and complex queries
 * - Redis for ultra-fast caching layer
 * - MongoDB for flexible schema if needed
 */
export class InMemoryURLRepository implements URLRepository {
  /**
   * Primary data store: shortCode -> ShortenedURL
   *
   * WHY MAP OVER OBJECT:
   * - Better performance for frequent additions/deletions
   * - Can use any value as key (not just strings)
   * - Has size property
   * - More predictable behavior
   */
  private urlsByShortCode: Map<string, ShortenedURL> = new Map();

  /**
   * Secondary index: id -> shortCode
   *
   * INDEXING STRATEGY: Maintain secondary index for ID lookups
   * TRADEOFF: Uses more memory but provides O(1) ID lookups
   * ALTERNATIVE: Could iterate urlsByShortCode, but that's O(n)
   */
  private shortCodeById: Map<string, string> = new Map();

  /**
   * URL-Category relationship store: urlId -> categoryIds[]
   */
  private urlCategories: Map<string, string[]> = new Map();

  /**
   * Create a new shortened URL entry
   *
   * ATOMICITY: Both indexes updated together (simulates transaction)
   * ERROR HANDLING: If shortCode exists, could indicate collision
   *
   * @param url - The shortened URL to store
   * @returns Promise resolving to the stored URL
   */
  async create(url: ShortenedURL): Promise<ShortenedURL> {
    // DEFENSIVE PROGRAMMING: Check for duplicate shortCode
    // This shouldn't happen with good random generation, but prevents data corruption
    if (this.urlsByShortCode.has(url.shortCode)) {
      throw new Error(`ShortCode collision detected: ${url.shortCode}`);
    }

    // Store in both indexes atomically (in-memory, so it's synchronous)
    this.urlsByShortCode.set(url.shortCode, url);
    this.shortCodeById.set(url.id, url.shortCode);

    // Return a defensive copy to prevent external mutation
    // IMMUTABILITY: Caller can't modify the stored object
    return { ...url };
  }

  /**
   * Find URL by short code (most common operation)
   *
   * PERFORMANCE: O(1) lookup time
   * NULL OBJECT PATTERN: Returns null instead of throwing (caller decides how to handle)
   *
   * @param shortCode - The short code to look up
   * @returns Promise resolving to URL or null if not found
   */
  async findByShortCode(shortCode: string): Promise<ShortenedURL | null> {
    const url = this.urlsByShortCode.get(shortCode);

    // Return defensive copy to prevent external mutation
    return url ? { ...url } : null;
  }

  /**
   * Find URL by ID
   *
   * USE CASE: Admin operations, internal lookups
   * IMPLEMENTATION: Uses secondary index for O(1) performance
   *
   * @param id - The ID to look up
   * @returns Promise resolving to URL or null if not found
   */
  async findById(id: string): Promise<ShortenedURL | null> {
    const shortCode = this.shortCodeById.get(id);

    if (!shortCode) {
      return null;
    }

    return this.findByShortCode(shortCode);
  }

  /**
   * Update an existing URL
   *
   * CONSISTENCY: Validates existence before update
   * IMMUTABILITY: Creates new object with updated timestamp
   *
   * @param shortCode - The short code of the URL to update
   * @param url - The updated URL data
   * @returns Promise resolving to updated URL
   * @throws NotFoundError if shortCode doesn't exist
   */
  async update(shortCode: string, url: ShortenedURL): Promise<ShortenedURL> {
    const existing = this.urlsByShortCode.get(shortCode);

    if (!existing) {
      throw new NotFoundError(`URL with short code '${shortCode}' not found`);
    }

    // Update the record in primary index
    this.urlsByShortCode.set(shortCode, url);

    // Return defensive copy
    return { ...url };
  }

  /**
   * Delete a URL by short code
   *
   * ATOMICITY: Removes from both indexes
   * IDEMPOTENCY: Returns false if already deleted (safe to call multiple times)
   *
   * @param shortCode - The short code to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(shortCode: string): Promise<boolean> {
    const url = this.urlsByShortCode.get(shortCode);

    if (!url) {
      return false;
    }

    // Remove from both indexes
    this.urlsByShortCode.delete(shortCode);
    this.shortCodeById.delete(url.id);

    return true;
  }

  /**
   * Increment access count for analytics
   *
   * PERFORMANCE CONSIDERATION: In production, this would be:
   * - Queued/batched to reduce DB writes
   * - Cached in Redis and periodically flushed
   * - Sent to analytics pipeline asynchronously
   *
   * CURRENT IMPLEMENTATION: Synchronous update (simple for MVP)
   *
   * @param shortCode - The short code to increment
   * @throws NotFoundError if shortCode doesn't exist
   */
  async incrementAccessCount(shortCode: string): Promise<void> {
    const url = this.urlsByShortCode.get(shortCode);

    if (!url) {
      throw new NotFoundError(`URL with short code '${shortCode}' not found`);
    }

    // Increment counter and update timestamp
    // MUTATION: We mutate here for performance, but it's internal to the repository
    url.accessCount++;
    url.updatedAt = new Date().toISOString();

    // Update in store (technically redundant since we mutated, but explicit is better)
    this.urlsByShortCode.set(shortCode, url);
  }

  /**
   * Check if short code exists (for collision detection)
   *
   * USE CASE: Generating unique short codes
   * PERFORMANCE: O(1) lookup
   *
   * @param shortCode - The short code to check
   * @returns Promise resolving to true if exists
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    return this.urlsByShortCode.has(shortCode);
  }

  async getAllByUser(userId: string): Promise<ShortenedURL[]> {
    const results: ShortenedURL[] = [];

    for (const url of this.urlsByShortCode.values()) {
      if (url.userId === userId) {
        results.push({ ...url });
      }
    }

    return results;
  }

  async getURLsByCategory(categoryId: string, userId: string): Promise<ShortenedURL[]> {
    const results: ShortenedURL[] = [];

    for (const url of this.urlsByShortCode.values()) {
      if (url.userId === userId) {
        const categories = this.urlCategories.get(url.id) || [];
        if (categories.includes(categoryId)) {
          results.push({ ...url });
        }
      }
    }

    return results;
  }

  async addCategoriesToURL(urlId: string, categoryIds: string[]): Promise<void> {
    const existing = this.urlCategories.get(urlId) || [];
    const updated = new Set([...existing, ...categoryIds]);
    this.urlCategories.set(urlId, Array.from(updated));
  }

  async removeCategoriesFromURL(urlId: string, categoryIds: string[]): Promise<void> {
    const existing = this.urlCategories.get(urlId) || [];
    const toRemove = new Set(categoryIds);
    const updated = existing.filter(id => !toRemove.has(id));
    this.urlCategories.set(urlId, updated);
  }

  getCategoryIdsForURL(urlId: string): string[] {
    return this.urlCategories.get(urlId) || [];
  }

  async getCategoriesForURL(urlId: string): Promise<import("./types.ts").Category[]> {
    // This will be resolved after categoryRepository is instantiated
    // Temporary return empty array
    return [];
  }

  /**
   * Get total number of URLs (for monitoring/debugging)
   *
   * OPERATIONAL VISIBILITY: Useful for metrics and monitoring
   *
   * @returns Number of stored URLs
   */
  size(): number {
    return this.urlsByShortCode.size;
  }

  /**
   * Clear all data (for testing/development)
   *
   * DANGER: Should not be exposed in production API
   * USE CASE: Test cleanup, development reset
   */
  clear(): void {
    this.urlsByShortCode.clear();
    this.shortCodeById.clear();
    this.urlCategories.clear();
  }
}

// ============================================================================
// CATEGORY REPOSITORY IMPLEMENTATION
// ============================================================================

export class InMemoryCategoryRepository implements CategoryRepository {
  private categoriesById: Map<string, import("./types.ts").Category> = new Map();
  private categoriesByUser: Map<string, Set<string>> = new Map();

  async create(category: import("./types.ts").Category): Promise<import("./types.ts").Category> {
    // Check for duplicate name for this user
    const existing = await this.findByName(category.userId, category.name);
    if (existing) {
      throw new Error(`Category with name '${category.name}' already exists`);
    }

    this.categoriesById.set(category.id, { ...category });

    if (!this.categoriesByUser.has(category.userId)) {
      this.categoriesByUser.set(category.userId, new Set());
    }
    this.categoriesByUser.get(category.userId)!.add(category.id);

    return { ...category };
  }

  async findById(id: string): Promise<import("./types.ts").Category | null> {
    const category = this.categoriesById.get(id);
    return category ? { ...category } : null;
  }

  async findByName(userId: string, name: string): Promise<import("./types.ts").Category | null> {
    const userCategoryIds = this.categoriesByUser.get(userId) || new Set();

    for (const categoryId of userCategoryIds) {
      const category = this.categoriesById.get(categoryId);
      if (category && category.name.toLowerCase() === name.toLowerCase()) {
        return { ...category };
      }
    }

    return null;
  }

  async update(id: string, category: import("./types.ts").Category): Promise<import("./types.ts").Category> {
    const existing = this.categoriesById.get(id);

    if (!existing) {
      throw new NotFoundError(`Category with id '${id}' not found`);
    }

    // Check for duplicate name if name is being changed
    if (category.name !== existing.name) {
      const duplicate = await this.findByName(category.userId, category.name);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Category with name '${category.name}' already exists`);
      }
    }

    this.categoriesById.set(id, category);
    return { ...category };
  }

  async delete(id: string): Promise<boolean> {
    const category = this.categoriesById.get(id);

    if (!category) {
      return false;
    }

    this.categoriesById.delete(id);
    this.categoriesByUser.get(category.userId)?.delete(id);

    return true;
  }

  async getAllByUser(userId: string): Promise<import("./types.ts").Category[]> {
    const userCategoryIds = this.categoriesByUser.get(userId) || new Set();
    const results: import("./types.ts").Category[] = [];

    for (const categoryId of userCategoryIds) {
      const category = this.categoriesById.get(categoryId);
      if (category) {
        results.push({ ...category });
      }
    }

    return results;
  }

  async getAllByUserWithCount(userId: string): Promise<import("./types.ts").CategoryWithCount[]> {
    const categories = await this.getAllByUser(userId);
    const results: import("./types.ts").CategoryWithCount[] = [];

    for (const category of categories) {
      const urlCount = await this.getURLCountForCategory(category.id, userId);
      results.push({ ...category, urlCount });
    }

    return results;
  }

  private async getURLCountForCategory(categoryId: string, userId: string): Promise<number> {
    const urls = await urlRepository.getURLsByCategory(categoryId, userId);
    return urls.length;
  }

  clear(): void {
    this.categoriesById.clear();
    this.categoriesByUser.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global singleton instance of the repository
 *
 * SINGLETON PATTERN: Ensures single source of truth for data
 *
 * WHY SINGLETON HERE:
 * - In-memory store needs to be shared across all requests
 * - Prevents multiple instances with inconsistent data
 * - Simple lifecycle management
 *
 * DEPENDENCY INJECTION ALTERNATIVE:
 * In larger apps, we'd use DI container instead:
 * - Better testability (can inject mock)
 * - More flexible lifecycle management
 * - Easier to swap implementations
 *
 * For this project, singleton is simpler and sufficient
 */
const urlRepoInstance = new InMemoryURLRepository();
export const categoryRepository: CategoryRepository = new InMemoryCategoryRepository();

// Helper to resolve category details for URLs
export async function getCategoriesForURL(urlId: string): Promise<import("./types.ts").Category[]> {
  const categoryIds = urlRepoInstance.getCategoryIdsForURL(urlId);
  const categories: import("./types.ts").Category[] = [];

  for (const categoryId of categoryIds) {
    const category = await categoryRepository.findById(categoryId);
    if (category) {
      categories.push(category);
    }
  }

  return categories;
}

// Override the method to use the helper
urlRepoInstance.getCategoriesForURL = getCategoriesForURL;

export const urlRepository: URLRepository = urlRepoInstance;

export class InMemoryUserRepository implements UserRepository {
  private usersById: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map();

  async create(user: User): Promise<User> {
    if (this.usersByEmail.has(user.email.toLowerCase())) {
      throw new Error("Email already in use");
    }

    this.usersById.set(user.id, { ...user });
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return { ...user };
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = this.usersByEmail.get(email.toLowerCase());
    if (!id) {
      return null;
    }
    const user = this.usersById.get(id);
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.usersById.get(id);
    return user ? { ...user } : null;
  }
}

export const userRepository: UserRepository = new InMemoryUserRepository();
