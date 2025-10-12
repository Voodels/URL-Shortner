/**
 * API Routes - RESTful Endpoint Implementations
 *
 * DESIGN PATTERNS APPLIED:
 * 1. RESTful Architecture: Resources identified by URLs, HTTP methods indicate actions
 * 2. Service Layer Pattern: Routes delegate to repository for data operations
 * 3. Error Handling Middleware: Centralized error responses
 *
 * HTTP STATUS CODES USED (Following REST Best Practices):
 * - 200 OK: Successful GET, PUT operations
 * - 201 Created: Successful POST (resource creation)
 * - 204 No Content: Successful DELETE
 * - 400 Bad Request: Validation errors
 * - 404 Not Found: Resource doesn't exist
 * - 500 Internal Server Error: Unexpected errors
 *
 * SECURITY CONSIDERATIONS:
 * - Input validation on all endpoints
 * - Rate limiting ready (add middleware)
 * - CORS configured
 * - No sensitive data in error messages
 */

import {
    ensureAuthHeader,
    generateAuthToken,
    hashPassword,
    toPublicUser,
    verifyPassword,
} from "./auth-service.ts";
import { getRepository, getUserRepository } from "./database.ts";
import type {
    AuthCredentials,
    AuthResponse,
    ShortenedURL,
    User
} from "./types.ts";
import {
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    validateAuthCredentials,
    validateCreateURLRequest,
    validateUpdateURLRequest,
    type ErrorResponse,
} from "./types.ts";

async function requireUser(req: Request): Promise<User> {
  const payload = await ensureAuthHeader(req);
  const user = await getUserRepository().findById(payload.sub);

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return user;
}

