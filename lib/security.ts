// =============================================================
// OpsPulse AI — Security Library
// Rate limiting, API key auth, input sanitization, audit logging
// =============================================================

// ─── Types ────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
  retryAfter: number; // seconds
}

export interface SecurityContext {
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  timestamp: number;
}

// ─── In-Memory Rate Limiter ───────────────────────────────────
// Sliding window counter per IP.
// NOTE: On Vercel serverless, each cold-start gets a fresh store.
// For multi-instance production, replace with Upstash Redis:
// https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  // Use Array.from for ES5-compatible iteration
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (now - entry.windowStart > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Sliding-window rate limiter.
 * @param identifier - Unique key (e.g. IP address or API key)
 * @param limit      - Max requests per window
 * @param windowMs   - Window duration in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanupStaleEntries(windowMs);

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfter: 0,
    };
  }

  if (entry.count >= limit) {
    const resetAt = entry.windowStart + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.windowStart + windowMs,
    retryAfter: 0,
  };
}

// ─── Rate Limit Presets ───────────────────────────────────────

export const RATE_LIMITS = {
  /** Standard API reads — 60 req/min per IP */
  api: { limit: 60, windowMs: 60_000 },
  /** Simulation endpoint — more expensive, tighter limit */
  simulate: { limit: 20, windowMs: 60_000 },
  /** Auth endpoints (future) — very tight */
  auth: { limit: 5, windowMs: 60_000 },
  /** Health/status — generous */
  health: { limit: 120, windowMs: 60_000 },
} as const;

// ─── API Key Validation ───────────────────────────────────────

/**
 * Validates the API key from the request header.
 * Expects: Authorization: Bearer <key>  OR  X-API-Key: <key>
 *
 * In production, set API_SECRET_KEY in environment variables.
 * If not set, API key auth is DISABLED (dev mode only).
 */
export function validateApiKey(authHeader: string | null, apiKeyHeader: string | null): boolean {
  const requiredKey = process.env.API_SECRET_KEY;

  // If no key is configured, skip auth (dev/demo mode)
  if (!requiredKey) return true;

  // Extract key from Authorization: Bearer <key>
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return timingSafeEqual(token, requiredKey);
  }

  // Extract key from X-API-Key header
  if (apiKeyHeader) {
    return timingSafeEqual(apiKeyHeader.trim(), requiredKey);
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Avoids early-exit comparisons that leak key length/content.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid timing leak on length
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Request Body Size Limiter ────────────────────────────────

/** Maximum allowed request body size in bytes (default: 64KB) */
export const MAX_BODY_SIZE = 64 * 1024; // 64 KB

/**
 * Checks Content-Length header against the max body size.
 * Returns false if the payload is too large.
 */
export function isBodySizeAcceptable(contentLength: string | null): boolean {
  if (!contentLength) return true; // No Content-Length header — allow (streaming)
  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return true;
  return size <= MAX_BODY_SIZE;
}

// ─── IP Extraction ────────────────────────────────────────────

/**
 * Extracts the real client IP from request headers.
 * Handles Vercel, Cloudflare, and standard proxy setups.
 */
export function getClientIp(headers: Headers): string {
  // Vercel
  const vercelIp = headers.get("x-real-ip");
  if (vercelIp) return vercelIp;

  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Standard proxy chain (take first IP — the original client)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}

// ─── Input Sanitization ───────────────────────────────────────

/**
 * Strips HTML tags and dangerous characters from a string.
 * Use on any string input before storing or displaying.
 */
export function sanitizeString(input: string, maxLength = 500): string {
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>"'`]/g, "") // Strip dangerous chars
    .replace(/javascript:/gi, "") // Strip JS protocol
    .replace(/on\w+\s*=/gi, "") // Strip event handlers
    .trim();
}

/**
 * Validates that a string is a safe identifier (alphanumeric + hyphens).
 * Use for siteId, shiftId, etc.
 */
export function isSafeIdentifier(value: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value);
}

// ─── Audit Logger ─────────────────────────────────────────────

export type AuditEventType =
  | "api_request"
  | "rate_limit_exceeded"
  | "auth_failure"
  | "auth_success"
  | "large_payload_rejected"
  | "validation_failure"
  | "simulation_run"
  | "suspicious_input";

export interface AuditEvent {
  event: AuditEventType;
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

/**
 * Structured audit logger.
 * In production, pipe this to your SIEM / log aggregator (Datadog, Splunk, etc.)
 * On Vercel, logs appear in the Functions tab of the dashboard.
 */
export function auditLog(event: AuditEvent): void {
  // Structured JSON log — easy to parse by log aggregators
  const logLine = JSON.stringify({
    level: isSecurityEvent(event.event) ? "WARN" : "INFO",
    service: "opspulse-ai",
    ...event,
  });

  if (isSecurityEvent(event.event)) {
    console.warn("[SECURITY]", logLine);
  } else {
    console.log("[AUDIT]", logLine);
  }
}

function isSecurityEvent(event: AuditEventType): boolean {
  return [
    "rate_limit_exceeded",
    "auth_failure",
    "large_payload_rejected",
    "suspicious_input",
  ].includes(event);
}

// ─── Safe Error Response ──────────────────────────────────────

/**
 * Returns a sanitized error response that never leaks stack traces
 * or internal implementation details to the client.
 */
export function safeErrorResponse(
  error: unknown,
  publicMessage: string,
  statusCode: number
): { message: string; code: number; timestamp: string } {
  // Log the real error server-side only
  if (process.env.NODE_ENV !== "production") {
    console.error("[Internal Error]", error);
  } else {
    // In production, log without stack trace details
    console.error("[Internal Error]", error instanceof Error ? error.message : "Unknown error");
  }

  return {
    message: publicMessage,
    code: statusCode,
    timestamp: new Date().toISOString(),
  };
}

// ─── CORS Validation ──────────────────────────────────────────

/**
 * Validates the Origin header against the allowed origins list.
 * Configure ALLOWED_ORIGINS in environment variables as comma-separated URLs.
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests have no Origin header

  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;

  // If not configured, only allow same-origin (no cross-origin)
  if (!allowedOriginsEnv) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return origin === appUrl || origin.startsWith("http://localhost:");
  }

  const allowedOrigins = allowedOriginsEnv.split(",").map((o) => o.trim());
  return allowedOrigins.includes(origin);
}

// ─── Security Headers for API Responses ──────────────────────

/**
 * Returns standard security headers to attach to every API response.
 */
export function getApiSecurityHeaders(
  rateLimitResult?: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
  };

  if (rateLimitResult) {
    headers["X-RateLimit-Remaining"] = String(rateLimitResult.remaining);
    headers["X-RateLimit-Reset"] = String(Math.ceil(rateLimitResult.resetAt / 1000));
    if (!rateLimitResult.allowed) {
      headers["Retry-After"] = String(rateLimitResult.retryAfter);
    }
  }

  return headers;
}
