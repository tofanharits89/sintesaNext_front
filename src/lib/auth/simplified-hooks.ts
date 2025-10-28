"use client";

/**
 * Simplified Auth Hooks
 * Clean, focused authentication state management
 * Removed: complex cache events, cross-tab sync, redundant timers
 */

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAuthSessionStore,
  type User as AuthUser,
} from "@/stores/session-store";
import { authClient } from "./client";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

// ============================================================================
// RBAC Helper Functions
// ============================================================================

const canManageUsers = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "co_admin";
};

const canAccessSettings = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return (
    user.role === "super_admin" ||
    user.role === "co_admin" ||
    user.role === "kantor_pusat"
  );
};

const getRoleDisplayName = (user: AuthUser | null): string => {
  if (!user) return "";

  const roleNames = {
    super_admin: "Super Admin",
    co_admin: "Admin",
    kantor_pusat: "Kantor Pusat",
    kanwil_djpb: "Kanwil DJPB",
    kppn: "KPPN",
    lainnya: "Lainnya",
  };

  return roleNames[user.role as keyof typeof roleNames] || "Lainnya";
};

// ============================================================================
// Simplified Auth Hook
// ============================================================================

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  validateSession: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  getRoleDisplayName: string;
  clearCache: () => void;
  updateUserProfile: (userData: Partial<AuthUser>) => void;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const authState = useAuthSessionStore();

  // Simple token refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCache = useCallback(() => {
    // Enhanced cache clearing - specifically target auth-related queries
    queryClient.clear();

    // Specifically target auth-related queries
    queryClient.removeQueries({ queryKey: ['auth'] });
    queryClient.removeQueries({ queryKey: ['user'] });

    if (typeof window !== 'undefined') {
      // Clear localStorage but preserve essential items
      const keysToKeep = ["theme", "language"];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
    }
  }, [queryClient]);

  const login = useCallback(
    async (username: string, password: string, rememberMe = false): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
      try {
        authState.setLoading(true);
        clearCache();

        const result = await authClient.login(username, password, rememberMe);

        if (result.success && result.user) {
          authState.setAuthenticated(true, result.user);
          authState.updateUser(result.user);

          // Set user data in React Query
          queryClient.setQueryData(["auth", "user"], result.user);

          // SECURITY FIX: Store CSRF token in sessionStorage (not accessible to JavaScript from cookies)
          // This is more secure than storing it in cookies
          if (result.csrfToken && typeof window !== 'undefined') {
            sessionStorage.setItem('csrf_token', result.csrfToken);
            logger.debug("[Auth Hook] CSRF token stored in sessionStorage");
          }

          toast.success(`Selamat datang, ${result.user.name}!`);
          return { success: true, user: result.user };
        } else {
          const errorMsg = result.error || "Login gagal";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan koneksi";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        authState.setLoading(false);
      }
    },
    [authState, queryClient, clearCache],
  );

  const logout = useCallback(
    async (reason = "manual_logout"): Promise<{ success: boolean; error?: string }> => {
      try {
        // Set logout in progress first (before clearing state)
        authState.setLogoutInProgress(true);
        authState.setLoggingOut(true);

        // Clear all caches
        clearCache();

        // Call server logout and wait for completion
        const result = await authClient.logout();

        // Check if server logout was successful
        if (!result.success) {
          // Logout failed - reset state and return error
          authState.setLogoutInProgress(false);
          authState.setLoggingOut(false);
          return { success: false, error: result.error || "Logout gagal" };
        }

        // Server logout succeeded - reset auth state
        authState.setAuthenticated(false, null);
        authState.updateUser(null);

        if (reason === "manual_logout") {
          toast.success("Anda telah keluar dari sistem");
        }

        // Small delay to ensure all state changes propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        return { success: true };

      } catch (error) {
        console.error("Logout error:", error);
        // On error, complete the logout flow anyway for security
        authState.setAuthenticated(false, null);
        authState.updateUser(null);
        authState.setLogoutInProgress(true);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Terjadi kesalahan saat logout" 
        };
      } finally {
        authState.setLoggingOut(false);
        // Keep logout in progress until after redirect to prevent dashboard flash
      }
    },
    [authState, clearCache],
  );

  const validateSession = useCallback(async (): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const result = await authClient.validateSession();

      if (result.success && result.valid && result.user) {
        authState.setAuthenticated(true, result.user);
        authState.updateUser(result.user);
        
        queryClient.setQueryData(["auth", "user"], result.user);
        return { success: true, user: result.user };
      } else {
        // Session expired - logout user
        await logout("session_expired");
        return {
          success: false,
          error: result.error || "Sesi anda telah berakhir",
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Gagal memvalidasi sesi";
      console.warn("Session validation error:", error);
      await logout("session_expired");
      return { success: false, error: errorMsg };
    }
  }, [authState, queryClient, logout]);

  const refetch = useCallback(async (): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    return validateSession();
  }, [validateSession]);

  const updateUserProfile = useCallback(
    (userData: Partial<AuthUser>) => {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };
      authState.updateUser(updatedUser);
      queryClient.setQueryData(["auth", "user"], updatedUser);
    },
    [authState.user, authState.updateUser, queryClient],
  );

  // Simple token refresh - refresh every 20 minutes
  const startTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(async () => {
      if (authState.isAuthenticated && authState.user) {
        try {
          const result = await authClient.refreshToken();
          if (result.success) {
            // Reschedule next refresh
            startTokenRefresh();
          } else {
            // Refresh failed - validate session
            await validateSession();
          }
        } catch (error) {
          console.error("Token refresh error:", error);
          await validateSession();
        }
      }
    }, 20 * 60 * 1000); // 20 minutes
  }, [authState.isAuthenticated, authState.user, validateSession]);

  // Start/stop refresh timer based on auth state
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      startTokenRefresh();
    } else {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [authState.isAuthenticated, authState.user, startTokenRefresh]);

  // Sync Zustand state with React Query cache
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event.query.queryKey;
      if (queryKey && (queryKey.includes("user") || queryKey.includes("auth"))) {
        const cachedUser = queryClient.getQueryData(["auth", "user"]) as AuthUser;
        
        if (cachedUser && cachedUser.id !== authState.user?.id) {
          authState.setAuthenticated(true, cachedUser);
          authState.updateUser(cachedUser);
        }
      }
    });

    return unsubscribe;
  }, [queryClient, authState]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isLoggingOut: authState.isLoggingOut,
    
    login,
    logout,
    refetch,
    validateSession,
    
    canManageUsers: canManageUsers(authState.user),
    canAccessSettings: canAccessSettings(authState.user),
    getRoleDisplayName: getRoleDisplayName(authState.user),
    
    clearCache,
    updateUserProfile,
  };
}

// ============================================================================
// Simplified Auth Redirect Hook
// ============================================================================

interface UseAuthRedirectOptions {
  enabled?: boolean;
  redirectTo?: string;
  checkInterval?: number;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    enabled = true,
    redirectTo = "/login",
    checkInterval = 30000, // Increased to 30 seconds
  } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || isLoading) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    intervalRef.current = setInterval(() => {
      // Simple periodic check
      if (!isAuthenticated) {
        router.push(redirectTo);
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, isLoading, redirectTo, checkInterval, router]);

  return {
    isRedirecting: !isAuthenticated && !isLoading,
  };
}

// ============================================================================
// Export Types and Legacy Compatibility
// ============================================================================

export type { AuthUser as User };
export { useAuth as useUnifiedAuth };
export { canManageUsers, canAccessSettings, getRoleDisplayName }; // Export helper functions
export default useAuth;