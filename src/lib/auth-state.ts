/**
 * Legacy Auth State Manager
 *
 * This file provides backward compatibility for components that still import
 * from the old auth-state.ts file. It delegates to the new unified auth system.
 *
 * @deprecated Use useUnifiedAuth from auth-state-unified.tsx instead
 */

import { authUtils, type AuthState, type User } from '@/lib/auth-state-unified';
import { logger } from '@/lib/utils';

// Legacy auth state manager for backward compatibility
export const authStateManager = {
  /**
   * Set auth state from middleware headers
   * @deprecated This functionality is now handled automatically by useUnifiedAuth
   */
  setFromHeaders: (headers: Headers): void => {
    try {
      const isAuth = headers.get('x-auth-isAuth') === '1';
      const hasToken = headers.get('x-auth-hasAccessToken') === '1';

      if (isAuth && hasToken) {
        // Set optimistic auth state
        authUtils.setAuthState({
          isAuthenticated: true,
          isLoading: false,
          isLoggingOut: false,
          lastActivity: Date.now(),
        });
      } else {
        // Clear auth state
        authUtils.clearAuthState();
      }
    } catch (error) {
      logger.warn('[AuthStateManager] Failed to set auth state from headers:', error);
    }
  },

  /**
   * Get current auth state
   * @deprecated Use useUnifiedAuth hook instead
   */
  getAuthState: (): AuthState => {
    // Return default state - actual state should come from useUnifiedAuth
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      isLoggingOut: false,
      lastActivity: Date.now(),
    };
  },

  /**
   * Clear auth state
   * @deprecated Use authUtils.clearAuthState() instead
   */
  clearAuthState: (): void => {
    authUtils.clearAuthState();
  },

  /**
   * Set auth state
   * @deprecated Use authUtils.setAuthState() instead
   */
  setAuthState: (state: Partial<AuthState>): void => {
    authUtils.setAuthState(state);
  },
};

// Export types for backward compatibility
export type { AuthState, User };

// Export utils for backward compatibility
export { authUtils };