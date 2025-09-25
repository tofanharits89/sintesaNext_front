import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next";
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";

// In-memory cache (per process) to reduce backend load in middleware.
// Note: Next.js middleware runs per server process (not a shared global cache).
// This cache does NOT persist across deployments/cold starts or across regions.
// Keep TTLs short to tolerate scale-out and cold starts without causing long-lived
// auth/health decisions.
const SESSION_VERIFY_TTL_MS = 30_000; // 30s - balance between freshness and performance
const sessionVerifyCache = new Map<string, { ok: boolean; exp: number }>();

/**
 * Validate session with backend using cookies only (no token extraction).
 * Caches results for a short TTL keyed by the incoming Cookie header.
 * Set noCache=true to bypass cache (useful for login/dashboard to avoid loops).
 */
async function validateSessionViaBackend(
  incomingCookie: string,
  noCache = false
): Promise<boolean> {
  const key = incomingCookie || "_no_cookie";
  const now = Date.now();
  if (!noCache) {
    const cached = sessionVerifyCache.get(key);
    if (cached && cached.exp > now) {
      if (DEBUG_AUTH) console.debug("[Auth] session verify cache hit");
      return cached.ok;
    }
  }

  try {
    const resp = await fetch(backendPath("/auth/session/validate"), {
      method: "GET",
      headers: incomingCookie ? { cookie: incomingCookie } : {},
      cache: "no-store",
    });
    const ok =
      resp.ok && Boolean((await resp.json().catch(() => ({})))?.success);
    if (!noCache)
      sessionVerifyCache.set(key, { ok, exp: now + SESSION_VERIFY_TTL_MS });
    return ok;
  } catch {
    if (!noCache) {
      sessionVerifyCache.set(key, {
        ok: false,
        exp: now + SESSION_VERIFY_TTL_MS,
      });
    }
    return false;
  }
}

const HEALTH_TTL_MS = 120_000; // 2 minutes - reduce health check frequency
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize path without basePath for checks
  const relPath = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

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
  const noCache = !isPublicPath;
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
