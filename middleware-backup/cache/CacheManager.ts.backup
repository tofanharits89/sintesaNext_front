/**
 * Cache Manager
 * Handles session verification caching with security-optimized TTL
 */

import { MiddlewareConfig } from "../config";
import type { CacheEntry } from "../types";

export class CacheManager {
  private cache: Map<string, CacheEntry>;

  constructor() {
    if (!globalThis.__middlewareSessionCache) {
      globalThis.__middlewareSessionCache = new Map();
    }
    this.cache = globalThis.__middlewareSessionCache;
  }

  generateKey(incomingCookie: string): string {
    return incomingCookie || "_no_cookie";
  }

  get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  set(key: string, entry: CacheEntry): void {
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if cache entry has exceeded security-optimized TTL
   */
  isSecurityExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    
    if (entry.exp <= now) {
      return true;
    }
    
    if (entry.ok && entry.created) {
      const age = now - entry.created;
      if (age > MiddlewareConfig.maxCacheAge) {
        if (MiddlewareConfig.debugAuth) {
          console.debug("[Auth] Cache entry expired due to security age limit", { age, maxAge: MiddlewareConfig.maxCacheAge });
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if cache should be bypassed for recently logged out sessions
   */
  shouldBypassCache(cacheKey: string): boolean {
    const bypassKey = `bypass:${cacheKey}`;
    const bypass = this.cache.get(bypassKey);
    
    if (!bypass) return false;
    
    const now = Date.now();
    if (bypass.exp <= now) {
      this.cache.delete(bypassKey);
      return false;
    }
    
    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] Cache bypass active (dynamic expiration)", {
        cacheKey: cacheKey.substring(0, 50) + '...',
        reason: bypass.reason || 'logout_event',
        expiresAt: new Date(bypass.exp).toISOString(),
        remainingMs: bypass.exp - now
      });
    }
    
    return true;
  }

  /**
   * Set cache bypass for logout events
   */
  setCacheBypass(cacheKey: string, reason: string = 'logout_event'): void {
    if (!cacheKey || cacheKey === '_no_cookie') {
      return;
    }
    
    const bypassKey = `bypass:${cacheKey}`;
    const bypassExpiry = Date.now() + MiddlewareConfig.bypassDuration;
    
    this.cache.set(bypassKey, { 
      ok: false, 
      exp: bypassExpiry,
      reason,
      created: Date.now()
    });
    
    if (MiddlewareConfig.debugAuth) {
      console.debug("[Auth] Cache bypass set for logout event", {
        cacheKey: cacheKey.substring(0, 50) + '...',
        reason,
        duration: MiddlewareConfig.bypassDuration,
        expiresAt: new Date(bypassExpiry).toISOString()
      });
    }
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearMatching(pattern: string): string[] {
    const cleared: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared.push(key);
      }
    }
    return cleared;
  }
}
