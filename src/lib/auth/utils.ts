/**
 * Consolidated Auth Utilities
 * Combines cache management, event coordination, and cross-tab sync
 */

import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/utils";

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

let globalQueryClient: QueryClient | null = null;

export function setGlobalQueryClient(qc: QueryClient) {
  globalQueryClient = qc;
}

/**
 * Clear all React Query cache when authentication fails
 */
export function clearAuthCacheOnFail() {
  if (!globalQueryClient) {
    console.warn("[AuthCache] No queryClient available for cache clearing");
    return;
  }

  try {
    globalQueryClient.clear();
    console.log("[AuthCache] ✅ All React Query cache cleared due to auth failure");
  } catch (error) {
    console.error("[AuthCache] Failed to clear cache:", error);
  }
}

/**
 * Clear specific data-related queries
 */
export function clearDataQueries() {
  if (!globalQueryClient) return;

  try {
    const authDependentKeys = [
      "realisasi-per-jenis-belanja",
      "realisasi-kl-per-fungsi",
      "quick-stats",
      "realisasi-kl-pagu-terbesar",
      "realisasi-kl-pagu-program-terbesar",
      "tren-realisasi-bulanan",
      "persentase-realisasi-kl",
    ];

    for (const key of authDependentKeys) {
      globalQueryClient.removeQueries({
        queryKey: [key],
      });
    }

    console.log("[AuthCache] ✅ Auth-dependent queries cleared");
  } catch (error) {
    console.error("[AuthCache] Failed to clear specific queries:", error);
  }
}

export function isQueryClientAvailable(): boolean {
  return globalQueryClient !== null;
}

// ============================================================================
// MIDDLEWARE CACHE (Edge/Runtime)
// ============================================================================

export type AuthCacheEntry = { valid: boolean; user?: any; expiresAt: number };

const DEFAULT_TTL_MS = process.env.NODE_ENV === 'production' ? 10_000 : 3_000;

export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const cache = new Map<string, AuthCacheEntry>();

export function getAuthCache(key: string): AuthCacheEntry | undefined {
  const e = cache.get(key);
  if (!e) return;
  if (Date.now() > e.expiresAt) { cache.delete(key); return; }
  return e;
}

export function setAuthCache(key: string, data: Omit<AuthCacheEntry, 'expiresAt'>, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { ...data, expiresAt: Date.now() + Math.max(500, ttlMs) });
}

export function invalidateAuthCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

// ============================================================================
// AUTH REDIRECT UTILITIES
// ============================================================================

/**
 * Simple auth redirect utility
 */
export function redirectToLoginIfNotAuth() {
  if (typeof window === 'undefined') return;
  
  const hasToken = document.cookie.includes('accessToken=');
  
  if (!hasToken) {
    window.location.href = '/login';
    return;
  }
  
  import("../backend").then(({ backendPath }) => {
    return fetch(backendPath("/auth/me"), {
      method: 'GET',
      credentials: 'include',
    });
  }).then(response => {
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
    }
  }).catch(() => {
    // Network error: do not force logout
  });
}

// ============================================================================
// EVENT COORDINATION
// ============================================================================

interface AuthEvent {
  type: 'token_refresh_start' | 'token_refresh_success' | 'token_refresh_error' | 'auth_expired' | 'login_start' | 'login_success';
  timestamp: number;
  data?: any;
}

class AuthEventCoordinator {
  private eventQueue: AuthEvent[] = [];
  private isProcessing = false;
  private eventListeners: Map<string, Function[]> = new Map();

