import { useUnifiedAuth } from '@/lib/auth-state-unified';

/**
 * Simplified authentication hook for dashboard components
 * Uses the unified authentication system for reliable data
 */
export function useDashboardAuth() {
  const unifiedAuth = useUnifiedAuth();

  return {
    user: unifiedAuth.user,
    isAuthenticated: unifiedAuth.isAuthenticated,
    isLoading: unifiedAuth.isLoading,
    isLoggingOut: unifiedAuth.isLoggingOut,
    error: unifiedAuth.error,
    refetch: unifiedAuth.refetch,
    logout: unifiedAuth.logout,
    logoutAsync: unifiedAuth.logoutAsync,
  };
}