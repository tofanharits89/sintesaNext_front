/**
 * Simplified Middleware Configuration
 *
 * Replaces complex service-oriented configuration with simple constants
 * Follows Next.js 15 best practices
 */

// Route definitions
export const ROUTES = {
  PROTECTED: [
    '/dashboard',
    '/inquiry-data',
    '/admin',
    '/profile',
    '/settings',
    '/messaging',
  ],
  PUBLIC: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
  ],
  API: [
    '/api/',
  ],
  STATIC: [
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
} as const;

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

// Environment-based configuration
export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:88',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG_AUTH: process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true',
} as const;

// Security headers for authenticated routes
export const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

// Cookie configuration
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
} as const;