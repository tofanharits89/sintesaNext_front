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
// Removed cache functions for simplified middleware (no complex caching)
// import { getAuthCache, setAuthCache, hashKey } from "@/lib/auth/utils-server";

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
  "/monitor-performa",
  "/pengaturan",
  "/satker",
  "/transfer-daerah",
  "/tentang-kita",
];

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/server-error",
  "/unauthorized",
  "/ip-blocked",
  "/test-rbac",
  "/test-skeletons",
  "/debug-user",
];

// Import unified configuration
import { config as appConfig } from "@/lib/config/config";

// Environment-based configuration
const ENV = {
  // Use server-side API URL (automatically handles Docker internal vs localhost)
  API_BASE_URL: appConfig.apiUrl.replace('/api/v1', ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG_AUTH: appConfig.debugAuth,
  // Allow optimistic auth only in development
  OPTIMISTIC_AUTH: appConfig.isDevelopment,
} as const;

// Feature flag: protect-by-default. Default to true for safety and simplicity.
// Set NEXT_PUBLIC_DEFAULT_PROTECT="false" to opt out.
const DEFAULT_PROTECT = process.env.NEXT_PUBLIC_DEFAULT_PROTECT !== 'false';

// Cookie configuration (session id)
const COOKIE_CONFIG = {
  SID: 'sid',
} as const;

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(COOKIE_CONFIG.SID)?.value);
}

/**
 * Server-side session validation with proper token verification
 */
async function validateServerSession(_ignored: string, request: NextRequest): Promise<{ valid: boolean; user?: any; error?: string; ipBlocked?: boolean; ipParams?: { duration: string; blockedAt: string; reason: string }, setCookies?: string[], status?: number }> {
  try {
    const validateUrl = new URL('/api/v1/auth/validate?include=user', request.url);
    const cookieHeader = request.headers.get("cookie") || "";
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

    const setCookies: string[] = (response.headers as any).getSetCookie?.() || [];

    if (response.ok) {
      const data = await response.json();
      return {
        valid: data.success && data.data?.valid,
        user: data.data?.user,
        error: !data.success ? data.error : undefined,
        setCookies,
        status: 200,
      };
    } else if (response.status === 403) {
      // Check for IP block and prepare redirect params
      try {
        const data = await response.json();
        const res = detectIpBlock(data);
        if (res.ipBlocked && res.params) {
          return { valid: false, error: "IP_BLOCKED", ipBlocked: true, ipParams: res.params, setCookies, status: 403 };
        }
      } catch {}
      return { valid: false, error: "Forbidden", setCookies, status: 403 };
    } else {
      // If validation fails, assume invalid
      return { valid: false, error: "Server validation failed", setCookies, status: response.status };
    }
  } catch (error) {
    // Network error during validation - fail closed in production

    return { valid: false, error: "Authentication service unavailable" };
  }
}

/**
 * Forward Set-Cookie headers from a Response to the outgoing NextResponse
 */
function forwardSetCookiesToResponse(source: Response, target: NextResponse) {
  const setCookies: string[] = (source.headers as any).getSetCookie?.() || [];
  if (setCookies && setCookies.length > 0) {
    for (const c of setCookies) {
      target.headers.append('Set-Cookie', c);
    }
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
  if (pathname === "/") return true; // only the exact home path is public
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function needsAuth(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  return DEFAULT_PROTECT ? true : isProtectedRoute(pathname);
}

/**
 * Check if logout is in progress
 */
function isLogoutInProgress(request: NextRequest): boolean {
  try {
    // Navbar sets this short-lived cookie during logout. Use it as a strong signal.
    const flag = request.cookies.get('logout_in_progress')?.value;
    return flag === 'true';
  } catch {
    return false;
  }
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

  // Simple, early guard: if route needs auth and we have no auth cookies at all,
  // redirect immediately to login before any further work. Keeps behavior simple
  // and avoids any chance of a protected page rendering.
  if (needsAuth(pathname)) {
    // If logout is in progress, always redirect to login to avoid protected flashes
    if (isLogoutInProgress(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("reason", "logout");
      return NextResponse.redirect(loginUrl);
    }
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check if logout is in progress - redirect directly to login
  if (isLogoutInProgress(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "logout");
    return NextResponse.redirect(loginUrl);
  }

  // Handle public routes
  if (isPublicRoute(pathname)) {
    // If logout is in progress, always redirect to login
    if (isLogoutInProgress(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("reason", "logout");
      return NextResponse.redirect(loginUrl);
    }

    const hasSid = hasSessionCookie(request);
    // If user has a session and visits login/register, validate first
    // But skip validation if this is a logout redirect (prevents dashboard flash)
    if (hasSid && (pathname === "/login" || pathname === "/register")) {
      // Check if this is a logout redirect
      const reason = request.nextUrl.searchParams.get('reason');
      const isLogoutRedirect = reason === 'logout' || reason === 'session_expired';

      if (!isLogoutRedirect) {
        if (ENV.DEBUG_AUTH) {
          console.log(`[MW] ${pathname} has sid; validating session...`);
        }
        const validation = await validateServerSession('', request);

        if (validation.valid) {
          if (ENV.DEBUG_AUTH) {
            console.log(`[MW] ${pathname} session valid; redirecting to /dashboard/utama`);
          }
          return NextResponse.redirect(new URL("/dashboard/utama", request.url));
        }
        if (ENV.DEBUG_AUTH) {
          console.log(`[MW] ${pathname} session invalid; continue to public page`);
        }
      }
      // If logout redirect, skip validation and show login page

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
    const hasSid = hasSessionCookie(request);
    if (!hasSid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session exists - server-side validation (no refresh fallback)
    const validation = await validateServerSession('', request);
    
    if (!validation.valid) {
      // Redirect blocked IPs to /ip-blocked instead of login
      if (validation.ipBlocked && validation.ipParams) {
        const ipUrl = new URL("/ip-blocked", request.url);
        for (const [k, v] of Object.entries(validation.ipParams)) {
          ipUrl.searchParams.set(k, v);
        }
        return NextResponse.redirect(ipUrl);
      }

      // If still invalid, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      loginUrl.searchParams.set("reason", "session_expired");
      return NextResponse.redirect(loginUrl);
    }

    // Valid session
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