  addEventListener(eventType: string, callback: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);

    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  async emitEvent(event: AuthEvent): Promise<void> {
    this.eventQueue.push(event);

    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: AuthEvent): Promise<void> {
    logger.debug(`[AuthEventCoordinator] Processing auth event: ${event.type}`, {
      timestamp: event.timestamp,
      data: event.data
    });

    const listeners = this.eventListeners.get(event.type) || [];

    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error: any) {
        logger.error(`[AuthEventCoordinator] Error in auth event listener for ${event.type}:`, error);
      }
    }
  }

  isAuthOperationInProgress(): boolean {
    return this.isProcessing || this.eventQueue.length > 0;
  }

  getAuthState(): {
    isProcessing: boolean;
    queueLength: number;
    recentEvents: AuthEvent[];
  } {
    const recentEvents = this.eventQueue.slice(-5);

    return {
      isProcessing: this.isProcessing,
      queueLength: this.eventQueue.length,
      recentEvents
    };
  }

  clearQueue(): void {
    this.eventQueue.length = 0;
    logger.info("[AuthEventCoordinator] Auth event queue cleared");
  }
}

export const authEventCoordinator = new AuthEventCoordinator();

// Convenience functions for common events
export const emitTokenRefreshStart = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_start',
    timestamp: Date.now(),
    data
  });

export const emitTokenRefreshSuccess = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_success',
    timestamp: Date.now(),
    data
  });

export const emitTokenRefreshError = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_error',
    timestamp: Date.now(),
    data
  });

export const emitAuthExpired = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'auth_expired',
    timestamp: Date.now(),
    data
  });

export const emitLoginStart = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'login_start',
    timestamp: Date.now(),
    data
  });

export const emitLoginSuccess = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'login_success',
    timestamp: Date.now(),
    data
  });

// ============================================================================
// CROSS-TAB SYNC
// ============================================================================

const isBrowser = typeof window !== 'undefined';

type CrossTabEvent = {
  type: 'auth_login' | 'auth_logout' | 'auth_token_refreshed';
  timestamp: number;
  payload?: any;
};

const STORAGE_KEY = 'sintesa_auth_events';

export const sendCrossTabEvent = (type: CrossTabEvent['type'], payload?: any): void => {
  if (!isBrowser) return;
  const event: CrossTabEvent = {
    type,
    timestamp: Date.now(),
    payload,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    
    setTimeout(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        // Ignore cleanup errors
      }
    }, 1000);
  } catch (error) {
    logger.warn('Failed to send cross-tab event:', error);
  }
};

export const listenForCrossTabEvents = (onEvent: (event: CrossTabEvent) => void): (() => void) => {
  if (!isBrowser) {
    return () => {};
  }
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const event: CrossTabEvent = JSON.parse(e.newValue);
        
        const now = Date.now();
        if (now - event.timestamp > 100) {
          onEvent(event);
        }
      } catch (error) {
        logger.warn('Failed to parse cross-tab event:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (!isBrowser) return;
    window.removeEventListener('storage', handleStorageChange);
  };
};

export class CrossTabSyncManager {
  private unsubscribers: Array<() => void> = [];
  
  constructor() {
    if (isBrowser) {
      this.setupListeners();
    }
  }

  private setupListeners() {
    const unsubscribeLogout = listenForCrossTabEvents((event) => {
      if (event.type === 'auth_logout') {
        logger.info('Received logout event from another tab');
        
        if (isBrowser) {
          window.location.reload();
        }
      }
    });

    const unsubscribeRefresh = listenForCrossTabEvents((event) => {
      if (event.type === 'auth_token_refreshed') {
        logger.info('Received token refresh event from another tab');
        
        if (isBrowser) {
          window.dispatchEvent(new CustomEvent('auth-state-sync', {
            detail: { action: 'refresh' }
          }));
        }
      }
    });

    this.unsubscribers = [unsubscribeLogout, unsubscribeRefresh];
  }

  notifyLogin() {
    sendCrossTabEvent('auth_login');
  }

  notifyLogout() {
    sendCrossTabEvent('auth_logout');
  }

  notifyTokenRefresh() {
    sendCrossTabEvent('auth_token_refreshed');
  }

  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

type CrossTabSyncPublic = Pick<CrossTabSyncManager, 'notifyLogin' | 'notifyLogout' | 'notifyTokenRefresh' | 'destroy'>;

export const crossTabSync: CrossTabSyncPublic = isBrowser
  ? new CrossTabSyncManager()
  : {
      notifyLogin: () => {},
      notifyLogout: () => {},
      notifyTokenRefresh: () => {},
      destroy: () => {},
    };
