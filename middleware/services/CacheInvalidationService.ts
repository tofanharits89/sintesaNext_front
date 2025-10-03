/**
 * Cache Invalidation Service
 * Handles cache invalidation requests with rate limiting and security
 */

import { NextRequest, NextResponse } from "next/server";
import { MiddlewareConfig } from "../config";
import { CacheManager } from "../cache/CacheManager";
import { TokenUtils } from "../utils/TokenUtils";
import type { CacheInvalidationRequest, CacheInvalidationResponse, RateLimitEntry } from "../types";

export class CacheInvalidationService {
  private cacheManager: CacheManager;
  private rateLimitMap: Map<string, RateLimitEntry>;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    
    if (!globalThis.__invalidateRateLimit) {
      globalThis.__invalidateRateLimit = new Map();
    }
    this.rateLimitMap = globalThis.__invalidateRateLimit;
  }

  /**
   * Check rate limit for IP
   */
  private checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = `invalidate:${ip}`;
    const entry = this.rateLimitMap.get(key);

    if (!entry || entry.resetAt <= now) {
      this.rateLimitMap.set(key, { count: 1, resetAt: now + MiddlewareConfig.rateLimitWindow });
      return { allowed: true };
    }

    entry.count += 1;
    if (entry.count > MiddlewareConfig.rateLimitMaxRequests) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((entry.resetAt - now) / 1000) 
      };
    }

    return { allowed: true };
  }

  /**
   * Verify same-origin request
   */
  private verifySameOrigin(request: NextRequest): boolean {
    const reqOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");

    try {
      if (originHeader) {
        const o = new URL(originHeader);
        const r = new URL(reqOrigin);
        if (o.origin !== r.origin) return false;
      }
      if (refererHeader) {
        const ref = new URL(refererHeader);
        const r = new URL(reqOrigin);
        if (ref.origin !== r.origin) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify internal signal
   */
  private verifyInternalSignal(request: NextRequest): boolean {
    const userAgent = request.headers.get("user-agent") || "";
    return userAgent.includes("Next.js") || request.headers.get("x-internal-request") === "true";
  }

  /**
   * Verify signature if secret is configured
   */
  private async verifySignature(request: NextRequest): Promise<boolean> {
    if (!MiddlewareConfig.cacheInvalidateSecret) {
      return true;
    }

    try {
      const raw = await request.clone().text();
      const enc = new TextEncoder();
      const data = enc.encode(`${MiddlewareConfig.cacheInvalidateSecret}:${raw}`);
      const digest = await crypto.subtle.digest("SHA-256", data);
      const hex = Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      const sig = (request.headers.get("x-internal-signature") || "").trim();
      return sig.length > 0 && sig.toLowerCase() === hex;
    } catch {
      return false;
    }
  }

  /**
   * Find cache keys by token hash
   */
  private async findCacheKeysByTokenHash(tokenHash: string): Promise<string[]> {
    const matches: string[] = [];

    for (const key of this.cacheManager.keys()) {
      if (typeof key !== "string" || key.startsWith("bypass:")) {
        continue;
      }

      const tokenValue = TokenUtils.extractAccessTokenValue(key);
      if (!tokenValue) continue;

      const computedHash = await TokenUtils.computeSha256Hex(tokenValue);
      if (computedHash === tokenHash) {
        matches.push(key);
      }
    }

    return matches;
  }

  /**
   * Handle cache invalidation request
   */
  async handleInvalidation(request: NextRequest): Promise<NextResponse> {
    // Rate limiting
    const fwdFor = request.headers.get("x-forwarded-for") || "";
    const ip = (fwdFor.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
    const rateLimit = this.checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return this.errorResponse("Too many requests", "RATE_LIMITED", 429, {
        "Retry-After": rateLimit.retryAfter!.toString()
      });
    }

    // Security checks
    const sameOrigin = this.verifySameOrigin(request);
    const internalSignal = this.verifyInternalSignal(request);
    const signatureOk = await this.verifySignature(request);

    if (!sameOrigin || !internalSignal || !signatureOk) {
      const code = !sameOrigin ? "FORBIDDEN_ORIGIN" : 
                   !internalSignal ? "FORBIDDEN_SIGNAL" : "FORBIDDEN_SIGNATURE";
      return this.errorResponse("Unauthorized access to internal endpoint", code, 403);
    }

    // Process invalidation
    try {
      const body: CacheInvalidationRequest = await request.json();
      
      if (!body.sessionKey || typeof body.sessionKey !== 'string') {
        return this.errorResponse("sessionKey is required", "INVALID_REQUEST", 400);
      }

      const result = await this.performInvalidation(body);
      return this.successResponse(result);
    } catch (error) {
      console.error("[Middleware] Cache invalidation error:", error);
      return this.errorResponse("Internal server error during cache invalidation", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Perform cache invalidation
   */
  private async performInvalidation(body: CacheInvalidationRequest): Promise<CacheInvalidationResponse> {
    const sessionKey = this.cacheManager.generateKey(body.sessionKey);
    const clearedKeySet = new Set<string>();
    const matchedCacheKeys = new Set<string>();

    // Clear specific session cache
    if (this.cacheManager.has(sessionKey)) {
      this.cacheManager.delete(sessionKey);
      clearedKeySet.add(`middleware:${sessionKey}`);
      matchedCacheKeys.add(sessionKey);
    }

    // Clear variations
    const keysToCheck = [
      body.sessionKey,
      `accessToken=${body.sessionKey}`,
      `accessToken=${encodeURIComponent(body.sessionKey)}`
    ];

    for (const key of keysToCheck) {
      const cacheKey = this.cacheManager.generateKey(key);
      if (this.cacheManager.has(cacheKey)) {
        this.cacheManager.delete(cacheKey);
        clearedKeySet.add(`middleware:${cacheKey}`);
        matchedCacheKeys.add(cacheKey);
      }
    }

    // Handle token hash matching
    const tokenHashCandidate =
      typeof body.tokenHash === 'string' && TokenUtils.isHexHash(body.tokenHash)
        ? body.tokenHash
        : TokenUtils.isHexHash(body.sessionKey)
          ? body.sessionKey
          : null;

    if (tokenHashCandidate) {
      const hashMatches = await this.findCacheKeysByTokenHash(tokenHashCandidate);
      for (const cacheKey of hashMatches) {
        if (this.cacheManager.has(cacheKey)) {
          this.cacheManager.delete(cacheKey);
        }
        clearedKeySet.add(`middleware:${cacheKey}`);
        matchedCacheKeys.add(cacheKey);
      }
    }

    // Handle logout-specific logic
    if (body.type === 'logout') {
      if (MiddlewareConfig.debugAuth) {
        console.log("[Middleware] Clearing all cache entries for logout");
      }
      this.cacheManager.clear();

      const bypassTargets = new Set([sessionKey, ...matchedCacheKeys]);
      for (const target of bypassTargets) {
        this.cacheManager.setCacheBypass(target, 'logout_event');
        clearedKeySet.add(`bypass:${target}`);
      }

      if (body.userId) {
        this.cacheManager.setCacheBypass(`user:${body.userId}`, 'user_logout');
        clearedKeySet.add(`bypass:user:${body.userId}`);
      }
    }

    if (MiddlewareConfig.debugAuth) {
      console.log("[Middleware] Cache invalidation completed", {
        sessionKey: body.sessionKey,
        type: body.type,
        clearedKeys: Array.from(clearedKeySet)
      });
    }

    return {
      success: true,
      message: `Middleware cache invalidated for session: ${body.sessionKey}`,
      clearedKeys: Array.from(clearedKeySet),
      timestamp: new Date().toISOString()
    };
  }

  private successResponse(data: CacheInvalidationResponse): NextResponse {
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  }

  private errorResponse(error: string, code: string, status: number, headers?: Record<string, string>): NextResponse {
    const responseInit: ResponseInit = { status };
    if (headers) {
      responseInit.headers = headers;
    }
    
    return NextResponse.json({
      success: false,
      error,
      code,
      timestamp: new Date().toISOString()
    }, responseInit);
  }
}
