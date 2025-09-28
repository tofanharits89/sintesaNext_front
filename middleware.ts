import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";
const ENABLE_CACHE_INVALIDATION =
  process.env.ENABLE_CACHE_INVALIDATION === "1" || process.env.NODE_ENV === "production";
const CACHE_INVALIDATE_SECRET = process.env.CACHE_INVALIDATE_SECRET || "";

// In-memory cache (per process) to reduce backend load in middleware.
// Note: Next.js middleware runs per server process (not a shared global cache).
// This cache does NOT persist across deployments/cold starts or across regions.
// Security-optimized TTL configuration for authentication operations
// Requirement 4.1: TTL not exceeding 30 seconds for security-critical operations
const SESSION_VERIFY_TTL_MS = 15_000; // 15s - reduced for enhanced security
const MAX_CACHE_AGE_MS = 10_000; // 10s - maximum age for positive auth results

// Make cache globally accessible for CacheManager
declare global {
  var __middlewareSessionCache: Map<string, { ok: boolean; exp: number; created?: number; reason?: string }> | undefined;
  var __invalidateRateLimit: Map<string, { count: number; resetAt: number }> | undefined;
}

if (!globalThis.__middlewareSessionCache) {
  globalThis.__middlewareSessionCache = new Map<string, { ok: boolean; exp: number; created?: number; reason?: string }>();
}
const sessionVerifyCache = globalThis.__middlewareSessionCache;

if (!globalThis.__invalidateRateLimit) {
  globalThis.__invalidateRateLimit = new Map<string, { count: number; resetAt: number }>();
}
const invalidateRateLimit = globalThis.__invalidateRateLimit;

const HEX_HASH_REGEX = /^[a-f0-9]{64}$/i;

function isHexHash(value: unknown): value is string {
  return typeof value === "string" && HEX_HASH_REGEX.test(value);
}

async function computeSha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function extractAccessTokenValue(cacheKey: string): string | null {
  if (!cacheKey) return null;
  const marker = "accessToken=";
  const markerIndex = cacheKey.indexOf(marker);
  if (markerIndex === -1) return null;

  let tokenValue = cacheKey.slice(markerIndex + marker.length);
  const delimiterIndex = tokenValue.indexOf(";");
  if (delimiterIndex !== -1) {
    tokenValue = tokenValue.slice(0, delimiterIndex);
  }

  try {
    return decodeURIComponent(tokenValue);
  } catch {
    return tokenValue;
  }
}

async function findCacheKeysByTokenHash(tokenHash: string): Promise<string[]> {
  const matches: string[] = [];

  for (const key of sessionVerifyCache.keys()) {
    if (typeof key !== "string") {
      continue;
    }
    if (key.startsWith("bypass:")) {
      continue;
    }

    const tokenValue = extractAccessTokenValue(key);
    if (!tokenValue) {
      continue;
    }

    const computedHash = await computeSha256Hex(tokenValue);
    if (computedHash === tokenHash) {
      matches.push(key);
    }
  }

  return matches;
}

/**
 * Generate standardized cache key format to match backend standards
 * Backend uses format: "session:{tokenHash}" or "auth:{tokenHash}"
 * Frontend middleware uses the full cookie string as key for compatibility
 */
function generateCacheKey(incomingCookie: string): string {
  return incomingCookie || "_no_cookie";
}

/**
 * Check if cache should be bypassed for recently logged out sessions
 * Implements dynamic cache expiration based on logout events (Requirement 4.2)
 */
function shouldBypassCache(cacheKey: string): boolean {
  const bypassKey = `bypass:${cacheKey}`;
  const bypass = sessionVerifyCache.get(bypassKey);
  
  if (!bypass) return false;
  
  const now = Date.now();
  if (bypass.exp <= now) {
    // Cleanup expired bypass entry
    sessionVerifyCache.delete(bypassKey);
    return false;
  }
  
  if (DEBUG_AUTH) {
    console.debug("[Auth] Cache bypass active (dynamic expiration)", {
      cacheKey,
      reason: bypass.reason || 'logout_event',
      expiresAt: new Date(bypass.exp).toISOString(),
      remainingMs: bypass.exp - now
    });
  }
  
  return true;
}

