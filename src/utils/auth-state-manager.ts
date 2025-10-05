/**
 * Legacy Auth State Manager - Simple Validator
 *
 * This file provides backward compatibility for components that still import
 * from the old auth-state-manager.ts file. It provides a simple validator
 * interface that delegates to the new unified auth system.
 *
 * @deprecated Use useUnifiedAuth from auth-state-unified.tsx instead
 */

import { apiClient } from '@/lib/httpClient';
import { logger } from '@/lib/utils';

// Simple auth validator for backward compatibility
export const simpleAuthValidator = {
  /**
   * Validate authentication state
   * Makes a request to the server to verify current session
   */
  validateAuth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data?.success === true && response.data?.data != null;
    } catch (error: any) {
      // Try token refresh on 401
      if (error.response?.status === 401) {
        try {
          await apiClient.post('/auth/refresh');
          // Retry after refresh
          const retryResponse = await apiClient.get('/auth/me');
          return retryResponse.data?.success === true && retryResponse.data?.data != null;
        } catch (refreshError) {
          logger.warn('[AuthValidator] Token refresh failed:', refreshError);
          return false;
        }
      }

      logger.warn('[AuthValidator] Auth validation failed:', error);
      return false;
    }
  },

  /**
   * Clear validation cache
   * This is a no-op in the new system but kept for compatibility
   */
  clearCache: (): void => {
    // Cache clearing is now handled by the unified auth system
    logger.debug('[AuthValidator] Cache clear requested (no-op in new system)');
  },

  /**
   * Check if user has specific role
   * @deprecated Use authUtils.hasRole() instead
   */
  hasRole: (user: any, role: string): boolean => {
    return user?.role === role;
  },

  /**
   * Check if user can access resource based on role hierarchy
   * @deprecated Use authUtils.canAccess() instead
   */
  canAccess: (user: any, requiredRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy = {
      'super_admin': 5,
      'co_admin': 4,
      'kantor_pusat': 3,
      'kanwil_djpb': 2,
      'kppn': 1,
      'lainnya': 0,
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  },
};

// Export for backward compatibility
export { simpleAuthValidator as default };