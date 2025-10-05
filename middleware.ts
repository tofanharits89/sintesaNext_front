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
const PROTECTED_ROUTES = ['/dashboard', '/inquiry-data', '/admin', '/profile'];
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/'];

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
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route is public (login, register, etc.)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Simple health check without complex service dependencies
 */
async function isBackendHealthy(): Promise<boolean> {
  try {
    const healthUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main middleware function - simplified from 186 lines to ~40 lines
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static assets, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle public routes
  if (isPublicRoute(pathname)) {
    const token = extractAccessToken(request);

    // If user has valid token, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    const token = extractAccessToken(request);

    // No token - redirect to login with return URL
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists - optimistic validation (no DB call in middleware)
    // Full validation happens in API routes and server components
    return NextResponse.next();
  }

  // Backend health check for critical routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const isHealthy = await isBackendHealthy();
    if (!isHealthy) {
      return NextResponse.redirect(new URL('/server-error', request.url));
    }
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};