/**
 * TRUE Single Source of Truth (SSOT) Auth Hook
 * 
 * This replaces all fragmented auth approaches with one unified system.
 * Based on Zustand + React Query for optimal performance and consistency.
 * 
 * Design Principles:
 * - Single Zustand store for auth state (SSOT)
 * - React Query for server data synchronization
 * - Immediate UI updates with optimistic cache updates
 * - Type-safe and predictable state management
 */

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useAuthSessionStore, 
  type User as AuthUser,
  type AuthSessionState 
} from '@/stores/session-store';
import { authClient } from '@/lib/auth-client';
import { queryKeyFactories } from '@/lib/query-configs';
import { toast } from 'sonner';

// Enhanced hook return type for better TypeScript support
export interface UseUnifiedAuthReturn extends Omit<AuthSessionState, 'setAuthenticated' | 'updateUser' | 'logout'> {
  // Primary data
  user: AuthUser | null;
  
  // Enhanced actions with better naming
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: (reason?: string) => Promise<void>;
  refetch: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  validateSession: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  
  // Computed states for convenience
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  
  // Helper methods
  canManageUsers: boolean;
  canAccessSettings: boolean;
  getRoleDisplayName: string;
  
  // Cache control
  clearCache: () => void;
  updateUserProfile: (userData: Partial<AuthUser>) => void;
}

// RBAC helper functions (extracted for reusability)
const canManageUsers = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'co_admin';
};

const canAccessSettings = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'co_admin' || user.role === 'kantor_pusat';
};

const getRoleDisplayName = (user: AuthUser | null): string => {
  if (!user) return '';
  
  const roleNames = {
    super_admin: 'Super Admin',
    co_admin: 'Admin',
    kantor_pusat: 'Kantor Pusat',
    kanwil_djpb: 'Kanwil DJPB',
    kppn: 'KPPN',
    lainnya: 'Lainnya',
  };
  
  return roleNames[user.role as keyof typeof roleNames] || 'Lainnya';
};

/**
 * TRUE SSOT Auth Hook
 * This should be the ONLY auth hook used in the entire application
 */
