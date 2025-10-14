/**
 * API Client - Type-safe HTTP client for URL Shortener API
 *
 * DESIGN PATTERNS:
 * 1. API Client Pattern: Encapsulates all API calls in one place
 * 2. Error Handling: Consistent error handling across all requests
 * 3. Type Safety: Full TypeScript types for requests and responses
 *
 * WHY THIS MATTERS:
 * - Single source of truth for API interactions
 * - Easy to mock for testing
 * - Centralized error handling and retry logic
 * - Type safety prevents runtime errors
 *
 * SCALABILITY:
 * - Easy to add authentication headers
 * - Can add request/response interceptors
 * - Can implement caching layer
 * - Can add retry logic for failed requests
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Shared type definitions between frontend and backend
 *
 * FUTURE IMPROVEMENT: Could import from shared package or generate from OpenAPI spec
 * CURRENT: Duplicated for simplicity (backend types are source of truth)
 */

export interface ShortenedURL {
  id: string;
  url: string;
  shortCode: string;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  userId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithCount extends Category {
  urlCount: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface CreateURLRequest {
  url: string;
  categoryIds?: string[];
}

export interface UpdateURLRequest {
  url: string;
  categoryIds?: string[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface ErrorResponse {
  error: string;
  details?: string[];
  code?: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

/**
 * Custom error class for API errors
 *
 * WHY CUSTOM ERROR: Allows catching specifically API errors vs other errors
 * INCLUDES: HTTP status, error message, and validation details
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * API Client for URL Shortener service
 *
 * SINGLETON PATTERN: Single instance configured with base URL
 * BENEFITS:
 * - Consistent configuration across app
 * - Easy to swap implementation for testing
 * - Centralized request/response handling
 */
export class URLShortenerAPI {
  private baseURL: string;
  private authToken: string | null = null;

  /**
   * Initialize API client with base URL
   *
   * CONFIGURATION: Base URL from environment or default to localhost
   * PRODUCTION: Should use environment variable
   *
   * @param baseURL - Base URL of the API
   */
  constructor(baseURL?: string) {
    // Use provided URL or default to localhost backend
    this.baseURL = baseURL || "http://localhost:8000";
  }

  /**
   * Generic fetch wrapper with error handling
   *
   * ERROR HANDLING STRATEGY:
   * - Catches network errors
   * - Parses JSON error responses
   * - Throws APIError with status and details
   *
   * FUTURE ENHANCEMENTS:
   * - Retry logic for transient failures
   * - Request timeout handling
   * - Request cancellation support
   *
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @returns Parsed JSON response
   * @throws APIError on failure
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Build full URL
      const url = `${this.baseURL}${endpoint}`;

      // Set default headers
      const headers = new Headers(options.headers ?? {});
      headers.set("Content-Type", "application/json");

      if (this.authToken) {
        headers.set("Authorization", `Bearer ${this.authToken}`);
      }

      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle error responses
      if (!response.ok) {
        // Try to parse error response
        let errorData: ErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if response is not JSON
          errorData = {
            error: response.statusText || "Unknown error",
            code: "UNKNOWN_ERROR",
          };
        }

        throw new APIError(
          response.status,
          errorData.error,
          errorData.details,
          errorData.code
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      // Re-throw APIError as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Wrap network errors
      // NETWORK ERRORS: fetch throws TypeError for network failures
      throw new APIError(
        0,
        error instanceof Error ? error.message : "Network error",
        undefined,
        "NETWORK_ERROR"
      );
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async register(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<{ user: PublicUser }> {
    return this.request<{ user: PublicUser }>("/me", {
      method: "GET",
    });
  }

  async getUserURLs(): Promise<{ urls: ShortenedURL[] }> {
    return this.request<{ urls: ShortenedURL[] }>("/urls", {
      method: "GET",
    });
  }

  /**
   * Create a new shortened URL
   *
   * POST /shorten
   *
   * @param url - The long URL to shorten
   * @param categoryIds - Optional array of category IDs
   * @returns Promise with created shortened URL
   * @throws APIError on validation or server errors
   */
  async createShortURL(url: string, categoryIds?: string[]): Promise<ShortenedURL> {
    const request: CreateURLRequest = { url, categoryIds };

    return this.request<ShortenedURL>("/shorten", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get original URL from short code
   *
   * GET /shorten/:shortCode
   *
   * @param shortCode - The short code to look up
   * @returns Promise with URL details
   * @throws APIError if short code not found
   */
  async getURL(shortCode: string): Promise<ShortenedURL> {
    return this.request<ShortenedURL>(`/shorten/${shortCode}`, {
      method: "GET",
    });
  }

  /**
   * Update an existing shortened URL
   *
   * PUT /shorten/:shortCode
   *
   * @param shortCode - The short code to update
   * @param url - The new URL
   * @param categoryIds - Optional array of category IDs
   * @returns Promise with updated URL
   * @throws APIError if short code not found or validation fails
   */
  async updateURL(shortCode: string, url: string, categoryIds?: string[]): Promise<ShortenedURL> {
    const request: UpdateURLRequest = { url, categoryIds };

    return this.request<ShortenedURL>(`/shorten/${shortCode}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete a shortened URL
   *
   * DELETE /shorten/:shortCode
   *
   * @param shortCode - The short code to delete
   * @returns Promise that resolves when deleted
   * @throws APIError if short code not found
   */
  async deleteURL(shortCode: string): Promise<void> {
    await this.request<void>(`/shorten/${shortCode}`, {
      method: "DELETE",
    });
  }

  /**
   * Get statistics for a shortened URL
   *
   * GET /shorten/:shortCode/stats
   *
   * @param shortCode - The short code to get stats for
   * @returns Promise with URL statistics
   * @throws APIError if short code not found
   */
  async getStats(shortCode: string): Promise<ShortenedURL> {
    return this.request<ShortenedURL>(`/shorten/${shortCode}/stats`, {
      method: "GET",
    });
  }

  /**
   * Increment access count for a shortened URL
   *
   * POST /shorten/:shortCode/access
   *
   * Called after successful redirect to track usage
   *
   * @param shortCode - The short code that was accessed
   * @returns Promise that resolves when incremented
   */
  async incrementAccess(shortCode: string): Promise<void> {
    await this.request<{ success: boolean }>(`/shorten/${shortCode}/access`, {
      method: "POST",
    });
  }

  /**
   * Build full short URL for display/sharing
   *
   * UTILITY METHOD: Constructs the full short URL
   * This uses the /:shortCode redirect endpoint (NOT /shorten/:shortCode API)
   *
   * @param shortCode - The short code
   * @returns Full short URL that redirects to original
   */
  getShortURL(shortCode: string): string {
    return `${this.baseURL}/${shortCode}`;
  }

  // ==========================================================================
  // CATEGORY METHODS
  // ==========================================================================

  /**
   * Get all categories for the authenticated user
   *
   * GET /categories
   *
   * @returns Promise with array of categories with URL counts
   */
  async getCategories(): Promise<{ categories: CategoryWithCount[] }> {
    return this.request<{ categories: CategoryWithCount[] }>("/categories", {
      method: "GET",
    });
  }

  /**
   * Create a new category
   *
   * POST /categories
   *
   * @param data - Category creation data
   * @returns Promise with created category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a category
   *
   * PUT /categories/:categoryId
   *
   * @param categoryId - The category ID to update
   * @param data - Category update data
   * @returns Promise with updated category
   */
  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<Category> {
    return this.request<Category>(`/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a category
   *
   * DELETE /categories/:categoryId
   *
   * @param categoryId - The category ID to delete
   * @returns Promise that resolves when deleted
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await this.request<void>(`/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get all URLs in a category
   *
   * GET /categories/:categoryId
   *
   * @param categoryId - The category ID
   * @returns Promise with array of URLs in the category
   */
  async getURLsByCategory(categoryId: string): Promise<{ urls: ShortenedURL[] }> {
    return this.request<{ urls: ShortenedURL[] }>(`/categories/${categoryId}`, {
      method: "GET",
    });
  }

  /**
   * Add categories to a URL
   *
   * POST /shorten/:shortCode/categories
   *
   * @param shortCode - The short code of the URL
   * @param categoryIds - Array of category IDs to add
   * @returns Promise that resolves when added
   */
  async addCategoriesToURL(shortCode: string, categoryIds: string[]): Promise<void> {
    await this.request<{ success: boolean }>(`/shorten/${shortCode}/categories`, {
      method: "POST",
      body: JSON.stringify({ categoryIds }),
    });
  }

  /**
   * Remove categories from a URL
   *
   * DELETE /shorten/:shortCode/categories
   *
   * @param shortCode - The short code of the URL
   * @param categoryIds - Array of category IDs to remove
   * @returns Promise that resolves when removed
   */
  async removeCategoriesFromURL(shortCode: string, categoryIds: string[]): Promise<void> {
    await this.request<{ success: boolean }>(`/shorten/${shortCode}/categories`, {
      method: "DELETE",
      body: JSON.stringify({ categoryIds }),
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default API client instance
 *
 * USAGE: Import and use throughout the app
 * CONFIGURATION: Reads API URL from environment variable
 *
 * ENVIRONMENT VARIABLES:
 * - VITE_API_URL: Base URL for API (e.g., https://api.example.com)
 */
const envMeta = import.meta as ImportMeta & {
  env?: Record<string, string>;
};

export const api = new URLShortenerAPI(
  envMeta.env?.VITE_API_URL || "http://localhost:8000"
);

// Export for testing with different configuration
export default api;
