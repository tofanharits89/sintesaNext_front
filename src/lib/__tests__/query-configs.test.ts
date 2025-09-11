import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  queryKeyFactories, 
  createQueryOptions, 
  createInfiniteQueryOptions,
  cacheConfigs 
} from '../query-configs';

describe('Query Configurations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queryKeyFactories', () => {
    it('should generate correct auth query keys', () => {
      expect(queryKeyFactories.auth.all()).toEqual(['auth']);
      expect(queryKeyFactories.auth.profile()).toEqual(['auth', 'profile']);
      expect(queryKeyFactories.auth.verify()).toEqual(['auth', 'verify']);
    });

    it('should generate correct financial query keys', () => {
      expect(queryKeyFactories.financial.all()).toEqual(['financial']);
      expect(queryKeyFactories.financial.mbg.all()).toEqual(['financial', 'mbg']);
      expect(queryKeyFactories.financial.mbg.rankings()).toEqual(['financial', 'mbg', 'rankings']);
      expect(queryKeyFactories.financial.mbg.mapStats()).toEqual(['financial', 'mbg', 'mapStats']);
    });

    it('should generate correct dashboard query keys', () => {
      expect(queryKeyFactories.dashboard.all()).toEqual(['dashboard']);
      expect(queryKeyFactories.dashboard.stats()).toEqual(['dashboard', 'stats']);
      expect(queryKeyFactories.dashboard.charts()).toEqual(['dashboard', 'charts']);
    });

    it('should generate correct messaging query keys', () => {
      expect(queryKeyFactories.messaging.all()).toEqual(['messaging']);
      expect(queryKeyFactories.messaging.conversations()).toEqual(['messaging', 'conversations']);
      expect(queryKeyFactories.messaging.messages(123)).toEqual(['messaging', 'messages', 123]);
    });

    it('should generate correct search query keys', () => {
      expect(queryKeyFactories.search.all()).toEqual(['search']);
      expect(queryKeyFactories.search.results('test')).toEqual(['search', 'results', 'test']);
      expect(queryKeyFactories.search.suggestions()).toEqual(['search', 'suggestions']);
    });
  });

  describe('cacheConfigs', () => {
    it('should have correct cache configuration for auth', () => {
      const authConfig = cacheConfigs.auth;
      expect(authConfig.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(authConfig.gcTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(authConfig.retry).toBe(2);
      expect(authConfig.refetchOnWindowFocus).toBe(true);
      expect(authConfig.refetchOnReconnect).toBe(true);
    });

    it('should have correct cache configuration for financial', () => {
      const financialConfig = cacheConfigs.financial;
      expect(financialConfig.staleTime).toBe(2 * 60 * 1000); // 2 minutes
      expect(financialConfig.gcTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(financialConfig.retry).toBe(3);
      expect(financialConfig.refetchOnWindowFocus).toBe(false);
      expect(financialConfig.refetchOnReconnect).toBe(true);
    });

    it('should have correct cache configuration for dashboard', () => {
      const dashboardConfig = cacheConfigs.dashboard;
      expect(dashboardConfig.staleTime).toBe(30 * 1000); // 30 seconds
      expect(dashboardConfig.gcTime).toBe(2 * 60 * 1000); // 2 minutes
      expect(dashboardConfig.retry).toBe(2);
      expect(dashboardConfig.refetchOnWindowFocus).toBe(true);
      expect(dashboardConfig.refetchOnReconnect).toBe(true);
    });

    it('should have correct cache configuration for realtime', () => {
      const realtimeConfig = cacheConfigs.realtime;
      expect(realtimeConfig.staleTime).toBe(30 * 1000); // 30 seconds
      expect(realtimeConfig.gcTime).toBe(30 * 60 * 1000); // 30 minutes
      expect(realtimeConfig.retry).toBe(1);
      expect(realtimeConfig.refetchOnWindowFocus).toBe(false);
      expect(realtimeConfig.refetchOnReconnect).toBe(true);
    });

    it('should have correct cache configuration for static', () => {
      const staticConfig = cacheConfigs.static;
      expect(staticConfig.staleTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(staticConfig.gcTime).toBe(30 * 60 * 1000); // 30 minutes
      expect(staticConfig.retry).toBe(1);
      expect(staticConfig.refetchOnWindowFocus).toBe(false);
      expect(staticConfig.refetchOnReconnect).toBe(false);
    });
  });

  describe('createQueryOptions', () => {
    it('should return correct options for auth queries', () => {
      const options = createQueryOptions('auth');
      expect(options.staleTime).toBe(5 * 60 * 1000);
      expect(options.gcTime).toBe(10 * 60 * 1000);
      expect(options.retry).toBe(2);
      expect(options.refetchOnWindowFocus).toBe(true);
      expect(options.refetchOnReconnect).toBe(true);
    });

    it('should return correct options for financial queries', () => {
      const options = createQueryOptions('financial');
      expect(options.staleTime).toBe(2 * 60 * 1000);
      expect(options.gcTime).toBe(5 * 60 * 1000);
      expect(options.retry).toBe(3);
      expect(options.refetchOnWindowFocus).toBe(false);
      expect(options.refetchOnReconnect).toBe(true);
    });

    it('should return default options for unknown cache type', () => {
      const options = createQueryOptions('unknown' as any);
      expect(options.staleTime).toBe(5 * 60 * 1000); // default
      expect(options.gcTime).toBe(10 * 60 * 1000); // default
      expect(options.retry).toBe(2); // default
    });
  });

  describe('createInfiniteQueryOptions', () => {
    it('should return correct options for realtime infinite queries', () => {
      const options = createInfiniteQueryOptions('realtime');
      expect(options.staleTime).toBe(30 * 1000);
      expect(options.gcTime).toBe(30 * 60 * 1000);
      expect(options.retry).toBe(1);
      expect(options.refetchOnWindowFocus).toBe(false);
      expect(options.refetchOnReconnect).toBe(true);
    });

    it('should return correct options for dashboard infinite queries', () => {
      const options = createInfiniteQueryOptions('dashboard');
      expect(options.staleTime).toBe(30 * 1000);
      expect(options.gcTime).toBe(2 * 60 * 1000);
      expect(options.retry).toBe(2);
      expect(options.refetchOnWindowFocus).toBe(true);
      expect(options.refetchOnReconnect).toBe(true);
    });

    it('should return default options for unknown cache type', () => {
      const options = createInfiniteQueryOptions('unknown' as any);
      expect(options.staleTime).toBe(5 * 60 * 1000); // default
      expect(options.gcTime).toBe(10 * 60 * 1000); // default
      expect(options.retry).toBe(2); // default
    });
  });

  describe('Query Key Consistency', () => {
    it('should maintain consistent key structure across all factories', () => {
      // All factories should return arrays
      expect(Array.isArray(queryKeyFactories.auth.all())).toBe(true);
      expect(Array.isArray(queryKeyFactories.financial.all())).toBe(true);
      expect(Array.isArray(queryKeyFactories.dashboard.all())).toBe(true);
      expect(Array.isArray(queryKeyFactories.messaging.all())).toBe(true);
      expect(Array.isArray(queryKeyFactories.search.all())).toBe(true);
    });

    it('should have hierarchical key structure', () => {
      // Child keys should include parent keys
      const authAll = queryKeyFactories.auth.all();
      const authProfile = queryKeyFactories.auth.profile();
      
      expect(authProfile).toEqual([...authAll, 'profile']);
      
      const financialAll = queryKeyFactories.financial.all();
      const financialMbgAll = queryKeyFactories.financial.mbg.all();
      const financialMbgRankings = queryKeyFactories.financial.mbg.rankings();
      
      expect(financialMbgAll).toEqual([...financialAll, 'mbg']);
      expect(financialMbgRankings).toEqual([...financialMbgAll, 'rankings']);
    });
  });

  describe('Performance Considerations', () => {
    it('should have appropriate stale times for different data types', () => {
      // Auth data should be cached longer (less frequent changes)
      expect(cacheConfigs.auth.staleTime).toBeGreaterThan(cacheConfigs.dashboard.staleTime);
      
      // Static data should be cached longest
      expect(cacheConfigs.static.staleTime).toBeGreaterThan(cacheConfigs.auth.staleTime);
      
      // Realtime data should have shorter stale time
      expect(cacheConfigs.realtime.staleTime).toBeLessThan(cacheConfigs.financial.staleTime);
    });

    it('should have appropriate garbage collection times', () => {
      // GC time should always be greater than stale time
      Object.values(cacheConfigs).forEach(config => {
        expect(config.gcTime).toBeGreaterThan(config.staleTime);
      });
    });

    it('should have reasonable retry counts', () => {
      // Retry counts should be reasonable (1-3)
      Object.values(cacheConfigs).forEach(config => {
        expect(config.retry).toBeGreaterThanOrEqual(1);
        expect(config.retry).toBeLessThanOrEqual(3);
      });
    });
  });
});