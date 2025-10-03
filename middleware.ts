/**
 * Next.js Middleware - Enterprise Edition
 * 
 * Refactored for scalability, maintainability, and enterprise standards
 * Following SOLID principles and separation of concerns
 * 
 * Architecture:
 * - Config: Centralized configuration management
 * - Services: Business logic layer (Session, Health, Cache Invalidation)
 * - Handlers: Request handling layer (Authentication)
 * - Cache: Caching layer with security-optimized TTL
 * - Utils: Utility functions (Path, Token, Cookie)
 * 
 * Benefits:
 * - Single Responsibility: Each class has one clear purpose
 * - Open/Closed: Easy to extend without modifying existing code
 * - Dependency Injection: Services are injected, not hardcoded
 * - Testability: Each component can be tested independently
 * - Maintainability: Clear separation of concerns
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Import all components from centralized module
import {
  MiddlewareConfig,
  PathConfig,
  CacheManager,
  SessionValidationService,
  HealthCheckService,
  CacheInvalidationService,
  AuthenticationHandler,
  PathUtils,
  TokenUtils,
} from "./middleware/index";

// Initialize services (singleton pattern)
const cacheManager = new CacheManager();
const sessionService = new SessionValidationService(cacheManager);
const healthService = new HealthCheckService();
const cacheInvalidationService = new CacheInvalidationService(cacheManager);
const authHandler = new AuthenticationHandler(sessionService, cacheManager);

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  // Probe mode for debugging
  if (MiddlewareConfig.probeMode) {
    const res = NextResponse.next();
    res.headers.set("x-mw-probe", "1");
    res.headers.set("x-mw-path", request.nextUrl.pathname);
    return res;
  }

  const { pathname } = request.nextUrl;
  const relPath = PathUtils.getRelativePath(pathname);

  // Handle cache invalidation endpoint
  if (relPath === "/api/auth/invalidate-cache" && request.method === "POST") {
    if (!MiddlewareConfig.enableCacheInvalidation) {
      return NextResponse.json(
        {
          success: false,
          error: "Not enabled",
          code: "DISABLED",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return await cacheInvalidationService.handleInvalidation(request);
  }

  // Pass through API routes
  if (PathUtils.isApiRoute(relPath)) {
    return NextResponse.next();
  }

  // Early bypass for static assets
  if (PathUtils.isStaticPath(relPath)) {
    return NextResponse.next();
  }

  const isPublicPath = PathUtils.isPublicPath(relPath);

  // Allow public paths without health check
  if (isPublicPath) {
    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] Public path access granted", { relPath });
    }

    // Extract cookie information
    const rawCookie = request.headers.get("cookie") || "";
    const accessTokenValue = TokenUtils.extractAccessToken(rawCookie);
    const hasAccessToken = !!accessTokenValue;

    // Handle login page with existing token
    const loginPageResponse = await authHandler.handleLoginPage(
      request,
      rawCookie,
      hasAccessToken
    );
    if (loginPageResponse) {
      return loginPageResponse;
    }

    return NextResponse.next();
  }

  // Health check for protected routes
  const isHealthy = await healthService.isBackendHealthy();
  if (!isHealthy) {
    const url = request.nextUrl.clone();
    url.pathname = PathConfig.serverError;
    const res = NextResponse.redirect(url);
    res.headers.set("x-mw-hit", "1");
    return res;
  }

  // Extract and validate access token
  const rawCookie = request.headers.get("cookie") || "";
  const accessTokenValue = TokenUtils.extractAccessToken(rawCookie);
  const hasAccessToken = !!accessTokenValue;

  if (MiddlewareConfig.debugAuth) {
    console.debug("[Auth] Cookie extraction", {
      hasAccessToken,
      rawCookieLength: rawCookie.length,
      relPath,
      isPublicPath,
    });
  }

  // Fast-fail: no access token
  if (!hasAccessToken) {
    return authHandler.handleNoAccessToken(request, rawCookie);
  }

  // Validate session with smart retry logic
  const cacheKey = cacheManager.generateKey(rawCookie);
  const isLoginPage = PathUtils.isLoginPage(relPath);
  const shouldBypass = cacheManager.shouldBypassCache(cacheKey);

  const isAuth = await sessionService.validateWithRetry(
    rawCookie,
    hasAccessToken,
    isLoginPage,
    shouldBypass
  );

  if (MiddlewareConfig.debugAuth) {
    console.debug("[Auth] Session validation result", {
      relPath,
      isAuth,
      isLoginPage,
      isPublicPath,
      hasAccessToken,
    });
  }

  // Handle root path redirect
  const rootResponse = authHandler.handleRootPath(request, isAuth);
  if (rootResponse) {
    return rootResponse;
  }

  // Handle unauthenticated access to protected route
  if (!isAuth) {
    return authHandler.handleUnauthenticatedAccess(request, rawCookie);
  }

  // Create authenticated response
  return authHandler.createAuthenticatedResponse(
    request,
    isPublicPath,
    isAuth,
    hasAccessToken
  );
}

export const config = {
  matcher: ["/", "/((?!_next|favicon.ico|api/public).*)"],
};