/**
 * Check if cache entry has exceeded security-optimized TTL
 * Implements requirement 4.1: TTL not exceeding 30 seconds for security-critical operations
 */
function isSecurityExpired(cacheEntry: { ok: boolean; exp: number; created?: number }): boolean {
  const now = Date.now();
  
  // Standard expiration check
  if (cacheEntry.exp <= now) {
    return true;
  }
  
  // Additional security check for positive auth results
  if (cacheEntry.ok && cacheEntry.created) {
    const age = now - cacheEntry.created;
    if (age > MAX_CACHE_AGE_MS) {
      if (DEBUG_AUTH) {
        console.debug("[Auth] Cache entry expired due to security age limit", {
          age,
          maxAge: MAX_CACHE_AGE_MS
        });
      }
      return true;
    }
  }
  
  return false;
}

/**
 * Set cache bypass for logout events to implement dynamic expiration
 */
function setCacheBypassForLogout(cacheKey: string, reason: string = 'logout_event'): void {
  const bypassKey = `bypass:${cacheKey}`;
  const bypassDuration = 60000; // 60 seconds
  const bypassExpiry = Date.now() + bypassDuration;
  
  sessionVerifyCache.set(bypassKey, { 
    ok: false, 
    exp: bypassExpiry,
    reason,
    created: Date.now()
  });
  
  if (DEBUG_AUTH) {
    console.debug("[Auth] Cache bypass set for logout event", {
      cacheKey,
      reason,
      duration: bypassDuration,
      expiresAt: new Date(bypassExpiry).toISOString()
    });
  }
}

/**
 * Fallback authentication verification for cache misses
 * Always validates against backend when cache is bypassed or missing
 */
async function fallbackAuthVerification(incomingCookie: string): Promise<boolean> {
  if (DEBUG_AUTH) {
    console.debug("[Auth] Performing fallback authentication verification");
  }
  
  try {
    const resp = await fetch(backendPath("/auth/session/validate"), {
      method: "GET",
      headers: incomingCookie ? { cookie: incomingCookie } : {},
      cache: "no-store",
    });
    
    const result = resp.ok && Boolean((await resp.json().catch(() => ({})))?.success);
    
    if (DEBUG_AUTH) {
      console.debug("[Auth] Fallback verification result", {
        success: result,
        status: resp.status,
        hasCookie: !!incomingCookie
      });
    }
    
    return result;
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Fallback verification failed", error);
    }
    return false;
  }
}

/**
 * Validate session with backend using cookies only (no token extraction).
 * Caches results for a short TTL keyed by the incoming Cookie header.
 * Set noCache=true to bypass cache (useful for login/dashboard to avoid loops).
 * Implements fallback verification for cache misses and bypassed sessions.
 */
async function validateSessionViaBackend(
  incomingCookie: string,
  noCache = false
): Promise<boolean> {
  const key = generateCacheKey(incomingCookie);
  const now = Date.now();
  
  // Check if we should bypass cache for this session (recently logged out)
  const shouldBypass = shouldBypassCache(key);
  if (!noCache && shouldBypass) {
    if (DEBUG_AUTH) console.debug("[Auth] cache bypass active for session");
    noCache = true;
  }
  
  // Try cache first if not bypassed
  if (!noCache) {
    const cached = sessionVerifyCache.get(key);
    if (cached && cached.exp > now) {
      // Security expiration check (Requirement 4.1)
      if (!isSecurityExpired(cached)) {
        // Use cached result if it passes security checks
        if (DEBUG_AUTH) {
          console.debug("[Auth] session verify cache hit (security validated)", {
            result: cached.ok,
            securityChecked: true
          });
        }
        return cached.ok;
      } else {
        // Cache entry expired due to security rules, remove it
        sessionVerifyCache.delete(key);
        if (DEBUG_AUTH) {
          console.debug("[Auth] cache entry removed due to security expiration", {
            key: key.substring(0, 20) + '...'
          });
        }
      }
    }
  }

  // Cache miss or bypass - use fallback verification
  let authResult: boolean;
  
  if (shouldBypass || noCache) {
    // Use fallback verification for bypassed sessions or explicit no-cache requests
    authResult = await fallbackAuthVerification(incomingCookie);
  } else {
    // Standard verification with caching
    try {
      const resp = await fetch(backendPath("/auth/session/validate"), {
        method: "GET",
        headers: incomingCookie ? { cookie: incomingCookie } : {},
        cache: "no-store",
      });
      authResult = resp.ok && Boolean((await resp.json().catch(() => ({})))?.success);
    } catch {
      authResult = false;
    }
  }

  // Cache the result only if not bypassed and not explicitly no-cache
  if (!noCache && !shouldBypass) {
    sessionVerifyCache.set(key, { 
      ok: authResult, 
      exp: now + SESSION_VERIFY_TTL_MS,
      created: now // Add creation timestamp for security checks
    });
  }

  return authResult;
}

