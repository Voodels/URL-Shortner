/**
 * HTTP Server - Main Application Entry Point
 *
 * ARCHITECTURE PATTERNS:
 * 1. Middleware Pipeline: Composable request processing
 * 2. Routing: URL pattern matching to handler functions
 * 3. CORS Handling: Cross-origin resource sharing for frontend
 * 4. Error Boundary: Catch-all error handling
 *
 * SECURITY FEATURES:
 * - CORS configured for specific origins (configurable for production)
 * - Request logging for audit trail
 * - Error handling that doesn't leak internals
 * - Input validation at route level
 *
 * PRODUCTION READINESS:
 * - Graceful shutdown handling
 * - Health check endpoint
 * - Request logging
 * - Environment-based configuration
 */

import { closeDatabase, initializeRepository } from "./database.ts";
import {
  createShortURL,
  deleteShortURL,
  getCurrentUser,
  getOriginalURL,
  getURLStats,
  getUserURLs,
  incrementAccessCount,
  loginUser,
  redirectToOriginalURL,
  registerUser,
  updateShortURL,
} from "./routes.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Server configuration from environment variables
 *
 * BEST PRACTICE: 12-Factor App - Configuration via environment
 * SECURITY: Sensitive config (API keys, DB URLs) should be in env vars
 * FLEXIBILITY: Easy to change behavior per environment without code changes
 */
const denoRuntime = (globalThis as { Deno?: any }).Deno;

if (!denoRuntime) {
  throw new Error("Deno runtime is required to run this server");
}

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173", // Vite dev server default
  "http://localhost:4173", // Vite preview default
  "http://localhost:3000", // Common React dev port
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3000",
];

const ENV_ALLOWED_ORIGINS = denoRuntime.env.get("ALLOWED_ORIGINS")
  ?.split(",")
  .map((origin: string) => origin.trim())
  .filter((origin: string) => origin.length > 0);

const CONFIG = {
  // Server port - default 8000 for Deno convention
  PORT: parseInt(denoRuntime.env.get("PORT") || "8000"),

  // Allowed CORS origins for security
  // PRODUCTION: Set to specific domains, not wildcard
  ALLOWED_ORIGINS: (ENV_ALLOWED_ORIGINS && ENV_ALLOWED_ORIGINS.length > 0)
    ? ENV_ALLOWED_ORIGINS
    : DEFAULT_ALLOWED_ORIGINS,

  // Enable request logging
  LOG_REQUESTS: denoRuntime.env.get("LOG_REQUESTS") !== "false",
};

function defaultPortForProtocol(protocol: string): string {
  switch (protocol) {
    case "http:":
      return "80";
    case "https:":
      return "443";
    default:
      return "";
  }
}

function resolveAllowedOrigin(origin: string): string | null {
  if (!origin) {
    return null;
  }

  if (CONFIG.ALLOWED_ORIGINS.includes("*")) {
    return "*";
  }

  if (CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  try {
    const originUrl = new URL(origin);

    for (const allowed of CONFIG.ALLOWED_ORIGINS) {
      if (allowed === "*") {
        return "*";
      }

      const allowedUrl = new URL(allowed);

      const hostsMatch = allowedUrl.hostname === originUrl.hostname ||
        (allowedUrl.hostname === "localhost" && originUrl.hostname === "127.0.0.1") ||
        (allowedUrl.hostname === "127.0.0.1" && originUrl.hostname === "localhost");

      if (!hostsMatch) {
        continue;
      }

      const protocolsMatch = allowedUrl.protocol === originUrl.protocol;
      if (!protocolsMatch) {
        continue;
      }

      const allowedPort = allowedUrl.port || defaultPortForProtocol(allowedUrl.protocol);
      const originPort = originUrl.port || defaultPortForProtocol(originUrl.protocol);

      if (allowedPort === originPort) {
        return origin;
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * CORS middleware - handles Cross-Origin Resource Sharing
 *
 * WHY NEEDED: Frontend runs on different port/domain than API
 * SECURITY: Restricts which origins can access API
 *
 * CORS PREFLIGHT: Browsers send OPTIONS request before actual request
 * We need to respond to OPTIONS with appropriate headers
 *
 * HEADERS EXPLAINED:
 * - Access-Control-Allow-Origin: Which origin can access (frontend domain)
 * - Access-Control-Allow-Methods: Which HTTP methods are allowed
 * - Access-Control-Allow-Headers: Which headers frontend can send
 * - Access-Control-Max-Age: How long to cache preflight response
 *
 * @param req - HTTP request
 * @param handler - Next handler in chain
 * @returns Response with CORS headers
 */
async function corsMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = resolveAllowedOrigin(origin);

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin === "*"
          ? "*"
          : allowedOrigin ?? "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 hours
        "Vary": "Origin",
      },
    });
  }

  // Process actual request
  const response = await handler(req);

  // Add CORS headers to response
  if (allowedOrigin) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      allowedOrigin === "*" ? "*" : origin,
    );
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

