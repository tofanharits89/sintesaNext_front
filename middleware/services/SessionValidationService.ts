/**
 * Session Validation Service
 * Handles session validation with backend and caching
 */

import { backendPath } from "@/lib/backend";
import { MiddlewareConfig } from "../config";
import { CacheManager } from "../cache/CacheManager";
import { TokenUtils } from "../utils/TokenUtils";

export class SessionValidationService {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * Validate session with backend using cookies
   */
  async validateSession(
    incomingCookie: string,
    noCache = false
  ): Promise<boolean> {
    const key = this.cacheManager.generateKey(incomingCookie);
    const now = Date.now();

    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] validateSessionViaBackend called", {
        hasCookie: !!incomingCookie,
        cookieLength: incomingCookie?.length || 0,
        noCache,
        key: key.substring(0, 30) + "...",
      });
    }

    // Check if we should bypass cache
    const shouldBypass = this.cacheManager.shouldBypassCache(key);
    if (!noCache && shouldBypass) {
      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] cache bypass active for session");
      }
      noCache = true;
    }

    // Try cache first if not bypassed
    if (!noCache) {
      const cached = this.cacheManager.get(key);
      if (cached && cached.exp > now) {
        if (!this.cacheManager.isSecurityExpired(cached)) {
          if (MiddlewareConfig.debugAuth) {
            console.debug(
              "[Auth] session verify cache hit (security validated)",
              {
                result: cached.ok,
                securityChecked: true,
              }
            );
          }
          return cached.ok;
        } else {
          this.cacheManager.delete(key);
          if (MiddlewareConfig.debugAuth) {
            console.debug(
              "[Auth] cache entry removed due to security expiration"
            );
          }
        }
      }
    }

    // Cache miss or bypass - perform validation
    const authResult = await this.performBackendValidation(incomingCookie, key);

    // Only cache successful auth results
    if (!noCache && !shouldBypass && authResult) {
      this.cacheManager.set(key, {
        ok: authResult,
        exp: now + MiddlewareConfig.sessionVerifyTtl,
        created: now,
      });
    }

    return authResult;
  }

  /**
   * Perform backend validation
   */
  private async performBackendValidation(
    incomingCookie: string,
    key: string
  ): Promise<boolean> {
    try {
      const backendUrl = backendPath("/auth/session/validate");

      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Making backend validation request", {
          url: backendUrl,
          hasCookie: !!incomingCookie,
          cookieLength: incomingCookie?.length || 0,
        });
      }

      const resp = await fetch(backendUrl, {
        method: "GET",
        headers: incomingCookie ? { cookie: incomingCookie } : {},
        cache: "no-store",
      });

      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Backend response received", {
          status: resp.status,
          ok: resp.ok,
          statusText: resp.statusText,
        });
      }

      const data = await resp.json().catch((jsonError) => {
        if (MiddlewareConfig.debugAuth) {
          console.error(
            "[Auth] Failed to parse backend response as JSON",
            jsonError
          );
        }
        return {};
      });

      const authResult = resp.ok && Boolean(data?.success);

      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Backend validation result", {
          status: resp.status,
          ok: resp.ok,
          dataSuccess: data?.success,
          authResult,
          data: data,
        });
      }

      // If auth failed, clear all related cache entries
      if (!authResult) {
        this.cacheManager.delete(key);
        const cleared = this.cacheManager.clearMatching(
          incomingCookie.slice(0, 20)
        );

        if (MiddlewareConfig.debugAuth) {
          console.debug("[Auth] Cleared cache entries for failed auth", {
            count: cleared.length,
          });
        }
      }

      return authResult;
    } catch (error) {
      console.error("[Auth] Backend validation error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: backendPath("/auth/session/validate"),
      });
      return false;
    }
  }

  /**
   * Smart retry logic for fresh cookies and refresh windows
   */
  async validateWithRetry(
    rawCookie: string,
    hasAccessToken: boolean,
    isLoginPage: boolean,
    shouldBypass: boolean
  ): Promise<boolean> {
    // CRITICAL FIX: Clear cache for very fresh cookies (< 2 seconds old)
    // This handles the case where user just logged in and middleware still has stale cache
    const cookieAge = TokenUtils.extractCookieAge(rawCookie);
    const isVeryFreshLogin = cookieAge !== null && cookieAge < 2000; // 2 seconds

    if (isVeryFreshLogin && !isLoginPage) {
      const cacheKey = this.cacheManager.generateKey(rawCookie);
      this.cacheManager.delete(cacheKey);

      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] Very fresh login detected, cleared cache", {
          cookieAge,
        });
      }

      // Force bypass for very fresh logins
      shouldBypass = true;
    }

    let isAuth = await this.validateSession(
      rawCookie,
      shouldBypass || isLoginPage
    );

    if (!isAuth && hasAccessToken && !isLoginPage && !shouldBypass) {
      const isFreshLogin =
        cookieAge !== null && cookieAge < MiddlewareConfig.freshCookieThreshold;
      const isInRefreshWindow =
        cookieAge !== null &&
        cookieAge < MiddlewareConfig.refreshWindowThreshold;

      if (isFreshLogin || isInRefreshWindow) {
        const retryReason = isFreshLogin
          ? "backend_cache_sync"
          : "token_refresh_window";

        if (MiddlewareConfig.debugAuth) {
          console.debug("[Auth] Smart retry triggered", {
            cookieAge,
            reason: retryReason,
            isFreshLogin,
            isInRefreshWindow,
          });
        }

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            isFreshLogin
              ? MiddlewareConfig.freshCookieRetryDelay
              : MiddlewareConfig.refreshWindowRetryDelay
          )
        );

        isAuth = await this.validateSession(rawCookie, true);

        if (MiddlewareConfig.debugAuth) {
          console.debug("[Auth] Smart retry result", {
            isAuth,
            cookieAge,
            retryReason,
          });
        }

        // Additional retry for refresh window
        if (!isAuth && isInRefreshWindow && !isFreshLogin) {
          if (MiddlewareConfig.debugAuth) {
            console.debug("[Auth] Additional retry for refresh window");
          }

          await new Promise((resolve) =>
            setTimeout(resolve, MiddlewareConfig.additionalRetryDelay)
          );
          isAuth = await this.validateSession(rawCookie, true);

          if (MiddlewareConfig.debugAuth) {
            console.debug("[Auth] Additional retry result", {
              isAuth,
              cookieAge,
            });
          }
        }
      }
    }

    return isAuth;
  }
}