const HEALTH_TTL_MS = 60_000; // 1 minute - security-optimized health check frequency
let healthCache: { ok: boolean; exp: number } | null = null;

async function isBackendHealthy() {
  const now = Date.now();
  if (healthCache && healthCache.exp > now) {
    if (DEBUG_AUTH) console.debug("[Auth] health cache hit");
    return healthCache.ok;
  }

  const timeoutMs = 2500; // allow a bit more time than before

  // Prefer a fast HEAD probe first
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), timeoutMs);
    const headResp = await fetch(backendPath("/auth/health"), {
      method: "HEAD",
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timeout);
    const ok = headResp.ok;
    healthCache = { ok, exp: now + HEALTH_TTL_MS };
    return ok;
  } catch {
    // Fallback to GET (some proxies/CDNs strip HEAD or mishandle it)
    try {
      const ac2 = new AbortController();
      const timeout2 = setTimeout(() => ac2.abort(), timeoutMs);
      const resp = await fetch(backendPath("/auth/health"), {
        method: "GET",
        cache: "no-store",
        signal: ac2.signal,
      });
      clearTimeout(timeout2);
      const ok =
        resp.ok &&
        Boolean(
          (await resp.json().catch(() => ({})))?.success ||
            (
              await resp
                .clone()
                .json()
                .catch(() => ({}))
            )?.status === "healthy"
        );
      healthCache = { ok, exp: now + HEALTH_TTL_MS };
      return ok;
    } catch {
      healthCache = { ok: false, exp: now + HEALTH_TTL_MS };
      return false;
    }
  }
}

/**
 * Handle cache invalidation requests in middleware
 * This allows immediate cache clearing without waiting for API route processing
 */