export function useUnifiedAuth(): UseUnifiedAuthReturn {
  const queryClient = useQueryClient();
  const authState = useAuthSessionStore();

  // Enhanced login with optimistic updates and cache management
  const login = useCallback(async (
    username: string, 
    password: string, 
    rememberMe = false
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      // Set loading state
      authState.setLoading(true);
      
      // Clear any existing cache first
      clearCache();
      
      const result = await authClient.login(username, password, rememberMe);
      
      if (result.success && result.user) {
        // Optimistic update: immediately update Zustand store
        authState.setAuthenticated(true, result.user);
        authState.updateUser(result.user);
        authState.updateLastActivity();
        
        // Update React Query cache for consistency
        queryClient.setQueryData(['auth', 'user'], result.user);
        queryClient.setQueryData(queryKeyFactories.user.profile(), result.user);
        
        toast.success(`Selamat datang, ${result.user.name}!`);
        
        return { success: true, user: result.user };
      } else {
        const errorMsg = result.error || 'Login gagal';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan koneksi';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      authState.setLoading(false);
    }
  }, [authState, queryClient]);

  // Enhanced logout with comprehensive cleanup
  const logout = useCallback(async (reason = 'manual_logout'): Promise<void> => {
    try {
      authState.setLoggingOut(true);
      
      // Optimistic update: clear auth state immediately
      authState.logout();
      
      // Clear all auth-related caches
      clearCache();
      
      // Attempt server logout (don't await, fire and forget)
      authClient.logout().catch(error => {
        console.warn('Server logout failed:', error);
      });
      
      if (reason === 'manual_logout') {
        toast.success('Anda telah keluar dari sistem');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authState.setLoggingOut(false);
    }
  }, [authState]);

  // Enhanced session validation
  const validateSession = useCallback(async (): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const result = await authClient.validateSession();
      
      if (result.success && result.valid && result.user) {
        // Update Zustand with fresh user data
        authState.setAuthenticated(true, result.user);
        authState.updateUser(result.user);
        authState.updateLastActivity();
        
        // Update React Query cache
        queryClient.setQueryData(['auth', 'user'], result.user);
        queryClient.setQueryData(queryKeyFactories.user.profile(), result.user);
        
        return { success: true, user: result.user };
      } else {
        // Session is invalid, perform logout
        await logout('session_expired');
        return { success: false, error: result.error || 'Sesi anda telah berakhir' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Gagal memvalidasi sesi';
      // Don't automatically logout on network errors, just log the error
      console.warn('Session validation error:', error);
      return { success: false, error: errorMsg };
    }
  }, [authState, queryClient, logout]);

  // Refetch user data from server
  const refetch = useCallback(async (): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    return validateSession();
  }, [validateSession]);

  // Cache management utilities
  const clearCache = useCallback(() => {
    // Invalidate and clear all auth-related React Query caches
    queryClient.invalidateQueries({ queryKey: queryKeyFactories.user.all() });
    queryClient.removeQueries({ queryKey: ['auth', 'user'] });
    queryClient.removeQueries({ queryKey: queryKeyFactories.user.profile() });
  }, [queryClient]);

  const updateUserProfile = useCallback((userData: Partial<AuthUser>) => {
    if (!authState.user) return;
    
    const updatedUser = { ...authState.user, ...userData };
    
    // Update Zustand store
    authState.updateUser(updatedUser);
    
    // Update React Query cache
    queryClient.setQueryData(['auth', 'user'], updatedUser);
    queryClient.setQueryData(queryKeyFactories.user.profile(), updatedUser);
  }, [authState, queryClient]);

  // Ensure consistent state on mount and when cache changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Sync React Query changes to Zustand
      const queryKey = event.query.queryKey;
      if (queryKey && (queryKey.includes('user') || queryKey.includes('auth'))) {
        const cachedUser = queryClient.getQueryData(['auth', 'user']) as AuthUser || 
                           queryClient.getQueryData(queryKeyFactories.user.profile()) as AuthUser;
        
        // CRITICAL: Validate that cachedUser is actual user data, not an error object
        const isValidUser = cachedUser && 
                           typeof cachedUser === 'object' && 
                           'id' in cachedUser && 
                           'username' in cachedUser &&
                           !('success' in cachedUser && cachedUser.success === false);
        
        if (isValidUser && cachedUser !== authState.user) {
          console.log('[useUnifiedAuth] Syncing cached user data to Zustand');
          authState.setAuthenticated(true, cachedUser);
          authState.updateUser(cachedUser);
        } else if (cachedUser && !isValidUser) {
          console.warn('[useUnifiedAuth] Ignoring invalid cached user data:', cachedUser);
        }
      }
    });

    return unsubscribe;
  }, [queryClient, authState]);

  // Return the enhanced SSOT auth interface
  return {
    // Core auth state from Zustand (SSOT)
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isLoggingOut: authState.isLoggingOut,
    socketConnected: authState.socketConnected,
    sessionExpiry: authState.sessionExpiry,
    lastActivity: authState.lastActivity,
    
    // State management methods (from AuthSessionState)
    setLoggingOut: authState.setLoggingOut,
    setLoading: authState.setLoading,
    setSessionExpiry: authState.setSessionExpiry,
    setSocketConnected: authState.setSocketConnected,
    updateLastActivity: authState.updateLastActivity,
    reset: authState.reset,

    // Enhanced actions
    login,
    logout,
    refetch,
    validateSession,

    // Computed helpers
    canManageUsers: canManageUsers(authState.user),
    canAccessSettings: canAccessSettings(authState.user),
    getRoleDisplayName: getRoleDisplayName(authState.user),

    // Cache control
    clearCache,
    updateUserProfile,
  };
}

// Export individual helper functions for direct usage
export { canManageUsers, canAccessSettings, getRoleDisplayName };

// Re-export types for backward compatibility
export type { AuthUser as User };

// Export auth utilities for legacy compatibility
export const authUtils = {
  // Check if user has specific role
  hasRole: (user: AuthUser | null, role: string): boolean => {
    return user?.role === role;
  },

  // Check if user can access resource
  canAccess: (user: AuthUser | null, requiredRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy = {
      super_admin: 5,
      co_admin: 4,
      kantor_pusat: 3,
      kanwil_djpb: 2,
      kppn: 1,
      lainnya: 0,
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  },
};

// Default export for convenience
export default useUnifiedAuth;