function assertOwnership(user: User, url: ShortenedURL | null): void {
  if (!url) {
    return;
  }

  if (url.userId && url.userId !== user.id) {
    throw new AuthorizationError("You do not have access to this resource");
  }
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

export async function registerUser(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    validateAuthCredentials(body);

    const { email, password } = body as AuthCredentials;
    const normalizedEmail = email.trim().toLowerCase();

    const userRepo = getUserRepository();
    const existing = await userRepo.findByEmail(normalizedEmail);

    if (existing) {
      throw new ValidationError("Email is already registered");
    }

    const passwordHash = await hashPassword(password);
    const timestamp = new Date().toISOString();

    const user: User = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await userRepo.create(user);

    const publicUser = toPublicUser(user);
    const token = await generateAuthToken(publicUser);

    const response: AuthResponse = {
      token,
      user: publicUser,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function loginUser(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    validateAuthCredentials(body);

    const { email, password } = body as AuthCredentials;
    const normalizedEmail = email.trim().toLowerCase();

    const userRepo = getUserRepository();
    const user = await userRepo.findByEmail(normalizedEmail);

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const publicUser = toPublicUser(user);
    const token = await generateAuthToken(publicUser);

    const response: AuthResponse = {
      token,
      user: publicUser,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getCurrentUser(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const publicUser = toPublicUser(user);

    return new Response(JSON.stringify({ user: publicUser }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserURLs(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const urls = await getRepository().getAllByUser(user.id);

    return new Response(JSON.stringify({ urls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// SHORT CODE GENERATION
// ============================================================================

/**
 * Generates a cryptographically random short code
 *
 * ALGORITHM CHOICE: Base62 encoding (a-z, A-Z, 0-9)
 *
 * WHY BASE62:
 * - URL-safe (no special characters needing encoding)
 * - 62^6 = ~56 billion possible codes (6 chars)
 * - More compact than hex/base64 with URL-safe characters
 * - Human-readable and copyable
 *
 * COLLISION HANDLING:
 * - Checks repository for duplicates
 * - Retries up to MAX_RETRIES times
 * - Exponentially rare with good random source
 *
 * SECURITY: Uses crypto.randomUUID() for cryptographic randomness
 * Prevents prediction of short codes (security through obscurity layer)
 *
 * @param length - Length of short code to generate (default 6)
 * @returns A unique short code
 * @throws Error if unable to generate unique code after retries
 */
async function generateShortCode(length = 6): Promise<string> {
  const BASE62_CHARS =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const MAX_RETRIES = 10;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Generate random code from Base62 alphabet
    let shortCode = "";

    // Use crypto API for cryptographically secure random numbers
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      // Map random byte to Base62 character
      const index = randomValues[i] % BASE62_CHARS.length;
      shortCode += BASE62_CHARS[index];
    }

    // Check for collision
    const exists = await getRepository().shortCodeExists(shortCode);

    if (!exists) {
      return shortCode;
    }

    // LOGGING: In production, log collisions for monitoring
    console.warn(`Short code collision detected on attempt ${attempt + 1}`);
  }

  // RARE CASE: Failed to generate unique code after retries
  // With 62^6 space and good randomness, this is extremely unlikely
  throw new Error(
    "Failed to generate unique short code after maximum retries"
  );
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /shorten - Create a new shortened URL
 *
 * BUSINESS LOGIC:
 * 1. Validate request body
 * 2. Generate unique short code
 * 3. Create URL entity with metadata
 * 4. Store in repository
 * 5. Return 201 Created with entity
 *
 * ERROR CASES:
 * - 400: Invalid URL format, missing URL, validation errors
 * - 500: Short code generation failure, storage failure
 *
 * @param req - HTTP request
 * @returns Response with created URL or error
 */
export async function createShortURL(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);

    // Parse and validate request body
    const body = await req.json();
    validateCreateURLRequest(body);

    const { url } = body;

    // Generate unique short code with collision handling
    const shortCode = await generateShortCode();

    // Create URL entity with all required fields
    // DESIGN DECISION: Server generates all metadata for data integrity
    const shortenedURL: ShortenedURL = {
      id: crypto.randomUUID(), // UUID v4 for globally unique ID
      url: url.trim(),
      shortCode,
      createdAt: new Date().toISOString(), // ISO 8601 format for consistency
      updatedAt: new Date().toISOString(),
      accessCount: 0, // Initialize counter
      userId: user.id,
    };

    // Persist to repository
    const created = await getRepository().create(shortenedURL);

    // Return 201 Created with Location header (REST best practice)
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        // Location header tells client where to find the new resource
        Location: `/shorten/${shortCode}`,
      },
    });
  } catch (error) {
    // Delegate to error handler
    return handleError(error);
  }
}

/**
 * GET /shorten/:shortCode - Retrieve original URL from short code
 *
 * BUSINESS LOGIC:
 * 1. Extract shortCode from URL
 * 2. Look up in repository
 * 3. Return URL data (frontend handles redirect)
 *
 * DESIGN DECISION: API returns data, frontend does redirect
 * WHY: Separates concerns, allows frontend to show preview/stats before redirect
 * ALTERNATIVE: Could do server-side 301/302 redirect, but less flexible
 *
 * ERROR CASES:
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns Response with URL data or error
 */
export async function getOriginalURL(
  req: Request,
  shortCode: string
): Promise<Response> {
  try {
    // Look up URL by short code
    const url = await getRepository().findByShortCode(shortCode);

    if (!url) {
      // Return 404 with helpful error message
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    // Return 200 OK with URL data
    return new Response(JSON.stringify(url), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache-Control: Allow caching for performance
        // CONSIDERATION: Short enough to allow updates, long enough to reduce load
        "Cache-Control": "public, max-age=300", // 5 minutes
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /:shortCode - Redirect to original URL (direct browser access)
 *
 * BUSINESS LOGIC:
 * 1. Extract shortCode from URL
 * 2. Look up in repository
 * 3. Increment access count for analytics
 * 4. Return 302 redirect to original URL
 *
 * DESIGN DECISION: 302 (Temporary) vs 301 (Permanent) redirect
 * WHY 302:
 * - Allows tracking each access (301 gets cached by browsers)
 * - Allows URL updates (if original URL changes, users get new destination)
 * - Better for analytics and statistics
 *
 * USE CASE: Direct browser access (user clicks link or types in browser)
 * DIFFERENCE: /shorten/:shortCode returns JSON, /:shortCode redirects
 *
 * ERROR CASES:
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns 302 redirect response or error
 */
export async function redirectToOriginalURL(
  req: Request,
  shortCode: string
): Promise<Response> {
  try {
    // Look up URL by short code
    const url = await getRepository().findByShortCode(shortCode);

    if (!url) {
      // Return 404 with helpful error message
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    // Increment access count for analytics (fire and forget)
    // Don't await to avoid slowing down redirect
    getRepository().incrementAccessCount(shortCode).catch((err) => {
      console.error(`Failed to increment access count for ${shortCode}:`, err);
    });

    // Return 302 Found (temporary redirect)
    // IMPORTANT: Set Location header to original URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.url,
        // No caching - we want to track every access
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /shorten/:shortCode - Update an existing shortened URL
 *
 * BUSINESS LOGIC:
 * 1. Validate request body
 * 2. Look up existing URL
 * 3. Update with new data
 * 4. Update timestamp
 * 5. Return updated entity
 *
 * IDEMPOTENCY: PUT is idempotent - calling multiple times with same data has same effect
 *
 * DESIGN DECISION: shortCode cannot be changed
 * WHY: Short codes are the primary identifier; changing them would break links
 * FUTURE: Could add "custom short code" feature with validation
 *
 * ERROR CASES:
 * - 400: Invalid URL format, validation errors
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns Response with updated URL or error
 */
export async function updateShortURL(
  req: Request,
  shortCode: string
): Promise<Response> {
  try {
    const user = await requireUser(req);

    // Parse and validate request body
    const body = await req.json();
    validateUpdateURLRequest(body);

    const { url } = body;

    // Verify URL exists
    const existing = await getRepository().findByShortCode(shortCode);

    if (!existing) {
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    assertOwnership(user, existing);

    // Create updated entity
    // IMMUTABILITY: Create new object rather than mutating existing
    const updated: ShortenedURL = {
      ...existing, // Keep existing fields
      url: url.trim(), // Update URL
      updatedAt: new Date().toISOString(), // Update timestamp
      // NOTE: accessCount is preserved, not reset
    };

    // Persist update
    const result = await getRepository().update(shortCode, updated);

    // Return 200 OK with updated entity
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /shorten/:shortCode - Delete a shortened URL
 *
 * BUSINESS LOGIC:
 * 1. Attempt to delete from repository
 * 2. Return 204 if successful, 404 if not found
 *
 * IDEMPOTENCY: DELETE is idempotent - deleting already-deleted resource returns 404
 * REST COMPLIANCE: 204 No Content has no response body
 *
 * SECURITY CONSIDERATION: In production, might want:
 * - Authentication/authorization
 * - Soft delete (mark as deleted but keep data)
 * - Audit logging
 *
 * ERROR CASES:
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns Response with no content or error
 */
export async function deleteShortURL(
  req: Request,
  shortCode: string
): Promise<Response> {
  try {
    const user = await requireUser(req);

    const existing = await getRepository().findByShortCode(shortCode);

    if (!existing) {
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    assertOwnership(user, existing);

    // Attempt deletion
    const deleted = await getRepository().delete(shortCode);

    if (!deleted) {
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    // Return 204 No Content (REST standard for successful DELETE)
    // No response body needed
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /shorten/:shortCode/stats - Get access statistics for a short URL
 *
 * BUSINESS LOGIC:
 * 1. Look up URL by short code
 * 2. Return full entity (includes accessCount)
 *
 * ANALYTICS: Currently tracks only total count
 * FUTURE ENHANCEMENTS:
 * - Referrer tracking
 * - Geographic distribution
 * - Time-series data (accesses per day/hour)
 * - User agent analysis
 * - Click-through rate if used with marketing campaigns
 *
 * ERROR CASES:
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns Response with statistics or error
 */
export async function getURLStats(
  req: Request,
  shortCode: string
): Promise<Response> {
  try {
    const user = await requireUser(req);
    // Look up URL
    const url = await getRepository().findByShortCode(shortCode);

    if (!url) {
      throw new NotFoundError(`Short URL '${shortCode}' not found`);
    }

    assertOwnership(user, url);

    // Return full entity (contains accessCount)
    // CONSIDERATION: Could return only stats fields, but full entity is more useful
    return new Response(JSON.stringify(url), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /shorten/:shortCode/access - Increment access counter
 *
 * USAGE: Called by frontend after successful redirect
 *
 * DESIGN DECISION: Separate endpoint for incrementing
 * WHY: Allows GET /shorten/:shortCode to remain idempotent and cacheable
 * ALTERNATIVE: Could increment on GET, but that violates HTTP semantics
 *
 * PRODUCTION CONSIDERATION:
 * - This could be queued/batched for better performance
 * - Could use analytics service (Google Analytics, Mixpanel)
 * - Could send to data pipeline asynchronously
 *
 * ERROR CASES:
 * - 404: Short code not found
 * - 500: Storage failure
 *
 * @param req - HTTP request
 * @param shortCode - Short code from URL parameter
 * @returns Response confirming increment or error
 */
export async function incrementAccessCount(
  _req: Request,
  shortCode: string
): Promise<Response> {
  try {
    // Increment counter in repository
    await getRepository().incrementAccessCount(shortCode);

    // Return 200 OK (could also return 204)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Centralized error handler for all routes
 *
 * ERROR HANDLING STRATEGY:
 * - Catch all errors in route handlers
 * - Delegate to this function for consistent error responses
 * - Map error types to appropriate HTTP status codes
 * - Return user-friendly error messages (no stack traces to client)
 * - Log detailed errors server-side
 *
 * SECURITY: Never expose internal error details to client
 * OBSERVABILITY: Log errors with context for debugging
 *
 * @param error - The error to handle
 * @returns Response with appropriate status code and error message
 */
function handleError(error: unknown): Response {
  // Type-safe error handling
  if (error instanceof ValidationError) {
    // 400 Bad Request for validation errors
    const errorResponse: ErrorResponse = {
      error: error.message,
      details: error.details,
      code: "VALIDATION_ERROR",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof NotFoundError) {
    // 404 Not Found for missing resources
    const errorResponse: ErrorResponse = {
      error: error.message,
      code: "NOT_FOUND",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof AuthenticationError) {
    const errorResponse: ErrorResponse = {
      error: error.message,
      code: "UNAUTHORIZED",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof AuthorizationError) {
    const errorResponse: ErrorResponse = {
      error: error.message,
      code: "FORBIDDEN",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 500 Internal Server Error for unexpected errors
  // LOG: In production, send to error tracking service (Sentry, Rollbar, etc.)
  console.error("Unexpected error:", error);

  const errorResponse: ErrorResponse = {
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
