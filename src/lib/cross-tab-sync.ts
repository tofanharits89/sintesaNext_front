/**
 * Cross-Tab Session Synchronization
 * Syncs auth state changes across browser tabs using localStorage events
 * Maintains consistency without affecting main authentication flow
 */

import { logger } from '@/lib/utils';

// Detect runtime environment
const isBrowser = typeof window !== 'undefined';

// Event types for cross-tab communication
type CrossTabEvent = {
  type: 'auth_login' | 'auth_logout' | 'auth_token_refreshed';
  timestamp: number;
  payload?: any;
};

const STORAGE_KEY = 'sintesa_auth_events';

/**
 * Send auth event to other tabs
 */
export const sendCrossTabEvent = (type: CrossTabEvent['type'], payload?: any): void => {
  if (!isBrowser) return; // No-op on server
  const event: CrossTabEvent = {
    type,
    timestamp: Date.now(),
    payload,
  };

  try {
    // Guard localStorage access during SSR
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    
    // Remove after a short delay to prevent stale events
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

/**
 * Listen for cross-tab auth events
 */
export const listenForCrossTabEvents = (onEvent: (event: CrossTabEvent) => void): (() => void) => {
  if (!isBrowser) {
    // Return a no-op cleanup function on server
    return () => {};
  }
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const event: CrossTabEvent = JSON.parse(e.newValue);
        
        // Only process events from other tabs (ignore if too recent - same tab)
        const now = Date.now();
        if (now - event.timestamp > 100) { // 100ms buffer to avoid self-triggering
          onEvent(event);
        }
      } catch (error) {
        logger.warn('Failed to parse cross-tab event:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    if (!isBrowser) return;
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Cross-tab sync manager
 */
export class CrossTabSyncManager {
  private unsubscribers: Array<() => void> = [];
  
  constructor() {
    if (isBrowser) {
      this.setupListeners();
    }
  }

  private setupListeners() {
    // Listen for logout events from other tabs
    const unsubscribeLogout = listenForCrossTabEvents((event) => {
      if (event.type === 'auth_logout') {
        logger.info('Received logout event from another tab');
        
        // Trigger page reload to clear local state
        // This is the safest approach to ensure all state is cleared
        if (isBrowser) {
          window.location.reload();
        }
      }
    });

    // Listen for token refresh events from other tabs
    const unsubscribeRefresh = listenForCrossTabEvents((event) => {
      if (event.type === 'auth_token_refreshed') {
        logger.info('Received token refresh event from another tab');
        
        // Trigger a soft refetch of user data
        if (isBrowser) {
          window.dispatchEvent(new CustomEvent('auth-state-sync', {
            detail: { action: 'refresh' }
          }));
        }
      }
    });

    this.unsubscribers = [unsubscribeLogout, unsubscribeRefresh];
  }

  /**
   * Notify other tabs about login
   */
  notifyLogin() {
    sendCrossTabEvent('auth_login');
  }

  /**
   * Notify other tabs about logout
   */
  notifyLogout() {
    sendCrossTabEvent('auth_logout');
  }

  /**
   * Notify other tabs about token refresh
   */
  notifyTokenRefresh() {
    sendCrossTabEvent('auth_token_refreshed');
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }
}

// Singleton instance (client-only). Provide a safe stub on server.
type CrossTabSyncPublic = Pick<CrossTabSyncManager, 'notifyLogin' | 'notifyLogout' | 'notifyTokenRefresh' | 'destroy'>;
export const crossTabSync: CrossTabSyncPublic = isBrowser
  ? new CrossTabSyncManager()
  : {
      notifyLogin: () => {},
      notifyLogout: () => {},
      notifyTokenRefresh: () => {},
      destroy: () => {},
    };
