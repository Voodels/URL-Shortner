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

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

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

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  try {
    const key = await getSigningKey();
    const payload = await verify(token, key, "HS256");
    return payload as AuthTokenPayload;
  } catch (_error) {
    throw new AuthenticationError("Invalid or expired authentication token");
  }
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

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
