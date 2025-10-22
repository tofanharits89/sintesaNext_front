/**
 * Consolidated Next.js Middleware - Industry Standard 2025
 *
 * Replaces complex service-oriented architecture with simple, maintainable code
 * Follows Next.js 15 best practices: no response bodies, only redirects/rewrites
 *
 * Architecture:
 * - Simple utility functions instead of service classes
 * - Optimistic cookie-based validation (no DB calls in middleware)
 * - Clear separation of concerns
 * - Single file for easier maintenance
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { detectIpBlock } from "@/utils/ipBlock";
import { getAuthCache, setAuthCache, hashKey } from "@/lib/auth/utils-server";

// Route definitions
const PROTECTED_ROUTES = [
  "/dashboard",
  "/inquiry-data",
  "/admin",
  "/profile",
  "/users",
  "/settings",
  "/messages",
  "/notifications",
  "/makan-bergizi",
  "/data-supplier",
  "/epa",
  "/log-user",
  "/pengaturan",
  "/satker",
  "/transfer-daerah",
  "/tentang-kita",
];

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/",
  "/server-error",
  "/unauthorized",
  "/ip-blocked",
  "/test-rbac",
  "/test-skeletons",
  "/debug-user",
];

// Import unified configuration
import { config as appConfig } from "@/lib/config";

// Environment-based configuration
const ENV = {
  // Use server-side API URL (automatically handles Docker internal vs localhost)
  API_BASE_URL: appConfig.apiUrl.replace('/api/v1', ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG_AUTH: appConfig.debugAuth,
  // Allow optimistic auth only in development
  OPTIMISTIC_AUTH: appConfig.isDevelopment,
} as const;

// Feature flag: protect-by-default (no behavior change unless enabled)
const DEFAULT_PROTECT = process.env.NEXT_PUBLIC_DEFAULT_PROTECT === 'true';

// Cookie configuration
const COOKIE_CONFIG = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
} as const;

/**
 * Extract access token from HttpOnly cookie
 */
function extractAccessToken(request: NextRequest): string | null {
  // Prefer canonical name
  const primary = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN)?.value;
  if (primary) return primary;
  // Fallbacks for legacy cookie names to be resilient across envs
  const candidates = [
    "accessToken",
    "auth_token",
    "authToken",
    "token",
    "ACCESS_TOKEN",
    "AccessToken",
  ];
  for (const name of candidates) {
    const v = request.cookies.get(name)?.value;
    if (v) return v;
  }
  return null;
}

/**
 * Server-side session validation with proper token verification
 */
async function validateServerSession(accessToken: string, request: NextRequest): Promise<{ valid: boolean; user?: any; error?: string; ipBlocked?: boolean; ipParams?: { duration: string; blockedAt: string; reason: string } }> {
  try {
    // Prefer internal Next API proxy to avoid cross-origin cookie nuances
    const validateUrl = new URL('/api/auth/validate?include=user', request.url);
    const cookieHeader = request.headers.get("cookie") || `${COOKIE_CONFIG.ACCESS_TOKEN}=${accessToken}`;
    const response = await fetch(validateUrl, {
      method: "GET",
      headers: {
        // Forward full cookie header to preserve refresh token etc.
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: data.success && data.data?.valid,
        user: data.data?.user,
        error: !data.success ? data.error : undefined,
      };
    } else if (response.status === 403) {
      // Check for IP block and prepare redirect params
      try {
        const data = await response.json();
        const res = detectIpBlock(data);
        if (res.ipBlocked && res.params) {
          return { valid: false, error: "IP_BLOCKED", ipBlocked: true, ipParams: res.params };
        }
      } catch {}
      return { valid: false, error: "Forbidden" };
    } else {
      // If validation fails, assume invalid
      return { valid: false, error: "Server validation failed" };
    }
  } catch (error) {
    // Network error during validation - fail closed in production

    // In production, fail closed. In development, allow optimistic for convenience
    if (ENV.OPTIMISTIC_AUTH) {
      return { valid: true, error: "Network error (dev mode)" };
    }

    return { valid: false, error: "Authentication service unavailable" };
  }
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is public (login, register, etc.)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function needsAuth(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  return DEFAULT_PROTECT ? true : isProtectedRoute(pathname);
}

/**
 * Main middleware function - simplified and optimized
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // Skip middleware for API routes, static assets, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".ico") ||
    pathname.includes(".txt") ||
    pathname.includes(".xml") ||
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".svg")
  ) {
    return NextResponse.next();
  }

  // Handle public routes
  if (isPublicRoute(pathname)) {
    const token = extractAccessToken(request);
  
    // If user has a token and visits login/register, validate first
    if (token && (pathname === "/login" || pathname === "/register")) {
      const cacheKey = hashKey(token);
      const cached = getAuthCache(cacheKey);

      if (cached) {
        if (cached.valid) {
          return NextResponse.redirect(new URL("/dashboard/utama", request.url));
        }
        return NextResponse.next();
      }

      const validation = await validateServerSession(token, request);
      setAuthCache(cacheKey, { valid: validation.valid, user: validation.user });

      if (validation.valid) {
        return NextResponse.redirect(new URL("/dashboard/utama", request.url));
      }

      return NextResponse.next();
    }

    // If visiting login while IP is blocked, redirect to /ip-blocked instead of showing server-error
    if (pathname === "/login") {
      try {
        const resp = await fetch(`${ENV.API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (resp.status === 403) {
          try {
            const raw = await resp.json();
            const res = detectIpBlock(raw);
            if (res.ipBlocked && res.params) {
              const ipUrl = new URL('/ip-blocked', request.url);
              for (const [k, v] of Object.entries(res.params)) ipUrl.searchParams.set(k, v);
              return NextResponse.redirect(ipUrl);
            }
          } catch {}
        }
      } catch {}
    }

    return NextResponse.next();
  }

  // Handle protected routes (default-protect if flag enabled)
  if (needsAuth(pathname)) {
    const token = extractAccessToken(request);

    // No token - redirect to login with return URL
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists - check short-lived cache first
    const cacheKey = hashKey(token);
    const cached = getAuthCache(cacheKey);
    if (cached) {
      if (!cached.valid) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("returnTo", pathname);
        loginUrl.searchParams.set("reason", "session_expired");
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Token exists - server-side validation with fallback to optimistic
    const validation = await validateServerSession(token, request);
    // Store validation result in short-lived cache
    setAuthCache(cacheKey, { valid: validation.valid, user: validation.user });
    
    if (!validation.valid) {
      // Redirect blocked IPs to /ip-blocked instead of login
      if (validation.ipBlocked && validation.ipParams) {
        const ipUrl = new URL("/ip-blocked", request.url);
        for (const [k, v] of Object.entries(validation.ipParams)) {
          ipUrl.searchParams.set(k, v);
        }
        return NextResponse.redirect(ipUrl);
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      loginUrl.searchParams.set("reason", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
