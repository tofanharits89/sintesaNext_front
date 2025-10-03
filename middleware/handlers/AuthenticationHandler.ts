/**
 * Authentication Handler
 * Handles authentication logic and redirects
 */

import { NextRequest, NextResponse } from "next/server";
import { MiddlewareConfig, PathConfig } from "../config";
import { PathUtils } from "../utils/PathUtils";
import { TokenUtils } from "../utils/TokenUtils";
import { CookieUtils } from "../utils/CookieUtils";
import { SessionValidationService } from "../services/SessionValidationService";
import { CacheManager } from "../cache/CacheManager";

export class AuthenticationHandler {
  private sessionService: SessionValidationService;
  private cacheManager: CacheManager;

  constructor(sessionService: SessionValidationService, cacheManager: CacheManager) {
    this.sessionService = sessionService;
    this.cacheManager = cacheManager;
  }

  /**
   * Handle login page logic
   */
  async handleLoginPage(request: NextRequest, rawCookie: string, hasAccessToken: boolean): Promise<NextResponse | null> {
    const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
    
    if (!PathUtils.isLoginPage(relPath) || !hasAccessToken) {
      return null;
    }

    const fromRedirect = request.nextUrl.searchParams.has("from_redirect");
    const reasonParam = request.nextUrl.searchParams.get("reason");
    
    // Skip auth check for loop prevention
    if (fromRedirect || reasonParam === 'session_expired' || reasonParam) {
      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Skipping login page auth check - loop prevention", {
          fromRedirect,
          reason: reasonParam,
          relPath
        });
      }
      
      const res = NextResponse.next();
      CookieUtils.expireAuthCookies(res);
      return res;
    }
    
    // Check if user is authenticated
    let isAuth = await this.sessionService.validateSession(rawCookie, true);
    
    if (!isAuth) {
      const cookieAge = TokenUtils.extractCookieAge(rawCookie);
      if (cookieAge !== null && cookieAge < MiddlewareConfig.freshCookieThreshold) {
        if (MiddlewareConfig.debugAuth) {
          console.debug("[Auth] Fresh cookie on login page, retrying validation", { cookieAge });
        }
        await new Promise(r => setTimeout(r, MiddlewareConfig.freshCookieRetryDelay));
        isAuth = await this.sessionService.validateSession(rawCookie, true);
      }
    }
    
    if (isAuth) {
      const url = request.nextUrl.clone();
      url.pathname = PathConfig.dashboard;
      url.search = '';
      const res = NextResponse.redirect(url);
      res.headers.set("x-mw-hit", "1");
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    
    return null;
  }

  /**
   * Handle root path redirect
   */
  handleRootPath(request: NextRequest, isAuth: boolean): NextResponse | null {
    const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
    
    if (relPath !== "/") {
      return null;
    }

    const url = request.nextUrl.clone();
    url.pathname = isAuth ? PathConfig.dashboard : "/login";
    return NextResponse.redirect(url);
  }

  /**
   * Handle unauthenticated access to protected route
   */
  handleUnauthenticatedAccess(request: NextRequest, rawCookie: string): NextResponse {
    const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
    
    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] Unauthenticated user accessing protected route, redirecting to login", { relPath });
    }
    
    // Clear cache entry for failed auth
    const cacheKey = this.cacheManager.generateKey(rawCookie);
    if (this.cacheManager.has(cacheKey)) {
      this.cacheManager.delete(cacheKey);
      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Cleared stale cache entry for failed auth");
      }
    }
    
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    
    if (!url.searchParams.has("reason")) {
      url.searchParams.set("reason", "session_expired");
    }
    url.searchParams.set("from_redirect", "1");
    
    const res = NextResponse.redirect(url);
    res.headers.set("x-mw-hit", "1");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  /**
   * Handle no access token scenario
   */
  handleNoAccessToken(request: NextRequest, rawCookie: string): NextResponse {
    const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
    
    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] No access token found, redirecting to login", {
        relPath,
        hasAccessToken: false
      });
    }
    
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    
    if (!url.searchParams.has("reason")) {
      url.searchParams.set("reason", "no_token");
    }
    url.searchParams.set("from_redirect", "1");
    
    const res = NextResponse.redirect(url);
    res.headers.set("x-mw-hit", "1");
    
    if (MiddlewareConfig.debugAuth) {
      res.headers.set("x-auth-debug", "no-accessToken;redirect-login");
      res.headers.set("x-auth-relpath", relPath);
    }
    
    // Clear stale cache entries
    const cacheKey = this.cacheManager.generateKey(rawCookie || "");
    if (this.cacheManager.has(cacheKey)) {
      this.cacheManager.delete(cacheKey);
    }
    
    return res;
  }

  /**
   * Create authenticated response
   */
  createAuthenticatedResponse(request: NextRequest, isPublicPath: boolean, isAuth: boolean, hasAccessToken: boolean): NextResponse {
    const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-public-route", isPublicPath ? "1" : "0");
    
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("x-mw-hit", "1");
    
    if (!isPublicPath) {
      res.headers.set("Cache-Control", "no-store");
    }
    
    res.headers.set("x-auth-public", isPublicPath ? "1" : "0");
    res.headers.set("x-auth-isAuth", isAuth ? "1" : "0");
    res.headers.set("x-auth-hasAccessToken", hasAccessToken ? "1" : "0");
    
    if (MiddlewareConfig.debugAuth) {
      res.headers.set("x-auth-relpath", relPath);
    }
    
    return res;
  }
}
