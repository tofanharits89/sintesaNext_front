import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheMetrics } from '../cache-metrics';

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

describe('CacheMetrics', () => {
  let cacheMetrics: CacheMetrics;
  let mockTime = 1000;

  beforeEach(() => {
    cacheMetrics = new CacheMetrics();
    mockTime = 1000;
    mockPerformanceNow.mockImplementation(() => mockTime);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hit/Miss Tracking', () => {
    it('should track cache hits correctly', () => {
      cacheMetrics.recordHit('auth', 'profile');
      cacheMetrics.recordHit('auth', 'verify');
      cacheMetrics.recordHit('dashboard', 'stats');

      const stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(1);
    });

    it('should track cache misses correctly', () => {
      cacheMetrics.recordMiss('auth', 'profile');
      cacheMetrics.recordMiss('financial', 'rankings');

      const stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(0);
    });

    it('should calculate hit rate correctly with mixed hits and misses', () => {
      cacheMetrics.recordHit('auth', 'profile');
      cacheMetrics.recordHit('auth', 'verify');
      cacheMetrics.recordHit('dashboard', 'stats');
      cacheMetrics.recordMiss('financial', 'rankings');

      const stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(0.75);
    });

    it('should handle zero requests gracefully', () => {
      const stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should record query performance correctly', () => {
      const startTime = mockTime;
      mockTime = startTime + 150; // 150ms duration

      cacheMetrics.recordQueryPerformance('auth', 'profile', startTime);

      const stats = cacheMetrics.getStats();
      expect(stats.averageQueryTime).toBe(150);
      expect(stats.totalQueries).toBe(1);
    });

    it('should calculate average query time correctly', () => {
      // First query: 100ms
      let startTime = mockTime;
      mockTime = startTime + 100;
      cacheMetrics.recordQueryPerformance('auth', 'profile', startTime);

      // Second query: 200ms
      startTime = mockTime;
      mockTime = startTime + 200;
      cacheMetrics.recordQueryPerformance('dashboard', 'stats', startTime);

      // Third query: 150ms
      startTime = mockTime;
      mockTime = startTime + 150;
      cacheMetrics.recordQueryPerformance('financial', 'rankings', startTime);

      const stats = cacheMetrics.getStats();
      expect(stats.averageQueryTime).toBe(150); // (100 + 200 + 150) / 3
      expect(stats.totalQueries).toBe(3);
    });

    it('should track slowest queries', () => {
      // Fast query
      let startTime = mockTime;
      mockTime = startTime + 50;
      cacheMetrics.recordQueryPerformance('auth', 'profile', startTime);

      // Slow query
      startTime = mockTime;
      mockTime = startTime + 500;
      cacheMetrics.recordQueryPerformance('financial', 'rankings', startTime);

      // Medium query
      startTime = mockTime;
      mockTime = startTime + 200;
      cacheMetrics.recordQueryPerformance('dashboard', 'stats', startTime);

      const slowQueries = cacheMetrics.getSlowestQueries(2);
      expect(slowQueries).toHaveLength(2);
      expect(slowQueries[0].duration).toBe(500);
      expect(slowQueries[0].queryType).toBe('financial');
      expect(slowQueries[0].queryKey).toBe('rankings');
      expect(slowQueries[1].duration).toBe(200);
    });
  });

  describe('Category-specific Stats', () => {
    it('should track stats by query type', () => {
      // Auth queries
      cacheMetrics.recordHit('auth', 'profile');
      cacheMetrics.recordHit('auth', 'verify');
      cacheMetrics.recordMiss('auth', 'refresh');

      // Dashboard queries
      cacheMetrics.recordHit('dashboard', 'stats');
      cacheMetrics.recordMiss('dashboard', 'charts');
      cacheMetrics.recordMiss('dashboard', 'widgets');

      const authStats = cacheMetrics.getStatsByType('auth');
      expect(authStats.hits).toBe(2);
      expect(authStats.misses).toBe(1);
      expect(authStats.hitRate).toBe(2/3);

      const dashboardStats = cacheMetrics.getStatsByType('dashboard');
      expect(dashboardStats.hits).toBe(1);
      expect(dashboardStats.misses).toBe(2);
      expect(dashboardStats.hitRate).toBe(1/3);
    });

    it('should return empty stats for unknown query type', () => {
      const unknownStats = cacheMetrics.getStatsByType('unknown');
      expect(unknownStats.hits).toBe(0);
      expect(unknownStats.misses).toBe(0);
      expect(unknownStats.hitRate).toBe(0);
    });
  });

  describe('Health Monitoring', () => {
    it('should detect healthy cache performance', () => {
      // Good hit rate and performance
      for (let i = 0; i < 8; i++) {
        cacheMetrics.recordHit('auth', `query${i}`);
      }
      for (let i = 0; i < 2; i++) {
        cacheMetrics.recordMiss('auth', `miss${i}`);
      }

      // Fast queries
      for (let i = 0; i < 5; i++) {
        const startTime = mockTime;
        mockTime = startTime + 50; // 50ms each
        cacheMetrics.recordQueryPerformance('auth', `perf${i}`, startTime);
      }

      const health = cacheMetrics.getHealthStatus();
      expect(health.status).toBe('healthy');
      expect(health.hitRate).toBe(0.8);
      expect(health.averageQueryTime).toBe(50);
      expect(health.issues).toHaveLength(0);
    });

    it('should detect poor hit rate issues', () => {
      // Poor hit rate
      for (let i = 0; i < 2; i++) {
        cacheMetrics.recordHit('auth', `query${i}`);
      }
      for (let i = 0; i < 8; i++) {
        cacheMetrics.recordMiss('auth', `miss${i}`);
      }

      const health = cacheMetrics.getHealthStatus();
      expect(health.status).toBe('warning');
      expect(health.hitRate).toBe(0.2);
      expect(health.issues).toContain('Low hit rate: 20%');
    });

    it('should detect slow query performance issues', () => {
      // Good hit rate but slow queries
      for (let i = 0; i < 8; i++) {
        cacheMetrics.recordHit('auth', `query${i}`);
      }
      for (let i = 0; i < 2; i++) {
        cacheMetrics.recordMiss('auth', `miss${i}`);
      }

      // Slow queries
      for (let i = 0; i < 5; i++) {
        const startTime = mockTime;
        mockTime = startTime + 600; // 600ms each (slow)
        cacheMetrics.recordQueryPerformance('auth', `perf${i}`, startTime);
      }

      const health = cacheMetrics.getHealthStatus();
      expect(health.status).toBe('warning');
      expect(health.averageQueryTime).toBe(600);
      expect(health.issues).toContain('Slow average query time: 600ms');
    });

    it('should detect critical issues', () => {
      // Very poor hit rate and very slow queries
      for (let i = 0; i < 1; i++) {
        cacheMetrics.recordHit('auth', `query${i}`);
      }
      for (let i = 0; i < 9; i++) {
        cacheMetrics.recordMiss('auth', `miss${i}`);
      }

      // Very slow queries
      for (let i = 0; i < 5; i++) {
        const startTime = mockTime;
        mockTime = startTime + 1200; // 1200ms each (very slow)
        cacheMetrics.recordQueryPerformance('auth', `perf${i}`, startTime);
      }

      const health = cacheMetrics.getHealthStatus();
      expect(health.status).toBe('critical');
      expect(health.hitRate).toBe(0.1);
      expect(health.averageQueryTime).toBe(1200);
      expect(health.issues).toHaveLength(2);
      expect(health.issues).toContain('Very low hit rate: 10%');
      expect(health.issues).toContain('Very slow average query time: 1200ms');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics correctly', () => {
      // Add some data
      cacheMetrics.recordHit('auth', 'profile');
      cacheMetrics.recordMiss('dashboard', 'stats');
      
      const startTime = mockTime;
      mockTime = startTime + 100;
      cacheMetrics.recordQueryPerformance('auth', 'profile', startTime);

      // Verify data exists
      let stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(1);
      expect(stats.totalQueries).toBe(1);

      // Reset and verify
      cacheMetrics.reset();
      stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.totalQueries).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.averageQueryTime).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative performance times gracefully', () => {
      const futureTime = mockTime + 1000;
      cacheMetrics.recordQueryPerformance('auth', 'profile', futureTime);

      const stats = cacheMetrics.getStats();
      expect(stats.averageQueryTime).toBe(0); // Should not record negative times
      expect(stats.totalQueries).toBe(0);
    });

    it('should handle very large numbers correctly', () => {
      // Record many hits
      for (let i = 0; i < 10000; i++) {
        cacheMetrics.recordHit('auth', `query${i}`);
      }

      const stats = cacheMetrics.getStats();
      expect(stats.totalHits).toBe(10000);
      expect(stats.hitRate).toBe(1);
    });

    it('should maintain precision with floating point calculations', () => {
      // Create scenario that might cause floating point precision issues
      cacheMetrics.recordHit('auth', 'query1');
      cacheMetrics.recordHit('auth', 'query2');
      cacheMetrics.recordMiss('auth', 'query3');

      const stats = cacheMetrics.getStats();
      expect(stats.hitRate).toBeCloseTo(2/3, 10); // High precision check
    });
  });
});