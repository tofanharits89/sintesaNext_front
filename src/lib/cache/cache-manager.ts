/**
 * CacheManager - Frontend cache management utility
 * Provides consistent cache key generation and invalidation methods
 * that coordinate with backend cache strategies
 */

const DEBUG_CACHE = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";

// Ensure globalThis is available
if (typeof globalThis === 'undefined' && typeof global !== 'undefined') {
  (global as any).globalThis = global;
}

// Access the middleware cache from the global scope
// Note: This is a reference to the same cache used in middleware.ts
declare global {
  var __middlewareSessionCache: Map<string, { ok: boolean; exp: number; created?: number; reason?: string }> | undefined;
  var __cacheAuditTrail: CacheAuditEntry[] | undefined;
  var __cachePerformanceMetrics: CachePerformanceMetrics | undefined;
}

// Cache operation audit trail interface
interface CacheAuditEntry {
  timestamp: string;
  operation: 'get' | 'set' | 'delete' | 'invalidate' | 'clear' | 'bypass';
  cacheType: 'middleware' | 'session' | 'auth';
  key?: string;
  userId?: string;
  sessionId?: string;
  success: boolean;
  duration?: number;
  metadata?: any;
}

// Cache performance metrics interface
interface CachePerformanceMetrics {
  totalOperations: number;
  averageResponseTime: number;
  hitRate: number;
  errorRate: number;
  lastResetTime: string;
  cacheSize: number;
  bypassCount: number;
}

const MAX_AUDIT_ENTRIES = 500; // Smaller limit for frontend

export class CacheManager {
  private sessionVerifyCache: Map<string, { ok: boolean; exp: number; created?: number; reason?: string }>;
  private auditTrail: CacheAuditEntry[];
  private performanceMetrics: CachePerformanceMetrics;

  constructor() {
    // Initialize or get reference to the middleware cache
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.__middlewareSessionCache) {
        globalThis.__middlewareSessionCache = new Map();
      }
      this.sessionVerifyCache = globalThis.__middlewareSessionCache;

      // Initialize audit trail
      if (!globalThis.__cacheAuditTrail) {
        globalThis.__cacheAuditTrail = [];
      }
      this.auditTrail = globalThis.__cacheAuditTrail;

