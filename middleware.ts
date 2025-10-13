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
import { getAuthCache, setAuthCache, hashKey } from "@/utils/auth-cache";

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

// Environment-based configuration
const ENV = {
  // Use server-side BACKEND_URL for middleware (Docker internal), fallback to localhost
  API_BASE_URL: process.env.BACKEND_URL?.replace('/api/v1', '') || 
                process.env.API_URL?.replace('/api/v1', '') || 
                process.env.NEXT_PUBLIC_API_BASE_URL || 
                'http://localhost:88',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG_AUTH: process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true',
  // Allow optimistic auth only in development
  OPTIMISTIC_AUTH: process.env.NODE_ENV === 'development',
} as const;

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
  return request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN)?.value || null;
}

/**
 * Server-side session validation with proper token verification
 */
async function validateServerSession(accessToken: string): Promise<{ valid: boolean; user?: any; error?: string; ipBlocked?: boolean; ipParams?: { duration: string; blockedAt: string; reason: string } }> {
  try {
    const response = await fetch(`${ENV.API_BASE_URL}/api/v1/auth/validate?include=user`, {
      method: "GET",
      headers: {
        "Cookie": `${COOKIE_CONFIG.ACCESS_TOKEN}=${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        valid: data.success && data.data?.valid, 
        user: data.data?.user,
        error: !data.success ? data.error : undefined
      };
    } else if (response.status === 403) {
      // Check for IP block and prepare redirect params
      try {
        const data = await response.json();
        const res = detectIpBlock(data);
        if (res.ipBlocked && res.params) {
          return { valid: false, error: 'IP_BLOCKED', ipBlocked: true, ipParams: res.params };
        }
      } catch {}
      return { valid: false, error: "Forbidden" };
    } else {
      // If validation fails, assume invalid
      return { valid: false, error: "Server validation failed" };
    }
  } catch (error) {
    // Network error during validation - fail closed in production
    if (ENV.DEBUG_AUTH) {
      console.log("[Middleware] Server validation error:", error);
    }
    
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

/**
 * Main middleware function - simplified and optimized
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging in development
  if (ENV.DEBUG_AUTH) {
    console.log(`[Middleware] Processing: ${pathname}`);
  }

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

    // If user has valid token and is on login/register, redirect to dashboard
    // UNLESS they're being redirected due to session expiration (to prevent loops)
    if (token && (pathname === "/login" || pathname === "/register")) {
      const reason = request.nextUrl.searchParams.get("reason");

      // Don't auto-redirect if user was just logged out due to session expiration
      if (reason === "session_expired" || reason === "logged_in_elsewhere") {
        if (ENV.DEBUG_AUTH) {
          console.log("[Middleware] Skipping auto-redirect due to session expiration");
        }
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/dashboard", request.url));
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

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    const token = extractAccessToken(request);

    // No token - redirect to login with return URL
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      
      if (ENV.DEBUG_AUTH) {
        console.log(`[Middleware] Redirecting to login: ${pathname} -> /login`);
      }
      
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
        if (ENV.DEBUG_AUTH) {
          console.log(`[Middleware] Cached invalid session, redirecting: ${pathname} -> /login`);
        }
        return NextResponse.redirect(loginUrl);
      }
      if (ENV.DEBUG_AUTH) {
        console.log(`[Middleware] Cached valid session for: ${pathname}`);
      }
      return NextResponse.next();
    }

    // Token exists - server-side validation with fallback to optimistic
    const validation = await validateServerSession(token);
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
      
      if (ENV.DEBUG_AUTH) {
        console.log(`[Middleware] Session invalid, redirecting to login: ${pathname} -> /login (reason: ${validation.error})`);
      }
      
      return NextResponse.redirect(loginUrl);
    }
    
    if (ENV.DEBUG_AUTH) {
      console.log(`[Middleware] Access granted to: ${pathname} (validation: ${validation.error || 'server'}/'optimistic')`);
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
