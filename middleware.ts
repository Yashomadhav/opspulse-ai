// =============================================================
// OpsPulse AI — Edge Middleware (self-contained, no lib imports)
// Enforces: rate limiting, API key auth, CORS, body size limits
// Runs on Vercel Edge Runtime — must be self-contained.
// =============================================================

import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
};

// ─── In-Memory Rate Limiter ───────────────────────────────────
// NOTE: Edge runtime instances are ephemeral — each cold start
// resets the store. For persistent rate limiting across instances,
// use Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const store = new Map<string, RateLimitEntry>();

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfter: 0, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    const resetAt = entry.windowStart + windowMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((resetAt - now) / 1000),
      resetAt,
    };
  }
  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfter: 0,
    resetAt: entry.windowStart + windowMs,
  };
}

// ─── Timing-Safe Comparison ───────────────────────────────────
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
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

// ─── IP Extraction ────────────────────────────────────────────
function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

// ─── JSON Error Response ──────────────────────────────────────
function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, string>
): NextResponse {
  return new NextResponse(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      ...extra,
    },
  });
}

// ─── Main Middleware ──────────────────────────────────────────
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getIp(request);
  const origin = request.headers.get("origin");

  // ── Handle CORS preflight ────────────────────────────────────
  if (method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(origin),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── 1. CORS check ────────────────────────────────────────────
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`[SECURITY] CORS violation from origin=${origin} ip=${ip} path=${pathname}`);
    return errorResponse("Forbidden: origin not allowed", 403);
  }

  // ── 2. Body size check (64 KB max) ───────────────────────────
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > 64 * 1024) {
      console.warn(`[SECURITY] Oversized payload size=${size} ip=${ip} path=${pathname}`);
      return errorResponse("Payload too large", 413);
    }
  }

  // ── 3. Rate limiting ─────────────────────────────────────────
  const isSimulate = pathname.startsWith("/api/simulate");
  const limit = isSimulate ? 20 : 60; // simulate: 20/min, others: 60/min
  const windowMs = 60_000;
  const rlKey = `${ip}:${isSimulate ? "sim" : "api"}`;
  const rl = rateLimit(rlKey, limit, windowMs);

  if (!rl.allowed) {
    console.warn(`[SECURITY] Rate limit exceeded ip=${ip} path=${pathname} retryAfter=${rl.retryAfter}s`);
    return errorResponse("Too many requests. Please slow down.", 429, {
      "Retry-After": String(rl.retryAfter),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
    });
  }

  // ── 4. API key authentication ────────────────────────────────
  // Only active when API_SECRET_KEY env var is set.
  const requiredKey = process.env.API_SECRET_KEY;
  if (requiredKey) {
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");
    let authenticated = false;

    if (authHeader?.startsWith("Bearer ")) {
      authenticated = timingSafeEqual(authHeader.slice(7).trim(), requiredKey);
    } else if (apiKeyHeader) {
      authenticated = timingSafeEqual(apiKeyHeader.trim(), requiredKey);
    }

    if (!authenticated) {
      console.warn(`[SECURITY] Auth failure ip=${ip} path=${pathname}`);
      return errorResponse("Unauthorized: invalid or missing API key", 401, {
        "WWW-Authenticate": 'Bearer realm="OpsPulse AI API"',
      });
    }
  }

  // ── 5. Pass through with security + rate-limit headers ───────
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  if (origin && isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  }

  return response;
}

// ─── CORS Helpers ─────────────────────────────────────────────
function isOriginAllowed(origin: string): boolean {
  const allowedEnv = process.env.ALLOWED_ORIGINS;
  if (!allowedEnv) {
    // Dev: allow localhost; prod: allow same origin
    return (
      origin.startsWith("http://localhost:") ||
      origin === (process.env.NEXT_PUBLIC_APP_URL ?? "")
    );
  }
  return allowedEnv.split(",").map((o) => o.trim()).includes(origin);
}

function getAllowedOrigin(origin: string | null): string {
  if (!origin || !isOriginAllowed(origin)) return "null";
  return origin;
}
