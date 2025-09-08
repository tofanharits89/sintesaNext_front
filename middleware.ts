import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next";
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";

// Simple in-memory cache for session verification to reduce backend load
const SESSION_VERIFY_TTL_MS = 20_000; // 20 seconds
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
    if (!noCache) sessionVerifyCache.set(key, { ok, exp: now + SESSION_VERIFY_TTL_MS });
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

const HEALTH_TTL_MS = 15_000;
let healthCache: { ok: boolean; exp: number } | null = null;

async function isBackendHealthy() {
  const now = Date.now();
  if (healthCache && healthCache.exp > now) {
    if (DEBUG_AUTH) console.debug("[Auth] health cache hit");
    return healthCache.ok;
  }

  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 1500);
    const resp = await fetch(backendPath("/auth/health"), {
      method: "GET",
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timeout);
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
      // Set path relative to current base path. Do NOT prepend BASE_PATH here,
      // because Next middleware will apply basePath automatically.
      url.pathname = `/server-error`;
      return NextResponse.redirect(url);
    }
  }

// Validate session via backend using cookies only (no token extraction)
  const incomingCookie = request.headers.get("cookie") || "";
  // Avoid cached auth decision on login/dashboard to prevent redirect loops
  const noCache = relPath.startsWith("/login") || relPath.startsWith("/dashboard");
  const isAuth = await validateSessionViaBackend(incomingCookie, noCache);

  // Handle root path: redirect to appropriate base path
  if (relPath === "/") {
    const url = request.nextUrl.clone();
    url.pathname = isAuth ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!isAuth && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuth && relPath.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Pass through, set request header for route visibility, and ensure no caching on protected pages
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-public-route", isPublicPath ? "1" : "0");
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!isPublicPath) {
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export const config = {
  matcher: ["/", "/((?!_next|favicon.ico|api/public).*)"],
};