async function handleCacheInvalidation(request: NextRequest): Promise<NextResponse | null> {
  try {
    const body = await request.json();
    
    if (!body.sessionKey || typeof body.sessionKey !== 'string') {
      return NextResponse.json({
        success: false,
        error: "sessionKey is required",
        code: "INVALID_REQUEST",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform immediate cache clearing
    const sessionKey = generateCacheKey(body.sessionKey);
    const clearedKeySet = new Set<string>();
    const matchedCacheKeys = new Set<string>();

    // Clear the specific session cache
    if (sessionVerifyCache.has(sessionKey)) {
      sessionVerifyCache.delete(sessionKey);
      clearedKeySet.add(`middleware:${sessionKey}`);
      matchedCacheKeys.add(sessionKey);
    }

    // Clear variations of the session key
    const keysToCheck = [
      body.sessionKey,
      `accessToken=${body.sessionKey}`,
      `accessToken=${encodeURIComponent(body.sessionKey)}`
    ];

    for (const key of keysToCheck) {
      const cacheKey = generateCacheKey(key);
      if (sessionVerifyCache.has(cacheKey)) {
        sessionVerifyCache.delete(cacheKey);
        clearedKeySet.add(`middleware:${cacheKey}`);
        matchedCacheKeys.add(cacheKey);
      }
    }

    // If the backend provided a token hash, search for matching cached cookie entries
    const tokenHashCandidate =
      typeof body.tokenHash === 'string' && isHexHash(body.tokenHash)
        ? body.tokenHash
        : isHexHash(body.sessionKey)
          ? body.sessionKey
          : null;

    if (tokenHashCandidate) {
      const hashMatches = await findCacheKeysByTokenHash(tokenHashCandidate);
      for (const cacheKey of hashMatches) {
        if (sessionVerifyCache.has(cacheKey)) {
          sessionVerifyCache.delete(cacheKey);
        }
        clearedKeySet.add(`middleware:${cacheKey}`);
        matchedCacheKeys.add(cacheKey);
      }
    }

    // Add cache bypass for post-logout requests (dynamic expiration - Requirement 4.2)
    if (body.type === 'logout') {
      const bypassTargets = new Set<string>();

      if (extractAccessTokenValue(sessionKey)) {
        bypassTargets.add(sessionKey);
      }

      for (const cacheKey of matchedCacheKeys) {
        if (extractAccessTokenValue(cacheKey)) {
          bypassTargets.add(cacheKey);
        }
      }

      for (const target of bypassTargets) {
        setCacheBypassForLogout(target, 'logout_event');
        clearedKeySet.add(`bypass:${target}`);
      }
      
      // Also set bypass for user-level cache if userId is provided
      if (body.userId) {
        setCacheBypassForLogout(`user:${body.userId}`, 'user_logout');
        clearedKeySet.add(`bypass:user:${body.userId}`);
      }
    }

    if (DEBUG_AUTH) {
      console.log("[Middleware] Cache invalidation completed", {
        sessionKey: body.sessionKey,
        type: body.type,
        clearedKeys: Array.from(clearedKeySet)
      });
    }

    return NextResponse.json({
      success: true,
      message: `Middleware cache invalidated for session: ${body.sessionKey}`,
      clearedKeys: Array.from(clearedKeySet),
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error("[Middleware] Cache invalidation error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error during cache invalidation",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Since we removed basePath, use pathname directly
  const relPath = BASE_PATH && pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

  // Handle cache invalidation requests in middleware for immediate processing
  if (relPath === "/api/auth/invalidate-cache" && request.method === "POST") {
    // Feature gating: allow only if explicitly enabled or in production
    if (!ENABLE_CACHE_INVALIDATION) {
      return NextResponse.json({
        success: false,
        error: "Not enabled",
        code: "DISABLED",
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    // Basic per-IP rate limiting for this sensitive endpoint
    const now = Date.now();
    const windowMs = 60_000; // 1 minute window
    const maxRequests = 20; // burst limit per minute
    const fwdFor = request.headers.get("x-forwarded-for") || "";
    const ip = (fwdFor.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
    const key = `invalidate:${ip}`;
    const entry = invalidateRateLimit.get(key);
    if (!entry || entry.resetAt <= now) {
      invalidateRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > maxRequests) {
        return NextResponse.json({
          success: false,
          error: "Too many requests",
          code: "RATE_LIMITED",
          timestamp: new Date().toISOString(),
        }, { status: 429, headers: { "Retry-After": Math.ceil((entry.resetAt - now) / 1000).toString() } });
      }
    }

    // Strict same-origin verification (Origin and Referer must match request origin/host when present)
    const reqOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");
    const sameOrigin = (() => {
      try {
        if (originHeader) {
          const o = new URL(originHeader);
          const r = new URL(reqOrigin);
          if (o.origin !== r.origin) return false;
        }
        if (refererHeader) {
          const ref = new URL(refererHeader);
          const r = new URL(reqOrigin);
          if (ref.origin !== r.origin) return false;
        }
        return true;
      } catch {
        return false;
      }
    })();

    // Internal signals
    const userAgent = request.headers.get("user-agent") || "";
    const internalSignal =
      userAgent.includes("Next.js") || request.headers.get("x-internal-request") === "true";

    // Optional shared-secret signature. If secret configured, require valid signature.
    let signatureOk = true;
    if (CACHE_INVALIDATE_SECRET) {
      try {
        const raw = await request.clone().text();
        const enc = new TextEncoder();
        const data = enc.encode(`${CACHE_INVALIDATE_SECRET}:${raw}`);
        const digest = await crypto.subtle.digest("SHA-256", data);
        const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
        const sig = (request.headers.get("x-internal-signature") || "").trim();
        signatureOk = sig.length > 0 && sig.toLowerCase() === hex;
      } catch {
        signatureOk = false;
      }
    }

    const authorized = sameOrigin && internalSignal && signatureOk;
    if (!authorized) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized access to internal endpoint",
        code: !sameOrigin ? "FORBIDDEN_ORIGIN" : !internalSignal ? "FORBIDDEN_SIGNAL" : "FORBIDDEN_SIGNATURE",
        timestamp: new Date().toISOString(),
      }, { status: 403 });
    }

    return await handleCacheInvalidation(request);
  }

  // Treat all API routes as pass-through (auth handled inside API handlers)
  const isApiRoute = relPath.startsWith("/api/");
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Determine public routes (still show 500 when backend is down)
  const isPublicPath =
    relPath === "/login" ||
    relPath.startsWith("/login") ||
    relPath.startsWith("/api/auth");

  // Early: Skip health check for static assets and the server-error page itself
  const isStatic =
    relPath.startsWith("/_next") ||
    relPath.startsWith("/favicon.ico") ||
    relPath.startsWith("/api/public") ||
    relPath.startsWith("/images") ||
    relPath.startsWith("/icons") ||
    relPath.startsWith("/server-error");

  // Early: If backend is unhealthy, redirect to server-error page
  if (!isStatic) {
    const healthyEarly = await isBackendHealthy();
    if (!healthyEarly) {
      const url = request.nextUrl.clone();
      // Do NOT prepend BASE_PATH here; Next middleware applies basePath automatically
      url.pathname = `/server-error`;
      return NextResponse.redirect(url);
    }
  }

  // Validate session via backend using cookies only (no token extraction)
  // Prefer NextRequest cookies API for reliability across runtimes
  const accessToken = request.cookies.get("accessToken")?.value?.trim();
  const filteredCookie = accessToken ? `accessToken=${encodeURIComponent(accessToken)}` : "";

  // Local fast-fail: if no accessToken cookie present, treat as unauthenticated
  if (!isPublicPath && !filteredCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    if (DEBUG_AUTH) {
      res.headers.set("x-auth-debug", "no-accessToken;redirect-login");
      res.headers.set("x-auth-relpath", relPath);
    }
    return res;
  }
  
  // Avoid cached auth decision on ALL non-public routes to prevent stale "authenticated" states
  // When a token expires between requests, we want an immediate redirect instead of waiting for TTL
  // Also bypass cache if this session was recently logged out
  const cacheKey = generateCacheKey(filteredCookie);
  const noCache = !isPublicPath || shouldBypassCache(cacheKey);
  const isAuth = await validateSessionViaBackend(filteredCookie, noCache);

  // Handle root path: redirect to appropriate base path
  if (relPath === "/") {
    const url = request.nextUrl.clone();
    // Do NOT prepend BASE_PATH here; Next middleware applies basePath automatically
    url.pathname = isAuth ? `/dashboard` : `/login`;
    return NextResponse.redirect(url);
  }

  if (!isAuth && !isPublicPath) {
    const url = request.nextUrl.clone();
    // Do NOT prepend BASE_PATH here; Next middleware applies basePath automatically
    url.pathname = `/login`;
    return NextResponse.redirect(url);
  }

  if (isAuth && relPath.startsWith("/login")) {
    const url = request.nextUrl.clone();
    // Do NOT prepend BASE_PATH here; Next middleware applies basePath automatically
    url.pathname = `/dashboard`;
    return NextResponse.redirect(url);
  }

  // Pass through, set request header for route visibility, and ensure no caching on protected pages
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-public-route", isPublicPath ? "1" : "0");
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!isPublicPath) {
    res.headers.set("Cache-Control", "no-store");
  }
  if (DEBUG_AUTH) {
    res.headers.set("x-auth-public", isPublicPath ? "1" : "0");
    res.headers.set("x-auth-isAuth", isAuth ? "1" : "0");
    res.headers.set("x-auth-hasAccessToken", filteredCookie ? "1" : "0");
    res.headers.set("x-auth-relpath", relPath);
  }
  return res;
}

export const config = {
  matcher: ["/", "/((?!_next|favicon.ico|api/public).*)"],
};
