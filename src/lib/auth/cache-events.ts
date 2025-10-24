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

    

    // Clear React Query cache
    if (clearReactQuery && this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      this.queryClient.invalidateQueries({ queryKey: ['user'] });
      this.queryClient.removeQueries({ queryKey: ['auth', 'user'] });
      
    }

    // Clear Zustand store
    if (clearZustand) {
      const authStore = useAuthSessionStore.getState();
      authStore.reset();
      
    }

    // Clear localStorage (preserve theme and language if requested)
    if (clearLocalStorage && typeof window !== 'undefined') {
      const preservedValues = new Map<string, string>();
      const shouldPreserveKey = (key: string): boolean => {
        const lowerKey = key.toLowerCase();
        if (preserveTheme && lowerKey.includes('theme')) {
          return true;
        }
        if (
          preserveLanguage &&
          (key === 'language' || key === 'i18nextLng')
        ) {
          return true;
        }
        return false;
      };

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (shouldPreserveKey(key)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            preservedValues.set(key, value);
          }
          continue;
        }

        keysToRemove.push(key);
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      preservedValues.forEach((value, key) => {
        localStorage.setItem(key, value);
      });
    }

    // Clear sessionStorage
    if (clearSessionStorage && typeof window !== 'undefined') {
      sessionStorage.clear();
      
    }

    this.recordEvent('auth_logout');
  }

  /**
   * Invalidate user-specific data caches
   */
  invalidateUser(userId?: string): void {
    

    if (this.queryClient) {
      if (userId) {
        this.queryClient.invalidateQueries({ queryKey: ['user', userId] });
      } else {
        this.queryClient.invalidateQueries({ queryKey: ['user'] });
      }
      
    }

    this.recordEvent('user_updated');
  }

  /**
   * Invalidate all data-related queries (dashboard, reports, etc.)
   */
  invalidateDataQueries(): void {
    

    if (!this.queryClient) {
      
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

    
  }

  /**
   * Clear all caches (nuclear option)
   */
  invalidateAll(options: CacheInvalidationOptions = {}): void {
    const {
      preserveTheme = true,
      preserveLanguage = true,
    } = options;

    

    // Clear React Query completely
    if (this.queryClient) {
      this.queryClient.clear();
      
    }

    // Reset Zustand
    const authStore = useAuthSessionStore.getState();
    authStore.reset();
    

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const preservedValues = new Map<string, string>();
      const shouldPreserveKey = (key: string): boolean => {
        const lowerKey = key.toLowerCase();
        if (preserveTheme && lowerKey.includes('theme')) {
          return true;
        }
        if (
          preserveLanguage &&
          (key === 'language' || key === 'i18nextLng')
        ) {
          return true;
        }
        return false;
      };

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (shouldPreserveKey(key)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            preservedValues.set(key, value);
          }
          continue;
        }

        keysToRemove.push(key);
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      preservedValues.forEach((value, key) => {
        localStorage.setItem(key, value);
      });
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      
    }

    this.recordEvent('clear_all');
  }

  /**
   * Handle token refresh event
   */
  onTokenRefresh(): void {
    
    this.recordEvent('token_refreshed');
  }

  /**
   * Handle login event
   */
  onLogin(): void {
    
    
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
    
    

    // Log React Query cache details
    if (this.queryClient) {
      const queries = this.queryClient.getQueryCache().getAll();
      const queryDetails = queries.map(q => ({
        key: q.queryKey,
        state: q.state.status,
        dataUpdatedAt: new Date(q.state.dataUpdatedAt).toISOString(),
      }));
      
      
    }

    // Log localStorage contents
    if (typeof window !== 'undefined') {
      const localStorageContents = Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key)?.substring(0, 50) + '...';
        return acc;
      }, {} as Record<string, string>);
      
      
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