/**
 * Logging middleware - logs all incoming requests
 *
 * OBSERVABILITY: Track API usage and debug issues
 * PRODUCTION: Would integrate with logging service (Datadog, CloudWatch, etc.)
 *
 * LOGGED INFO:
 * - Timestamp
 * - HTTP method
 * - URL path
 * - Response status
 * - Response time
 *
 * @param req - HTTP request
 * @param handler - Next handler in chain
 * @returns Response from handler
 */
async function loggingMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  if (!CONFIG.LOG_REQUESTS) {
    return handler(req);
  }

  const startTime = Date.now();
  const url = new URL(req.url);

  try {
    // Process request
    const response = await handler(req);

    // Calculate response time
    const duration = Date.now() - startTime;

    // Log request details
    // FORMAT: [timestamp] METHOD path status duration
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${url.pathname} ${response.status} ${duration}ms`
    );

    return response;
  } catch (error) {
    // Log error
    const duration = Date.now() - startTime;
    console.error(
      `[${new Date().toISOString()}] ${req.method} ${url.pathname} ERROR ${duration}ms`,
      error
    );
    throw error;
  }
}

// ============================================================================
// ROUTING
// ============================================================================

/**
 * Request router - maps URL patterns to handler functions
 *
 * PATTERN MATCHING:
 * - Exact match: /health
 * - Parameter extraction: /shorten/:shortCode
 * - Sub-paths: /shorten/:shortCode/stats
 *
 * HTTP METHOD ROUTING:
 * - Different handlers per method (GET, POST, PUT, DELETE)
 *
 * DESIGN CHOICE: Manual routing vs framework
 * WHY MANUAL: Keep dependencies minimal, full control, explicit behavior
 * ALTERNATIVE: Could use Oak/Hono framework, but adds complexity
 *
 * @param req - HTTP request
 * @returns Response from matched route or 404
 */
async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  if (pathname === "/auth/register" && method === "POST") {
    return registerUser(req);
  }

  if (pathname === "/auth/login" && method === "POST") {
    return loginUser(req);
  }

  if (pathname === "/me" && method === "GET") {
    return getCurrentUser(req);
  }

  if (pathname === "/urls" && method === "GET") {
    return getUserURLs(req);
  }

  // Health check endpoint
  // USE CASE: Load balancer health checks, monitoring
  if (pathname === "/health" && method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: performance.now(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // POST /shorten - Create new short URL
  if (pathname === "/shorten" && method === "POST") {
    return createShortURL(req);
  }

  // Match pattern: /shorten/:shortCode
  const shortenMatch = pathname.match(/^\/shorten\/([^\/]+)$/);
  if (shortenMatch) {
    const shortCode = shortenMatch[1];

    // GET /shorten/:shortCode - Retrieve URL
    if (method === "GET") {
      return getOriginalURL(req, shortCode);
    }

    // PUT /shorten/:shortCode - Update URL
    if (method === "PUT") {
      return updateShortURL(req, shortCode);
    }

    // DELETE /shorten/:shortCode - Delete URL
    if (method === "DELETE") {
      return deleteShortURL(req, shortCode);
    }
  }

  // Match pattern: /shorten/:shortCode/stats
  const statsMatch = pathname.match(/^\/shorten\/([^\/]+)\/stats$/);
  if (statsMatch && method === "GET") {
    const shortCode = statsMatch[1];
    return getURLStats(req, shortCode);
  }

  // Match pattern: /shorten/:shortCode/access
  const accessMatch = pathname.match(/^\/shorten\/([^\/]+)\/access$/);
  if (accessMatch && method === "POST") {
    const shortCode = accessMatch[1];
    return incrementAccessCount(req, shortCode);
  }

  // Match pattern: /:shortCode - Direct redirect (for browser access)
  // IMPORTANT: This should be checked LAST (after all /shorten/ routes)
  // WHY: Catch-all pattern would match too broadly if placed earlier
  const directMatch = pathname.match(/^\/([a-zA-Z0-9]+)$/);
  if (directMatch && method === "GET") {
    const shortCode = directMatch[1];
    // Skip if it's a known route (health, etc.)
    if (shortCode !== "health") {
      return redirectToOriginalURL(req, shortCode);
    }
  }

  // No route matched - 404 Not Found
  return new Response(
    JSON.stringify({
      error: "Route not found",
      code: "NOT_FOUND",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ============================================================================
// REQUEST HANDLER
// ============================================================================

/**
 * Main request handler - composes middleware pipeline
 *
 * MIDDLEWARE CHAIN:
 * Request → Logging → CORS → Router → Response
 *
 * ERROR BOUNDARY: Try-catch at top level catches all errors
 * GRACEFUL DEGRADATION: Server stays up even if handler crashes
 *
 * @param req - HTTP request
 * @returns HTTP response
 */
async function handleRequest(req: Request): Promise<Response> {
  try {
    // Apply middleware in order
    return await loggingMiddleware(req, (req) =>
      corsMiddleware(req, router)
    );
  } catch (error) {
    // Top-level error handler
    // LOG: In production, send to error tracking
    console.error("Unhandled error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start HTTP server
 *
 * GRACEFUL SHUTDOWN:
 * - Catches SIGINT/SIGTERM signals
 * - Allows in-flight requests to complete
 * - Closes server cleanly
 *
 * PRODUCTION DEPLOYMENT:
 * - Behind reverse proxy (Nginx, Caddy)
 * - Process manager (PM2, systemd)
 * - Container orchestration (Docker, Kubernetes)
 */
async function startServer() {
  console.log(`🚀 URL Shortener API starting...`);

  // Initialize database connection
  await initializeRepository();

  console.log(`📡 Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`🌐 CORS enabled for: ${CONFIG.ALLOWED_ORIGINS.join(", ")}`);
  console.log(`📝 Request logging: ${CONFIG.LOG_REQUESTS ? "enabled" : "disabled"}`);
  console.log(`\n✅ Ready to accept requests!\n`);

  // Register shutdown handler for graceful cleanup
  const shutdownHandler = async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await closeDatabase();
    denoRuntime.exit(0);
  };

  // Listen for shutdown signals
  denoRuntime.addSignalListener("SIGINT", shutdownHandler);
  denoRuntime.addSignalListener("SIGTERM", shutdownHandler);

  // Start Deno HTTP server
  // Deno.serve is the modern API (replaces Deno.listen)
  await denoRuntime.serve({
    port: CONFIG.PORT,
    handler: handleRequest,
    // Graceful shutdown configuration
    onListen: ({ port, hostname }: { port: number; hostname: string }) => {
      console.log(`Listening on http://${hostname}:${port}`);
    },
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main entry point
 *
 * ERROR HANDLING: Catches startup errors
 * PROCESS EXIT: Exits with error code on failure
 */
const runtimeImportMeta = import.meta as ImportMeta & { main?: boolean };

if (runtimeImportMeta.main) {
  try {
    await startServer();
  } catch (error) {
    console.error("Failed to start server:", error);
    await closeDatabase();
    denoRuntime.exit(1);
  }
}

// Export for testing
export { handleRequest, router };
