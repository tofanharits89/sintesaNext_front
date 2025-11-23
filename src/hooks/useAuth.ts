/**
 * Unified Authentication Hook
 * Single source of truth for authentication state using React Query
 * Replaces: useUnifiedAuth, useUserProfile, session-store Zustand
 *
 * This hook provides:
 * - Session validation and user data in one call (uses /auth/session endpoint)
 * - Login/logout methods
 * - RBAC utilities
 * - Loading and error states
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import type { User } from '@/lib/auth/client';
import {
  hasPermissionFrontend as rbacHasPermission,
  canAccessUserManagement as rbacCanAccessUserManagement,
  canEditRoleAndLocation as rbacCanEditRoleAndLocation,
  canManageUsers as rbacCanManageUsers,
  canAccessSettings as rbacCanAccessSettings,
  filterDataByRole as rbacFilterDataByRole,
  getRoleDisplayName as rbacGetRoleDisplayName,
  type MinimalUser,
} from '@/lib/security/rbac';
import { clearCSRFCache, primeCSRFToken } from '@/lib/security/csrfManager';

// Re-export User type for convenience (already defined in auth/client)
export type { User } from '@/lib/auth/client';

// Session data from /auth/session endpoint
interface SessionData {
  valid: boolean;
  authenticated: boolean;
  user: User | null;
  expiresAt?: number;
  lastActivity?: number;
  sessionTimeout?: number;
  absoluteTimeout?: number;
  rememberMe?: boolean;
  reason?: string;
}

// Hook return type
export interface UseAuthReturn {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  error: Error | null;

  // Session info
  sessionExpiry: Date | null;
  lastActivity: Date | null;

  // Actions
  login: (username: string, password: string, rememberMe?: boolean, captcha?: string) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => Promise<void>;
  refetch: () => Promise<void>;
  clearCache: () => void;

  // RBAC utilities
  hasPermission: (module: "users" | "profile" | "dashboard" | "settings" | "messages" | "notifications", action: string) => boolean;
  canAccessUserManagement: () => boolean;
  canEditRoleAndLocation: () => boolean;
  canManageUsers: () => boolean;
  canAccessSettings: () => boolean;
  canEditProfile: () => boolean;
  filterDataByRole: <T extends { kdkanwil?: string; kdkppn?: string }>(data: T[]) => T[];
  getRoleDisplayName: () => string;
}

// React Query key for auth
const AUTH_QUERY_KEY = ['auth', 'session'];

/**
 * Main authentication hook
 * Uses /auth/session endpoint for unified session + user data retrieval
 */
export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();

  // Track logout state to show loading animation
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async (): Promise<SessionData> => {
      const response = await fetch('/api/v1/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Session fetch failed: ${response.status}`);
      }

      const result = await response.json();

      // Backend returns: { success: true, data: {...} }
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch session');
      }

      return result.data;
    },
    staleTime: 30 * 1000, // keep data hot for 30s to cut redundant calls
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true,
    refetchInterval: false, // avoid constant polling (session touch handled server-side)
    retry: false,
    enabled: true,
  });

  const user = data?.user || null;
  const isAuthenticated = Boolean(data?.authenticated && data?.valid && user);

  const sessionExpiry = data?.expiresAt ? new Date(data.expiresAt) : null;
  const lastActivity = data?.lastActivity ? new Date(data.lastActivity) : null;

  // Login method
  const login = useCallback(async (
    username: string,
    password: string,
    rememberMe = false,
    captcha?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authClient.login(username, password, rememberMe, captcha ? { captcha } : {});

      if (result.success && result.user) {
        // Prime CSRF cache immediately to prevent race conditions
        if (result.csrfToken) {
          primeCSRFToken(result.csrfToken);
        }
        
        // Clear cache first to ensure fresh fetch
        await queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
        
        // Wait for refetch to complete before returning
        // This ensures auth data is loaded before redirect
        const refetchResult = await queryRefetch();
        
        // Verify data was actually fetched
        if (refetchResult.data) {
          return { success: true };
        } else {
          // If refetch failed, still return success since login API succeeded
          // The page will refetch on mount
          return { success: true };
        }
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, [queryClient, queryRefetch]);

  // Logout method
  const logout = useCallback(async (reason = 'user_logout'): Promise<void> => {
    // Set loading state to show animation
    setIsLoggingOut(true);

    try {
      // Call logout endpoint
      await authClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Remove auth query from cache (forces refetch on next access)
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      clearCSRFCache();

      setIsLoggingOut(false);
    }
  }, [queryClient]);

  // Manual refetch
  const refetch = useCallback(async (): Promise<void> => {
    await queryRefetch();
  }, [queryRefetch]);

  // Clear cache (useful for forcing re-authentication)
  const clearCache = useCallback((): void => {
    queryClient.clear();
    clearCSRFCache();
  }, [queryClient]);

  // Normalize user object for RBAC compatibility (convert null to undefined)
  const normalizedUser = useMemo((): MinimalUser | null | undefined => {
    if (!user) return user;
    return {
      role: user.role,
      ...(user.kdkanwil && { kdkanwil: user.kdkanwil }),
      ...(user.kdkppn && { kdkppn: user.kdkppn }),
    };
  }, [user]);

  // RBAC utilities
  const hasPermission = useCallback((module: "users" | "profile" | "dashboard" | "settings" | "messages" | "notifications", action: string): boolean => {
    return rbacHasPermission(normalizedUser, module, action);
  }, [normalizedUser]);

  const canAccessUserManagement = useCallback((): boolean => {
    return rbacCanAccessUserManagement(normalizedUser);
  }, [normalizedUser]);

  const canEditRoleAndLocation = useCallback((): boolean => {
    if (!user) return false;
    // Use the permission matrix instead of hardcoded role checks
    return hasPermission("profile", "editRole") && hasPermission("profile", "editLocation");
  }, [user, hasPermission]);

  const canManageUsers = useCallback((): boolean => {
    return rbacCanManageUsers(normalizedUser);
  }, [normalizedUser]);

  const canAccessSettings = useCallback((): boolean => {
    return rbacCanAccessSettings(normalizedUser);
  }, [normalizedUser]);

  const canEditProfile = useCallback((): boolean => {
    if (!user) return false;
    // Check if user can edit their own profile using the permission matrix
    return hasPermission("profile", "editOwn");
  }, [user, hasPermission]);

  const filterDataByRole = useCallback(<T extends { kdkanwil?: string; kdkppn?: string }>(
    data: T[]
  ): T[] => {
    return rbacFilterDataByRole(normalizedUser, data);
  }, [normalizedUser]);

  const getRoleDisplayName = useCallback((): string => {
    return rbacGetRoleDisplayName(user?.role || 'lainnya');
  }, [user]);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    isLoggingOut,
    error: error as Error | null,

    // Session info
    sessionExpiry,
    lastActivity,

    // Actions
    login,
    logout,
    refetch,
    clearCache,

    // RBAC utilities
    hasPermission,
    canAccessUserManagement,
    canEditRoleAndLocation,
    canManageUsers,
    canAccessSettings,
    canEditProfile,
    filterDataByRole,
    getRoleDisplayName,
  };
}

// Export query key for external invalidation
export { AUTH_QUERY_KEY };
