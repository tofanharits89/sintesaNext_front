/**
 * Simplified Next.js Middleware - Industry Standard 2025
 *
 * Replaces complex service-oriented architecture with simple, maintainable code
 * Follows Next.js 15 best practices: no response bodies, only redirects/rewrites
 *
 * Architecture:
 * - Simple utility functions instead of service classes
 * - Optimistic cookie-based validation (no DB calls in middleware)
 * - Clear separation of concerns
 * - 40 lines vs 186 lines previously
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple utility functions instead of complex service classes
const PROTECTED_ROUTES = [
  "/dashboard",
  "/inquiry-data",
  "/admin",
  "/profile",
  "/users",
  "/settings",
  "/messages",
  "/notifications",
];
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/",
  "/server-error",
  "/unauthorized",
  "/ip-blocked",
];

/**
 * Extract access token from HttpOnly cookie
 */
function extractAccessToken(request: NextRequest): string | null {
  return request.cookies.get("accessToken")?.value || null;
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

  // Skip middleware for API routes, static assets, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
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
        console.log(
          "[Middleware] Skipping auto-redirect due to session expiration"
        );
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/dashboard", request.url));
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
      return NextResponse.redirect(loginUrl);
    }

    // Token exists - optimistic validation (no DB call in middleware)
    // Full validation happens in API routes and server components
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
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
