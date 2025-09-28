/**
 * Unit Tests for Frontend Cache Manager
 * Tests frontend cache invalidation logic, cross-layer coordination,
 * and error handling scenarios
 */

import { CacheManager } from '../cache-manager';

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Store original console
const originalConsole = global.console;

describe('Frontend CacheManager Unit Tests', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Mock console
    global.console = mockConsole as any;
    
    // Clear global cache state
    if (typeof globalThis !== 'undefined') {
      globalThis.__middlewareSessionCache = undefined;
      globalThis.__cacheAuditTrail = undefined;
      globalThis.__cachePerformanceMetrics = undefined;
    }
    
    // Create fresh cache manager instance
    cacheManager = new CacheManager();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
  });

  describe('Cache Key Generation', () => {
    test('should generate session key from cookie header', () => {
      const cookieHeader = 'accessToken=abc123; refreshToken=def456';
      const sessionKey = cacheManager.generateSessionKey(cookieHeader);
      expect(sessionKey).toBe(cookieHeader);
    });

    test('should handle empty cookie header', () => {
      const sessionKey = cacheManager.generateSessionKey('');
      expect(sessionKey).toBe('_no_cookie');
    });

    test('should generate backend-compatible session key', () => {
      const tokenHash = 'abc123hash';
      const backendKey = cacheManager.generateBackendSessionKey(tokenHash);
      expect(backendKey).toBe('session:abc123hash');
    });

    test('should generate backend-compatible auth key', () => {
      const tokenHash = 'abc123hash';
      const authKey = cacheManager.generateBackendAuthKey(tokenHash);
      expect(authKey).toBe('auth:abc123hash');
    });

    test('should generate user key', () => {
      const userId = 'user123';
      const userKey = cacheManager.generateUserKey(userId);
      expect(userKey).toBe('user:user123');
    });

    test('should extract token hash from cookie header', () => {
      const cookieHeader = 'accessToken=mytoken123; refreshToken=refresh456';
      const tokenHash = cacheManager.extractTokenHashFromCookie(cookieHeader);
      expect(tokenHash).toBeTruthy();
      expect(typeof tokenHash).toBe('string');
    });

    test('should handle malformed cookie header', () => {
      const cookieHeader = 'invalidcookie';
      const tokenHash = cacheManager.extractTokenHashFromCookie(cookieHeader);
      expect(tokenHash).toBeNull();
    });

    test('should handle empty cookie header for token extraction', () => {
      const tokenHash = cacheManager.extractTokenHashFromCookie('');
      expect(tokenHash).toBeNull();
    });
  });

  describe('Individual Cache Invalidation', () => {
    test('should invalidate auth cache for specific session', async () => {
      // Populate cache first
      const sessionKey = 'accessToken=test123';
      const middlewareKey = cacheManager.generateSessionKey(sessionKey);
      
      // Manually add entry to cache to simulate populated state
      const cache = (cacheManager as any).sessionVerifyCache;
      cache.set(middlewareKey, { ok: true, exp: Date.now() + 30000 });
      
      expect(cache.has(middlewareKey)).toBe(true);

      // Invalidate cache
      const clearedKeys = await cacheManager.invalidateAuthCache(sessionKey);

      // Verify cache is cleared
      expect(cache.has(middlewareKey)).toBe(false);
      expect(clearedKeys.length).toBeGreaterThan(0);
      expect(clearedKeys).toContain(`middleware:${middlewareKey}`);
    });

    test('should handle cache invalidation with multiple key variations', async () => {
      const sessionKey = 'test123';
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Add multiple variations to cache
      const variations = [
        sessionKey,
        `accessToken=${sessionKey}`,
        `accessToken=${encodeURIComponent(sessionKey)}`
      ];
      
      variations.forEach(variation => {
        const key = cacheManager.generateSessionKey(variation);
        cache.set(key, { ok: true, exp: Date.now() + 30000 });
      });

      // Invalidate cache
      const clearedKeys = await cacheManager.invalidateAuthCache(sessionKey);

      // Verify all variations are cleared
      variations.forEach(variation => {
        const key = cacheManager.generateSessionKey(variation);
        expect(cache.has(key)).toBe(false);
      });
      
      expect(clearedKeys.length).toBeGreaterThan(0);
    });

    test('should clear fallback cache key', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Add fallback key to cache
      cache.set('_no_cookie', { ok: true, exp: Date.now() + 30000 });
      
      expect(cache.has('_no_cookie')).toBe(true);

      // Invalidate cache
      const clearedKeys = await cacheManager.invalidateAuthCache('test123');

      // Verify fallback key is cleared
      expect(cache.has('_no_cookie')).toBe(false);
      expect(clearedKeys).toContain('middleware:_no_cookie');
    });

    test('should handle cache invalidation when cache is empty', async () => {
      // Ensure cache is empty
      const cache = (cacheManager as any).sessionVerifyCache;
      cache.clear();

      // Attempt invalidation on empty cache
      const clearedKeys = await cacheManager.invalidateAuthCache('test123');

      // Should not throw and return empty array
      expect(clearedKeys).toEqual([]);
    });
  });

  describe('Bulk Cache Operations', () => {
    test('should clear all authentication caches', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Populate cache with multiple entries
      const testEntries = [
        'accessToken=token1',
        'accessToken=token2',
        'session:test',
        '_no_cookie'
      ];
      
      testEntries.forEach(key => {
        cache.set(key, { ok: true, exp: Date.now() + 30000 });
      });
      
      expect(cache.size).toBe(testEntries.length);

      // Clear all caches
      const clearedKeys = await cacheManager.clearAllAuthCaches();

      // Verify all entries are cleared
      expect(cache.size).toBe(0);
      expect(clearedKeys.length).toBe(testEntries.length);
      
      testEntries.forEach(key => {
        expect(clearedKeys).toContain(`middleware:${key}`);
      });
    });

    test('should handle bulk clear when cache is empty', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      cache.clear();

      // Clear all caches when empty
      const clearedKeys = await cacheManager.clearAllAuthCaches();

      // Should not throw and return empty array
      expect(clearedKeys).toEqual([]);
    });
  });

  describe('User-Based Cache Invalidation', () => {
    test('should invalidate all caches for user', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      const userId = 'user123';
      
      // Populate cache with user-related entries
      const userEntries = [
        'accessToken=usertoken1',
        'accessToken=usertoken2',
        'session:user123'
      ];
      
      userEntries.forEach(key => {
        cache.set(key, { ok: true, exp: Date.now() + 30000 });
      });

      // Invalidate user caches (conservative approach - clears all)
      const clearedKeys = await cacheManager.invalidateUserCaches(userId);

      // Verify all entries are cleared (conservative approach)
      expect(cache.size).toBe(0);
      expect(clearedKeys.length).toBe(userEntries.length);
    });
  });

  describe('Login Cache Invalidation Workflow', () => {
    test('should execute complete login cache invalidation workflow', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Populate cache
      cache.set('accessToken=oldtoken', { ok: true, exp: Date.now() + 30000 });
      cache.set('session:old', { ok: true, exp: Date.now() + 30000 });
      
      expect(cache.size).toBeGreaterThan(0);

      // Execute workflow
      const result = await cacheManager.executeLoginCacheInvalidationWorkflow();

      // Verify workflow results
      expect(result.clearedKeys.length).toBeGreaterThan(0);
      expect(result.bypassAdded).toBe(true);
      expect(result.stateReset).toBe(true);
      
      // Verify cache is cleared
      expect(cache.size).toBe(1); // Only bypass entry should remain
      
      // Verify bypass entry exists
      expect(cache.has('bypass:*')).toBe(true);
    });

    test('should reset authentication state', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Add authentication state entries
      const authStateKeys = [
        'auth:state',
        'user:state',
        'session:state',
        'login:state'
      ];
      
      authStateKeys.forEach(key => {
        cache.set(key, { ok: true, exp: Date.now() + 30000 });
      });
      
      // Add temporary entries
      cache.set('temp:auth:user123', { ok: true, exp: Date.now() + 30000 });
      cache.set('pending:login:user123', { ok: true, exp: Date.now() + 30000 });

      // Reset authentication state
      await cacheManager.resetAuthenticationState();

      // Verify state entries are cleared
      authStateKeys.forEach(key => {
        expect(cache.has(key)).toBe(false);
      });
      
      expect(cache.has('temp:auth:user123')).toBe(false);
      expect(cache.has('pending:login:user123')).toBe(false);
    });

    test('should clear caches for login isolation', async () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Populate cache with previous account data
      const previousAccountEntries = [
        'accessToken=prevtoken1',
        'accessToken=prevtoken2',
        'user:prevuser',
        'session:prevsession'
      ];
      
      previousAccountEntries.forEach(key => {
        cache.set(key, { ok: true, exp: Date.now() + 30000 });
      });

      // Clear caches for login
      const clearedKeys = await cacheManager.clearCachesForLogin();

      // Verify complete isolation (all entries cleared)
      expect(cache.size).toBe(0);
      expect(clearedKeys.length).toBe(previousAccountEntries.length);
    });
  });

  describe('Cache Bypass Functionality', () => {
    test('should add cache bypass for post-logout requests', () => {
      const sessionKey = 'accessToken=loggedouttoken';
      const durationMs = 30000; // 30 seconds
      
      // Add cache bypass
      cacheManager.addCacheBypass(sessionKey, durationMs);
      
      // Verify bypass is active
      const shouldBypass = cacheManager.shouldBypassCache(sessionKey);
      expect(shouldBypass).toBe(true);
      
      // Verify bypass entry exists in cache
      const cache = (cacheManager as any).sessionVerifyCache;
      const bypassKey = `bypass:${sessionKey}`;
      expect(cache.has(bypassKey)).toBe(true);
      
      const bypassEntry = cache.get(bypassKey);
      expect(bypassEntry.ok).toBe(false);
      expect(bypassEntry.exp).toBeGreaterThan(Date.now());
    });

    test('should check cache bypass correctly', () => {
      const sessionKey = 'test-session';
      
      // Initially no bypass
      expect(cacheManager.shouldBypassCache(sessionKey)).toBe(false);
      
      // Add bypass
      cacheManager.addCacheBypass(sessionKey, 30000);
      
      // Should bypass now
      expect(cacheManager.shouldBypassCache(sessionKey)).toBe(true);
    });

    test('should handle expired bypass entries', () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      const sessionKey = 'expired-session';
      const bypassKey = `bypass:${sessionKey}`;
      
      // Add expired bypass entry
      cache.set(bypassKey, { ok: false, exp: Date.now() - 1000 }); // Expired 1 second ago
      
      // Should not bypass and should clean up expired entry
      const shouldBypass = cacheManager.shouldBypassCache(sessionKey);
      expect(shouldBypass).toBe(false);
      expect(cache.has(bypassKey)).toBe(false);
    });
  });

  describe('Cache Statistics and Monitoring', () => {
    test('should provide cache statistics', () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Add various types of entries
      cache.set('accessToken=token1', { ok: true, exp: Date.now() + 30000 });
      cache.set('bypass:session1', { ok: false, exp: Date.now() + 30000 });
      cache.set('expired:entry', { ok: true, exp: Date.now() - 1000 });
      
      const stats = cacheManager.getCacheStats();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.bypassEntries).toBe(1);
      expect(stats.sessionEntries).toBe(1);
      expect(stats.expiredEntries).toBe(1);
    });

    test('should cleanup expired cache entries', () => {
      const cache = (cacheManager as any).sessionVerifyCache;
      
      // Add mix of valid and expired entries
      cache.set('valid:entry1', { ok: true, exp: Date.now() + 30000 });
      cache.set('valid:entry2', { ok: true, exp: Date.now() + 30000 });
      cache.set('expired:entry1', { ok: true, exp: Date.now() - 1000 });
      cache.set('expired:entry2', { ok: true, exp: Date.now() - 2000 });
      
      expect(cache.size).toBe(4);
      
      // Cleanup expired entries
      const cleanedCount = cacheManager.cleanupExpiredEntries();
      
      expect(cleanedCount).toBe(2);
      expect(cache.size).toBe(2);
      expect(cache.has('valid:entry1')).toBe(true);
      expect(cache.has('valid:entry2')).toBe(true);
      expect(cache.has('expired:entry1')).toBe(false);
      expect(cache.has('expired:entry2')).toBe(false);
    });

    test('should provide cache audit trail', () => {
      // Perform some cache operations to generate audit trail
      cacheManager.addCacheBypass('test-session', 30000);
      
      const auditTrail = cacheManager.getCacheAuditTrail(10);
      
      expect(Array.isArray(auditTrail)).toBe(true);
      expect(auditTrail.length).toBeGreaterThan(0);
      
      const bypassEntry = auditTrail.find(entry => entry.operation === 'bypass');
      expect(bypassEntry).toBeTruthy();
      expect(bypassEntry?.success).toBe(true);
    });

    test('should provide filtered cache audit trail', async () => {
      // Perform operations to generate audit entries
      await cacheManager.invalidateAuthCache('test-session');
      cacheManager.addCacheBypass('test-session', 30000);
      
      // Get filtered audit trail
      const filteredTrail = cacheManager.getCacheAuditTrailFiltered({
        operation: 'invalidate',
        success: true
      }, 5);
      
      expect(Array.isArray(filteredTrail)).toBe(true);
      filteredTrail.forEach(entry => {
        expect(entry.operation).toBe('invalidate');
        expect(entry.success).toBe(true);
      });
    });

    test('should provide cache performance metrics', () => {
      const metrics = cacheManager.getCachePerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalOperations');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('lastResetTime');
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('bypassCount');
      
      expect(typeof metrics.totalOperations).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.cacheSize).toBe('number');
    });

    test('should reset cache metrics', () => {
      // Perform operations to generate metrics
      cacheManager.addCacheBypass('test', 30000);
      
      let metrics = cacheManager.getCachePerformanceMetrics();
      expect(metrics.totalOperations).toBeGreaterThan(0);
      
      // Reset metrics
      cacheManager.resetCacheMetrics();
      
      metrics = cacheManager.getCachePerformanceMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.bypassCount).toBe(0);
    });

    test('should generate cache health report', () => {
      const healthReport = cacheManager.generateCacheHealthReport();
      
      expect(healthReport).toHaveProperty('status');
      expect(healthReport).toHaveProperty('metrics');
      expect(healthReport).toHaveProperty('issues');
      expect(healthReport).toHaveProperty('recommendations');
      
      expect(['healthy', 'warning', 'critical']).toContain(healthReport.status);
      expect(Array.isArray(healthReport.issues)).toBe(true);
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle cache invalidation errors gracefully', async () => {
      // Mock cache operation to throw error
      const cache = (cacheManager as any).sessionVerifyCache;
      const originalHas = cache.has;
      
      // Mock has() to return true so delete() will be called
      cache.has = jest.fn().mockReturnValue(true);
      
      const originalDelete = cache.delete;
      cache.delete = jest.fn().mockImplementationOnce(() => {
        throw new Error('Cache operation failed');
      });
      
      try {
        // Should throw error and propagate it
        await expect(cacheManager.invalidateAuthCache('test-session')).rejects.toThrow('Cache operation failed');
      } finally {
        // Restore original methods
        cache.delete = originalDelete;
        cache.has = originalHas;
      }
    });

    test('should handle cache bypass errors gracefully', () => {
      // Mock cache operation to throw error
      const cache = (cacheManager as any).sessionVerifyCache;
      const originalSet = cache.set;
      cache.set = jest.fn().mockImplementationOnce(() => {
        throw new Error('Cache set failed');
      });
      
      try {
        // Should not throw error but log it
        expect(() => cacheManager.addCacheBypass('test-session', 30000)).not.toThrow();
        
        // Verify error was logged
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining('Error adding cache bypass:'),
          expect.any(Error)
        );
      } finally {
        // Restore original method
        cache.set = originalSet;
      }
    });

    test('should handle cache bypass check errors gracefully', () => {
      // Mock cache operation to throw error
      const cache = (cacheManager as any).sessionVerifyCache;
      const originalGet = cache.get;
      cache.get = jest.fn().mockImplementationOnce(() => {
        throw new Error('Cache get failed');
      });
      
      try {
        // Should return false on error and not throw
        const shouldBypass = cacheManager.shouldBypassCache('test-session');
        expect(shouldBypass).toBe(false);
        
        // Verify error was logged
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining('Error checking cache bypass:'),
          expect.any(Error)
        );
      } finally {
        // Restore original method
        cache.get = originalGet;
      }
    });
  });

  describe('Cross-Layer Coordination', () => {
    test('should coordinate with backend cache key format', () => {
      const tokenHash = 'abc123hash';
      
      // Generate backend-compatible keys
      const sessionKey = cacheManager.generateBackendSessionKey(tokenHash);
      const authKey = cacheManager.generateBackendAuthKey(tokenHash);
      
      // Verify format matches backend expectations
      expect(sessionKey).toBe(`session:${tokenHash}`);
      expect(authKey).toBe(`auth:${tokenHash}`);
    });

    test('should handle token hash extraction for backend coordination', () => {
      const cookieHeader = 'accessToken=mytoken123; path=/; httpOnly';
      const tokenHash = cacheManager.extractTokenHashFromCookie(cookieHeader);
      
      expect(tokenHash).toBeTruthy();
      expect(typeof tokenHash).toBe('string');
      
      // Should be able to generate backend keys with extracted hash
      if (tokenHash) {
        const backendSessionKey = cacheManager.generateBackendSessionKey(tokenHash);
        const backendAuthKey = cacheManager.generateBackendAuthKey(tokenHash);
        
        expect(backendSessionKey).toContain(tokenHash);
        expect(backendAuthKey).toContain(tokenHash);
      }
    });
  });
});