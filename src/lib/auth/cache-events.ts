/**
 * Unified Cache Invalidation System
 * Phase 4: Cache Unification
 * 
 * Provides event-based cache invalidation across:
 * - React Query (API response caching)
 * - Zustand (application state)
 * - localStorage (persistent storage)
 * - sessionStorage (session storage)
 */

import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/utils";
import { useAuthSessionStore } from "@/stores/session-store";

// ============================================================================
// TYPES
// ============================================================================

export type CacheInvalidationEvent = 
  | 'auth_logout'
  | 'auth_login'
  | 'auth_expired'
  | 'user_updated'
  | 'token_refreshed'
  | 'clear_all';

export interface CacheInvalidationOptions {
  preserveTheme?: boolean;
  preserveLanguage?: boolean;
  clearReactQuery?: boolean;
  clearZustand?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
}

// ============================================================================
// CACHE EVENT MANAGER
// ============================================================================

class CacheEventManager {
  private queryClient: QueryClient | null = null;
  private eventHistory: Array<{ event: CacheInvalidationEvent; timestamp: number }> = [];
  private maxHistorySize = 50;

  /**
   * Set the React Query client instance
   */
  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
    logger.debug('[CacheEvents] Query client registered');
  }

  /**
   * Invalidate authentication-related caches
   */
  invalidateAuth(options: CacheInvalidationOptions = {}): void {
    const {
      preserveTheme = true,
      preserveLanguage = true,
      clearReactQuery = true,
      clearZustand = true,
      clearLocalStorage = true,
      clearSessionStorage = true,
    } = options;

    logger.info('[CacheEvents] Invalidating auth caches', options);

    // Clear React Query cache
    if (clearReactQuery && this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      this.queryClient.invalidateQueries({ queryKey: ['user'] });
      this.queryClient.removeQueries({ queryKey: ['auth', 'user'] });
      logger.debug('[CacheEvents] ✅ React Query auth cache cleared');
    }

    // Clear Zustand store
    if (clearZustand) {
      const authStore = useAuthSessionStore.getState();
      authStore.reset();
      logger.debug('[CacheEvents] ✅ Zustand auth store reset');
    }

    // Clear localStorage (preserve theme and language if requested)
    if (clearLocalStorage && typeof window !== 'undefined') {
      const preserved: Record<string, string | null> = {};
      
      if (preserveTheme) {
        preserved.theme = localStorage.getItem('theme');
      }
      if (preserveLanguage) {
        preserved.language = localStorage.getItem('language');
        preserved.i18nextLng = localStorage.getItem('i18nextLng');
      }

      localStorage.clear();

      // Restore preserved items
      Object.entries(preserved).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });

      logger.debug('[CacheEvents] ✅ localStorage cleared (preserved items restored)');
    }

    // Clear sessionStorage
    if (clearSessionStorage && typeof window !== 'undefined') {
      sessionStorage.clear();
      logger.debug('[CacheEvents] ✅ sessionStorage cleared');
    }

    this.recordEvent('auth_logout');
  }

  /**
   * Invalidate user-specific data caches
   */
  invalidateUser(userId?: string): void {
    logger.info('[CacheEvents] Invalidating user caches', { userId });

    if (this.queryClient) {
      if (userId) {
        this.queryClient.invalidateQueries({ queryKey: ['user', userId] });
      } else {
        this.queryClient.invalidateQueries({ queryKey: ['user'] });
      }
      logger.debug('[CacheEvents] ✅ User cache invalidated');
    }

    this.recordEvent('user_updated');
  }

  /**
   * Invalidate all data-related queries (dashboard, reports, etc.)
   */
  invalidateDataQueries(): void {
    logger.info('[CacheEvents] Invalidating data queries');

    if (!this.queryClient) {
      logger.warn('[CacheEvents] No query client available');
      return;
    }

    const dataQueryKeys = [
      'realisasi-per-jenis-belanja',
      'realisasi-kl-per-fungsi',
      'quick-stats',
      'realisasi-kl-pagu-terbesar',
      'realisasi-kl-pagu-program-terbesar',
      'tren-realisasi-bulanan',
      'persentase-realisasi-kl',
      'satker',
      'dashboard',
    ];

    dataQueryKeys.forEach(key => {
      this.queryClient!.removeQueries({ queryKey: [key] });
    });

    logger.debug('[CacheEvents] ✅ Data queries cleared');
  }

  /**
   * Clear all caches (nuclear option)
   */
  invalidateAll(options: CacheInvalidationOptions = {}): void {
    const {
      preserveTheme = true,
      preserveLanguage = true,
    } = options;

    logger.warn('[CacheEvents] CLEARING ALL CACHES');

    // Clear React Query completely
    if (this.queryClient) {
      this.queryClient.clear();
      logger.debug('[CacheEvents] ✅ All React Query cache cleared');
    }

    // Reset Zustand
    const authStore = useAuthSessionStore.getState();
    authStore.reset();
    logger.debug('[CacheEvents] ✅ Zustand reset');

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const preserved: Record<string, string | null> = {};
      
      if (preserveTheme) {
        preserved.theme = localStorage.getItem('theme');
      }
      if (preserveLanguage) {
        preserved.language = localStorage.getItem('language');
        preserved.i18nextLng = localStorage.getItem('i18nextLng');
      }

      localStorage.clear();

      Object.entries(preserved).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });

      logger.debug('[CacheEvents] ✅ localStorage cleared');
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      logger.debug('[CacheEvents] ✅ sessionStorage cleared');
    }

    this.recordEvent('clear_all');
  }

  /**
   * Handle token refresh event
   */
  onTokenRefresh(): void {
    logger.info('[CacheEvents] Token refreshed - no cache invalidation needed');
    this.recordEvent('token_refreshed');
  }

  /**
   * Handle login event
   */
  onLogin(): void {
    logger.info('[CacheEvents] Login successful - clearing stale caches');
    
    // Clear any stale data from previous sessions
    if (this.queryClient) {
      this.queryClient.removeQueries({ 
        predicate: (query) => {
          // Remove queries older than 5 minutes
          const queryState = query.state;
          const dataUpdatedAt = queryState.dataUpdatedAt;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          return dataUpdatedAt < fiveMinutesAgo;
        }
      });
    }

    this.recordEvent('auth_login');
  }

  /**
   * Handle session expiry event
   */
  onSessionExpired(): void {
    logger.warn('[CacheEvents] Session expired - clearing all auth caches');
    this.invalidateAuth();
    this.recordEvent('auth_expired');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    reactQueryCacheSize: number;
    localStorageSize: number;
    sessionStorageSize: number;
    recentEvents: Array<{ event: CacheInvalidationEvent; timestamp: number }>;
  } {
    const stats = {
      reactQueryCacheSize: 0,
      localStorageSize: 0,
      sessionStorageSize: 0,
      recentEvents: this.eventHistory.slice(-10),
    };

    // React Query cache size
    if (this.queryClient) {
      const cache = this.queryClient.getQueryCache();
      stats.reactQueryCacheSize = cache.getAll().length;
    }

    // localStorage size (approximate)
    if (typeof window !== 'undefined') {
      try {
        stats.localStorageSize = Object.keys(localStorage).length;
        stats.sessionStorageSize = Object.keys(sessionStorage).length;
      } catch (error) {
        logger.warn('[CacheEvents] Failed to get storage stats', error);
      }
    }

    return stats;
  }

  /**
   * Record cache invalidation event for debugging
   */
  private recordEvent(event: CacheInvalidationEvent): void {
    this.eventHistory.push({
      event,
      timestamp: Date.now(),
    });

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Debug: Log current cache state
   */
  debugCacheState(): void {
    const stats = this.getCacheStats();
    
    logger.info('[CacheEvents] Cache State:', {
      reactQueryQueries: stats.reactQueryCacheSize,
      localStorageKeys: stats.localStorageSize,
      sessionStorageKeys: stats.sessionStorageSize,
      recentEvents: stats.recentEvents,
    });

    // Log React Query cache details
    if (this.queryClient) {
      const queries = this.queryClient.getQueryCache().getAll();
      const queryDetails = queries.map(q => ({
        key: q.queryKey,
        state: q.state.status,
        dataUpdatedAt: new Date(q.state.dataUpdatedAt).toISOString(),
      }));
      
      logger.debug('[CacheEvents] React Query Details:', queryDetails);
    }

    // Log localStorage contents
    if (typeof window !== 'undefined') {
      const localStorageContents = Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key)?.substring(0, 50) + '...';
        return acc;
      }, {} as Record<string, string>);
      
      logger.debug('[CacheEvents] localStorage Contents:', localStorageContents);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cacheEvents = new CacheEventManager();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize cache event system with React Query client
 */
export function initializeCacheEvents(queryClient: QueryClient): void {
  cacheEvents.setQueryClient(queryClient);
  logger.info('[CacheEvents] Cache event system initialized');
}

/**
 * Clear all authentication-related caches
 */
export function clearAuthCaches(options?: CacheInvalidationOptions): void {
  cacheEvents.invalidateAuth(options);
}

/**
 * Clear user-specific caches
 */
export function clearUserCaches(userId?: string): void {
  cacheEvents.invalidateUser(userId);
}

/**
 * Clear all data query caches
 */
export function clearDataCaches(): void {
  cacheEvents.invalidateDataQueries();
}

/**
 * Clear all caches (nuclear option)
 */
export function clearAllCaches(options?: CacheInvalidationOptions): void {
  cacheEvents.invalidateAll(options);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheEvents.getCacheStats();
}

/**
 * Debug cache state
 */
export function debugCacheState(): void {
  cacheEvents.debugCacheState();
}

// Export the manager for advanced usage
export default cacheEvents;