      // Initialize performance metrics
      if (!globalThis.__cachePerformanceMetrics) {
        globalThis.__cachePerformanceMetrics = {
          totalOperations: 0,
          averageResponseTime: 0,
          hitRate: 0,
          errorRate: 0,
          lastResetTime: new Date().toISOString(),
          cacheSize: 0,
          bypassCount: 0
        };
      }
      this.performanceMetrics = globalThis.__cachePerformanceMetrics;
    } else {
      // Fallback for environments where globalThis is not available
      this.sessionVerifyCache = new Map();
      this.auditTrail = [];
      this.performanceMetrics = {
        totalOperations: 0,
        averageResponseTime: 0,
        hitRate: 0,
        errorRate: 0,
        lastResetTime: new Date().toISOString(),
        cacheSize: 0,
        bypassCount: 0
      };
    }
  }

  /**
   * Add cache audit entry
   */
  private addCacheAuditEntry(entry: Omit<CacheAuditEntry, 'timestamp'>): void {
    const auditEntry: CacheAuditEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.auditTrail.push(auditEntry);
    
    // Keep audit trail size manageable
    if (this.auditTrail.length > MAX_AUDIT_ENTRIES) {
      this.auditTrail.shift();
    }
    
    // Log cache operations in debug mode
    if (DEBUG_CACHE) {
      console.log(`[CacheManager] ${entry.operation}:`, {
        cacheType: entry.cacheType,
        key: entry.key,
        userId: entry.userId,
        sessionId: entry.sessionId,
        success: entry.success,
        duration: entry.duration,
        metadata: entry.metadata
      });
    }
  }

  /**
   * Track cache performance
   */
  private trackCachePerformance(operation: string, startTime: number, success: boolean): void {
    const duration = Date.now() - startTime;
    this.performanceMetrics.totalOperations++;
    
    // Update average response time (rolling average)
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalOperations - 1) + duration) / 
      this.performanceMetrics.totalOperations;
    
    // Update cache size
    this.performanceMetrics.cacheSize = this.sessionVerifyCache.size;
    
    // Update error rate
    if (!success) {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate * (this.performanceMetrics.totalOperations - 1) + 1) / 
        this.performanceMetrics.totalOperations;
    }
  }

  /**
   * Generate session cache key consistent with backend format
   * Backend uses format: "session:{tokenHash}" or "auth:{tokenHash}"
   * Frontend middleware uses the full cookie string as key
   */
  generateSessionKey(cookieHeader: string): string {
    return cookieHeader || "_no_cookie";
  }

  /**
   * Generate backend-compatible cache key from token hash
   */
  generateBackendSessionKey(tokenHash: string): string {
    return `session:${tokenHash}`;
  }

  /**
   * Generate backend-compatible auth cache key from token hash
   */
  generateBackendAuthKey(tokenHash: string): string {
    return `auth:${tokenHash}`;
  }

  /**
   * Generate user-based cache key
   */
  generateUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Extract token hash from cookie header for backend key generation
   */
  extractTokenHashFromCookie(cookieHeader: string): string | null {
    if (!cookieHeader) return null;
    
    const parts = cookieHeader.split(";").map((c) => c.trim());
    const accessTokenMatch = parts.find((c) => c.startsWith("accessToken="));
    
    if (!accessTokenMatch) return null;
    
    const tokenValue = accessTokenMatch.split("=")[1];
    if (!tokenValue) return null;
    
    try {
      const decoded = decodeURIComponent(tokenValue);
      // For security, we'll use a simple hash of the token
      // In a real implementation, this should match the backend's token hashing strategy
      return this.simpleHash(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Simple hash function for token hashing
   * Note: This should match the backend's token hashing strategy
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Invalidate authentication cache for a specific session
   * Returns array of cleared cache keys
   */
  async invalidateAuthCache(sessionKey: string): Promise<string[]> {
    const startTime = Date.now();
    const clearedKeys: string[] = [];

    try {
      // Clear middleware session verification cache
      const middlewareKey = this.generateSessionKey(sessionKey);
      if (this.sessionVerifyCache.has(middlewareKey)) {
        this.sessionVerifyCache.delete(middlewareKey);
        clearedKeys.push(`middleware:${middlewareKey}`);
      }

      // Also clear any variations of the session key
      const keysToCheck = [
        sessionKey,
        `accessToken=${sessionKey}`,
        `accessToken=${encodeURIComponent(sessionKey)}`
      ];

      for (const key of keysToCheck) {
        const cacheKey = this.generateSessionKey(key);
        if (this.sessionVerifyCache.has(cacheKey)) {
          this.sessionVerifyCache.delete(cacheKey);
          clearedKeys.push(`middleware:${cacheKey}`);
        }
      }

      // Clear the "_no_cookie" fallback key as well
      if (this.sessionVerifyCache.has("_no_cookie")) {
        this.sessionVerifyCache.delete("_no_cookie");
        clearedKeys.push("middleware:_no_cookie");
      }

      // Log cache invalidation audit entry
      this.addCacheAuditEntry({
        operation: 'invalidate',
        cacheType: 'middleware',
        key: sessionKey,
        success: true,
        duration: Date.now() - startTime,
        metadata: {
          clearedKeys: clearedKeys.length,
          remainingCacheSize: this.sessionVerifyCache.size,
          keysChecked: keysToCheck.length
        }
      });

      this.trackCachePerformance('invalidate', startTime, true);

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Invalidated auth cache", {
          sessionKey,
          clearedKeys,
          remainingCacheSize: this.sessionVerifyCache.size
        });
      }

    } catch (error) {
      // Log cache invalidation error
      this.addCacheAuditEntry({
        operation: 'invalidate',
        cacheType: 'middleware',
        key: sessionKey,
        success: false,
        duration: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });

      this.trackCachePerformance('invalidate', startTime, false);
      console.error("[CacheManager] Error during cache invalidation:", error);
      throw error;
    }

    return clearedKeys;
  }

  /**
   * Clear all authentication caches (bulk invalidation)
   */
  async clearAllAuthCaches(): Promise<string[]> {
    const startTime = Date.now();
    const clearedKeys: string[] = [];

    try {
      // Get all current cache keys before clearing
      const allKeys = Array.from(this.sessionVerifyCache.keys());
      
      // Clear the entire middleware cache
      this.sessionVerifyCache.clear();
      
      // Record all cleared keys
      allKeys.forEach(key => {
        clearedKeys.push(`middleware:${key}`);
      });

      // Log bulk cache clear audit entry
      this.addCacheAuditEntry({
        operation: 'clear',
        cacheType: 'middleware',
        success: true,
        duration: Date.now() - startTime,
        metadata: {
          clearedCount: clearedKeys.length,
          clearedKeys: clearedKeys.slice(0, 10), // Log first 10 keys to avoid spam
          totalKeys: allKeys.length
        }
      });

      this.trackCachePerformance('clear', startTime, true);

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Cleared all auth caches", {
          clearedCount: clearedKeys.length,
          clearedKeys: clearedKeys.slice(0, 10) // Log first 10 keys to avoid spam
        });
      }

    } catch (error) {
      // Log bulk cache clear error
      this.addCacheAuditEntry({
        operation: 'clear',
        cacheType: 'middleware',
        success: false,
        duration: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });

      this.trackCachePerformance('clear', startTime, false);
      console.error("[CacheManager] Error during bulk cache clearing:", error);
      throw error;
    }

    return clearedKeys;
  }

  /**
   * Execute login cache invalidation workflow
   * Comprehensive cache clearing for account switching isolation
   */
  async executeLoginCacheInvalidationWorkflow(): Promise<{
    clearedKeys: string[];
    bypassAdded: boolean;
    stateReset: boolean;
  }> {
    const result = {
      clearedKeys: [] as string[],
      bypassAdded: false,
      stateReset: false
    };

    try {
      if (DEBUG_CACHE) {
        console.log("[CacheManager] Starting login cache invalidation workflow");
      }

      // Step 1: Clear all existing caches
      result.clearedKeys = await this.clearCachesForLogin();

      // Step 2: Add cache bypass for any residual authentication attempts
      this.addCacheBypass("*", 30000); // 30 seconds bypass for any auth attempts
      result.bypassAdded = true;

      // Step 3: Reset authentication state
      await this.resetAuthenticationState();
      result.stateReset = true;

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Login cache invalidation workflow completed", result);
      }

    } catch (error) {
      console.error("[CacheManager] Error during login cache invalidation workflow:", error);
      throw error;
    }

    return result;
  }

  /**
   * Reset authentication state for account switching
   */
  async resetAuthenticationState(): Promise<void> {
    try {
      // Clear any authentication-related state in the cache
      const authStateKeys = [
        'auth:state',
        'user:state',
        'session:state',
        'login:state'
      ];

      authStateKeys.forEach(key => {
        if (this.sessionVerifyCache.has(key)) {
          this.sessionVerifyCache.delete(key);
        }
      });

      // Clear any temporary authentication data
      const tempKeys = Array.from(this.sessionVerifyCache.keys()).filter(key => 
        key.includes('temp:') || key.includes('pending:') || key.includes('switch:')
      );

      tempKeys.forEach(key => {
        this.sessionVerifyCache.delete(key);
      });

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Authentication state reset completed", {
          clearedStateKeys: authStateKeys.length,
          clearedTempKeys: tempKeys.length
        });
      }

    } catch (error) {
      console.error("[CacheManager] Error resetting authentication state:", error);
      throw error;
    }
  }

  /**
   * Clear all authentication caches for pre-login isolation
   * This ensures no cached data from previous accounts remains
   */
  async clearCachesForLogin(): Promise<string[]> {
    const clearedKeys: string[] = [];

    try {
      // Get all current cache keys before clearing
      const allKeys = Array.from(this.sessionVerifyCache.keys());
      
      // Clear the entire middleware cache to ensure complete isolation
      this.sessionVerifyCache.clear();
      
      // Record all cleared keys
      allKeys.forEach(key => {
        clearedKeys.push(`middleware:${key}`);
      });

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Cleared all caches for login isolation", {
          clearedCount: clearedKeys.length,
          clearedKeys: clearedKeys.slice(0, 10) // Log first 10 keys to avoid spam
        });
      }

    } catch (error) {
      console.error("[CacheManager] Error during pre-login cache clearing:", error);
      throw error;
    }

    return clearedKeys;
  }

  /**
   * Invalidate cache for a specific user (all sessions)
   */
  async invalidateUserCaches(userId: string): Promise<string[]> {
    const clearedKeys: string[] = [];

    try {
      // For user-based invalidation, we need to clear all cache entries
      // since we don't have a direct user-to-session mapping in the frontend cache
      // This is a conservative approach to ensure no stale user data remains
      const allKeys = Array.from(this.sessionVerifyCache.keys());
      
      // Clear all entries (conservative approach for user invalidation)
      this.sessionVerifyCache.clear();
      
      allKeys.forEach(key => {
        clearedKeys.push(`middleware:${key}`);
      });

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Invalidated user caches", {
          userId,
          clearedCount: clearedKeys.length
        });
      }

    } catch (error) {
      console.error("[CacheManager] Error during user cache invalidation:", error);
      throw error;
    }

    return clearedKeys;
  }

  /**
   * Add cache bypass for post-logout requests
   * This method marks a session as recently logged out to bypass cache
   */
  addCacheBypass(sessionKey: string, durationMs: number = 60000): void {
    const startTime = Date.now();
    
    try {
      const bypassKey = `bypass:${sessionKey}`;
      const expiry = Date.now() + durationMs;
      
      // Store bypass entry with expiry
      this.sessionVerifyCache.set(bypassKey, { ok: false, exp: expiry });
      this.performanceMetrics.bypassCount++;

      // Log bypass addition
      this.addCacheAuditEntry({
        operation: 'bypass',
        cacheType: 'middleware',
        key: sessionKey,
        success: true,
        duration: Date.now() - startTime,
        metadata: {
          durationMs,
          expiresAt: new Date(expiry).toISOString(),
          bypassKey
        }
      });

      this.trackCachePerformance('bypass', startTime, true);

      if (DEBUG_CACHE) {
        console.log("[CacheManager] Added cache bypass", {
          sessionKey,
          durationMs,
          expiresAt: new Date(expiry).toISOString()
        });
      }

    } catch (error) {
      // Log bypass error
      this.addCacheAuditEntry({
        operation: 'bypass',
        cacheType: 'middleware',
        key: sessionKey,
        success: false,
        duration: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });

      this.trackCachePerformance('bypass', startTime, false);
      console.error("[CacheManager] Error adding cache bypass:", error);
    }
  }

  /**
   * Check if a session should bypass cache (recently logged out)
   */
  shouldBypassCache(sessionKey: string): boolean {
    try {
      const bypassKey = `bypass:${sessionKey}`;
      const bypass = this.sessionVerifyCache.get(bypassKey);
      
      if (!bypass) return false;
      
      const now = Date.now();
      if (bypass.exp <= now) {
        // Cleanup expired bypass entry
        this.sessionVerifyCache.delete(bypassKey);
        return false;
      }
      
      return true;

    } catch (error) {
      console.error("[CacheManager] Error checking cache bypass:", error);
      return false;
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    totalEntries: number;
    bypassEntries: number;
    sessionEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let bypassEntries = 0;
    let sessionEntries = 0;
    let expiredEntries = 0;

    this.sessionVerifyCache.forEach((value, key) => {
      if (value.exp <= now) {
        expiredEntries++;
      } else if (key.startsWith('bypass:')) {
        bypassEntries++;
      } else {
        sessionEntries++;
      }
    });

    return {
      totalEntries: this.sessionVerifyCache.size,
      bypassEntries,
      sessionEntries,
      expiredEntries
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredEntries(): number {
    const startTime = Date.now();
    const now = Date.now();
    let cleanedCount = 0;

    const keysToDelete: string[] = [];
    this.sessionVerifyCache.forEach((value, key) => {
      if (value.exp <= now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.sessionVerifyCache.delete(key);
      cleanedCount++;
    });

    // Log cleanup operation
    if (cleanedCount > 0) {
      this.addCacheAuditEntry({
        operation: 'delete',
        cacheType: 'middleware',
        success: true,
        duration: Date.now() - startTime,
        metadata: {
          cleanedCount,
          remainingEntries: this.sessionVerifyCache.size,
          expiredKeys: keysToDelete.slice(0, 5) // Log first 5 expired keys
        }
      });

      this.trackCachePerformance('delete', startTime, true);
    }

    if (DEBUG_CACHE && cleanedCount > 0) {
      console.log("[CacheManager] Cleaned up expired entries", {
        cleanedCount,
        remainingEntries: this.sessionVerifyCache.size
      });
    }

    return cleanedCount;
  }

  /**
   * Get cache audit trail for debugging
   */
  getCacheAuditTrail(limit: number = 50): CacheAuditEntry[] {
    return this.auditTrail.slice(-limit);
  }

  /**
   * Get cache audit trail filtered by criteria
   */
  getCacheAuditTrailFiltered(filters: {
    operation?: string;
    cacheType?: string;
    userId?: string;
    sessionId?: string;
    success?: boolean;
    since?: string;
  }, limit: number = 50): CacheAuditEntry[] {
    let filtered = this.auditTrail;

    if (filters.operation) {
      filtered = filtered.filter(entry => entry.operation === filters.operation);
    }
    if (filters.cacheType) {
      filtered = filtered.filter(entry => entry.cacheType === filters.cacheType);
    }
    if (filters.userId) {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }
    if (filters.sessionId) {
      filtered = filtered.filter(entry => entry.sessionId === filters.sessionId);
    }
    if (filters.success !== undefined) {
      filtered = filtered.filter(entry => entry.success === filters.success);
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= sinceDate);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get cache performance metrics
   */
  getCachePerformanceMetrics(): CachePerformanceMetrics {
    // Update current cache size
    this.performanceMetrics.cacheSize = this.sessionVerifyCache.size;
    return { ...this.performanceMetrics };
  }

  /**
   * Reset cache performance metrics
   */
  resetCacheMetrics(): void {
    this.performanceMetrics = {
      totalOperations: 0,
      averageResponseTime: 0,
      hitRate: 0,
      errorRate: 0,
      lastResetTime: new Date().toISOString(),
      cacheSize: this.sessionVerifyCache.size,
      bypassCount: 0
    };

    if (DEBUG_CACHE) {
      console.log("[CacheManager] Cache performance metrics reset");
    }
  }

  /**
   * Generate cache health report
   */
  generateCacheHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: CachePerformanceMetrics;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Update current metrics
    this.performanceMetrics.cacheSize = this.sessionVerifyCache.size;
    
    // Check error rate
    if (this.performanceMetrics.errorRate > 5) {
      issues.push(`High cache error rate: ${this.performanceMetrics.errorRate.toFixed(2)}%`);
      recommendations.push('Investigate cache operation errors and improve error handling');
    }
    
    // Check response time
    if (this.performanceMetrics.averageResponseTime > 50) {
      issues.push(`High average response time: ${this.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
      recommendations.push('Consider cache optimization or reducing cache operations');
    }
    
    // Check cache size (frontend should have smaller cache)
    if (this.performanceMetrics.cacheSize > 400) {
      issues.push(`Cache size approaching reasonable limit: ${this.performanceMetrics.cacheSize}`);
      recommendations.push('Consider implementing more aggressive cache cleanup or reducing TTL');
    }
    
    // Check bypass count
    if (this.performanceMetrics.bypassCount > 100) {
      issues.push(`High number of cache bypasses: ${this.performanceMetrics.bypassCount}`);
      recommendations.push('Review cache bypass logic and consider optimizing cache invalidation');
    }
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.some(issue => 
        issue.includes('critical') || 
        this.performanceMetrics.errorRate > 10 || 
        this.performanceMetrics.averageResponseTime > 100
      ) ? 'critical' : 'warning';
    }
    
    return {
      status,
      metrics: this.performanceMetrics,
      issues,
      recommendations
    };
  }
}
