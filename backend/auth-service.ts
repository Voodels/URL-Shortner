/**
 * Authentication Service Utilities
 *
 * RESPONSIBILITIES:
 * - Password hashing and verification (bcrypt)
 * - JWT creation and validation
 * - Helper utilities to expose public user profiles
 */

import { compare, hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import {
    create,
    getNumericDate,
    verify,
    type Header,
    type Payload,
} from "https://deno.land/x/djwt@v2.9/mod.ts";
import type { PublicUser, User } from "./types.ts";
import { AuthenticationError } from "./types.ts";

const denoRuntime = (globalThis as { Deno?: any }).Deno;

if (!denoRuntime) {
  throw new Error("Deno runtime is required for authentication service");
}

const JWT_SECRET = denoRuntime.env.get("JWT_SECRET");
const JWT_TTL = denoRuntime.env.get("JWT_TTL") ?? "7d"; // default 7 days
const JWT_ISSUER = denoRuntime.env.get("JWT_ISSUER") ?? "urlshortener";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

let cachedKey: CryptoKey | null = null;

/**
 * Converts a human-friendly duration string (e.g. "15m", "24h") into seconds.
 *
 * @param duration Raw TTL string from configuration.
 * @returns TTL expressed in whole seconds.
 * @throws Error when the value cannot be parsed or uses an unsupported unit.
 */
function parseDuration(duration: string): number {
  const trimmed = duration.trim();
  const match = trimmed.match(/^(\d+)([smhd])?$/i);

  if (!match) {
    throw new Error("Invalid JWT_TTL format. Use formats like '60s', '15m', '24h', or '7d'.");
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] ?? "s").toLowerCase();

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error("Unsupported duration unit for JWT_TTL");
  }
}

/**
 * Lazy-loads and caches the HMAC signing key used for JWT operations.
 *
 * @returns CryptoKey ready for signing/verifying tokens.
 */
async function getSigningKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey;
  }

  const encoder = new TextEncoder();
  const rawKey = encoder.encode(JWT_SECRET);
  cachedKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return cachedKey;
}

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param password Raw password supplied by the user.
 * @returns Strong bcrypt hash suitable for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/**
 * Verifies a plaintext password against an existing bcrypt hash.
 *
 * @param password Raw password to verify.
 * @param passwordHash Stored bcrypt hash from persistence layer.
 * @returns true when the password matches; false otherwise.
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export interface AuthTokenPayload {
  iss: string;
  sub: string;
  email: string;
  exp: number;
  iat: number;
}

/**
 * Creates a signed JWT embedding the minimal public user profile.
 *
 * @param user Authenticated public-facing user details.
 * @returns Signed JWT string ready to return to the client.
 */
export async function generateAuthToken(user: PublicUser): Promise<string> {
  const key = await getSigningKey();
  const header: Header = { alg: "HS256", typ: "JWT" };
  const issuedAt = getNumericDate(0);
  const expiresInSeconds = parseDuration(JWT_TTL);
  const payload: Payload = {
    iss: JWT_ISSUER,
    sub: user.id,
    email: user.email,
    iat: issuedAt,
    exp: getNumericDate(expiresInSeconds),
  };

  return create(header, payload, key);
}

/**
 * Confirms the validity of a JWT and extracts its claims.
 *
 * @param token Bearer token provided by the client.
 * @returns Parsed payload with issuer, subject, exp, etc.
 * @throws AuthenticationError when the token is missing/invalid/expired.
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  try {
    const key = await getSigningKey();
    const payload = await verify(token, key, "HS256");
    return payload as AuthTokenPayload;
  } catch (_error) {
    throw new AuthenticationError("Invalid or expired authentication token");
  }
}

/**
 * Strips sensitive fields from a User before returning to the client.
 *
 * @param user Internal persistence model.
 * @returns Public representation safe to expose in APIs.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Extracts and validates the Bearer token from an HTTP request.
 *
 * @param req Incoming request (typically from Oak or std/http).
 * @returns Verified token claims when the header is present and valid.
 * @throws AuthenticationError if the header is missing or the token fails verification.
 */
export async function ensureAuthHeader(req: Request): Promise<AuthTokenPayload> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Authorization header missing or malformed");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new AuthenticationError("Authorization token missing");
  }

  return verifyAuthToken(token);
}
