/**
 * Core Type Definitions for URL Shortening Service
 *
 * DESIGN PATTERNS APPLIED:
 * 1. Strong Typing: All entities have explicit types to catch errors at compile-time
 * 2. Immutability: Using readonly properties where applicable for data integrity
 * 3. Separation of Concerns: DTOs (Data Transfer Objects) separate from Domain Models
 *
 * WHY THIS MATTERS:
 * - Type safety prevents runtime errors and makes refactoring safer
 * - DTOs allow different representations for API vs internal storage
 * - Validation schemas ensure data consistency across system boundaries
 */

// ============================================================================
// DOMAIN MODELS
// ============================================================================

/**
 * Core URL entity representing a shortened URL in the system
 *
 * DESIGN DECISION: Using string IDs instead of numbers
 * RATIONALE: UUIDs or nanoids scale better in distributed systems and avoid
 * sequential ID enumeration attacks where users could guess other URLs
 */
export interface ShortenedURL {
  readonly id: string;              // Unique identifier (UUID/nanoid)
  url: string;                      // Original long URL
  readonly shortCode: string;       // Unique short code for the URL
  readonly createdAt: string;       // ISO 8601 timestamp for audit trail
  updatedAt: string;                // ISO 8601 timestamp, mutable for updates
  accessCount: number;              // Usage analytics counter
  readonly userId?: string;         // Owner of the URL (optional for legacy entries)
}

export interface User {
  readonly id: string;
  email: string;
  passwordHash: string;
  readonly createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * Request DTO for creating a new shortened URL
 *
 * WHY SEPARATE DTO: The client shouldn't provide id, timestamps, or accessCount
 * These are system-generated to maintain data integrity
 */
export interface CreateURLRequest {
  url: string;                      // Only field the client needs to provide
}

/**
 * Request DTO for updating an existing URL
 *
 * FUTURE-PROOF: Currently only supports URL updates, but structured to
 * easily add more fields like customShortCode, expiryDate, etc.
 */
export interface UpdateURLRequest {
  url: string;
}

/**
 * Response DTO matching API specification
 *
 * DESIGN DECISION: Response matches domain model
 * ALTERNATIVE: Could have separate response type if we needed to hide fields
 */
export type URLResponse = ShortenedURL;

/**
 * Statistics response with access count
 *
 * FUTURE ENHANCEMENT: Could be extended with:
 * - Geographic distribution of accesses
 * - Referrer information
 * - Time-series access data
 */
export type URLStatsResponse = ShortenedURL;

// ============================================================================
// VALIDATION & ERROR HANDLING
// ============================================================================

/**
 * Standard error response structure
 *
 * BEST PRACTICE: Consistent error format across all endpoints
 * Makes client-side error handling predictable and easier
 */
export interface ErrorResponse {
  error: string;                    // User-friendly error message
  details?: string[];               // Optional validation details
  code?: string;                    // Machine-readable error code for i18n
}

/**
 * Custom error class for validation failures
 *
 * WHY CUSTOM ERROR: Allows middleware to differentiate between
 * validation errors (400) and other errors (500)
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Custom error for resource not found
 *
 * ADVANTAGE: Clear semantic meaning vs generic Error
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * URL validation with comprehensive checks
 *
 * SECURITY: Prevents injection attacks and ensures only valid HTTP(S) URLs
 * BEST PRACTICE: Centralized validation logic for reusability
 *
 * @param url - The URL string to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateURL(url: string): string[] {
  const errors: string[] = [];

  // Check if URL is provided
  if (!url || typeof url !== "string") {
    errors.push("URL is required and must be a string");
    return errors;
  }

  // Trim and check for empty string
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    errors.push("URL cannot be empty");
    return errors;
  }

  // Check URL length (prevent DoS via extremely long URLs)
  // SECURITY: Limit URL length to prevent memory exhaustion
  if (trimmedUrl.length > 2048) {
    errors.push("URL is too long (maximum 2048 characters)");
  }

  // Validate URL format using native URL constructor
  // ADVANTAGE: Uses browser-standard validation
  try {
    const parsedUrl = new URL(trimmedUrl);

    // Only allow HTTP and HTTPS protocols
    // SECURITY: Prevents javascript:, data:, file: protocol injection
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      errors.push("URL must use HTTP or HTTPS protocol");
    }

    // Ensure hostname exists
    // EDGE CASE: URLs like "http://" pass URL constructor but are invalid
    if (!parsedUrl.hostname) {
      errors.push("URL must have a valid hostname");
    }

  } catch (_error) {
    errors.push("URL is not valid");
  }

  return errors;
}

/**
 * Validates the entire create URL request
 *
 * EXTENSIBILITY: Easy to add more validation rules here
 *
 * @param request - The request object to validate
 * @throws ValidationError if validation fails
 */
export function validateCreateURLRequest(request: unknown): asserts request is CreateURLRequest {
  // Type guard: Ensure request is an object
  if (!request || typeof request !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const { url } = request as Partial<CreateURLRequest>;

  const errors = validateURL(url || "");

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}

/**
 * Validates update URL request
 *
 * REUSABILITY: Uses same validation logic as create
 *
 * @param request - The request object to validate
 * @throws ValidationError if validation fails
 */
export function validateUpdateURLRequest(request: unknown): asserts request is UpdateURLRequest {
  // Reuse create validation since they have the same structure
  validateCreateURLRequest(request);
}

function validateEmail(email: string): string[] {
  const errors: string[] = [];

  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
    return errors;
  }

  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) {
    errors.push("Email cannot be empty");
  }

  if (trimmed.length > 255) {
    errors.push("Email is too long (maximum 255 characters)");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    errors.push("Email is not valid");
  }

  return errors;
}

export function validateAuthCredentials(request: unknown): asserts request is AuthCredentials {
  if (!request || typeof request !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const { email, password } = request as Partial<AuthCredentials>;

  const errors: string[] = [];
  errors.push(...validateEmail(email || ""));

  if (!password || typeof password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (errors.length > 0) {
    throw new ValidationError("Validation failed", errors);
  }
}
