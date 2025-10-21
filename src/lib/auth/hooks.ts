"use client";

/**
 * Consolidated Auth Hooks
 * Single source of truth for authentication state management
 * Combines useUnifiedAuth + useAuthRedirect + auth sync logic
 */

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAuthSessionStore,
  type User as AuthUser,
  type AuthSessionState,
} from "@/stores/session-store";
import { authClient } from "./client";
import { queryKeyFactories } from "@/lib/query-configs";
import { toast } from "sonner";
import { logger } from "@/lib/utils";
import { 
  crossTabSync, 
  setGlobalQueryClient, 
  clearAuthCacheOnFail 
} from "./utils";
import { cacheEvents } from "./cache-events";

// ============================================================================
// MAIN AUTH HOOK
// ============================================================================

export interface UseAuthReturn
  extends Omit<AuthSessionState, "setAuthenticated" | "updateUser" | "logout"> {
  user: AuthUser | null;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: (reason?: string) => Promise<void>;
  refetch: () => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  validateSession: () => Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  getRoleDisplayName: string;
  clearCache: () => void;
  updateUserProfile: (userData: Partial<AuthUser>) => void;
}

// RBAC helper functions
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

/**
 * Main authentication hook - Single Source of Truth
 */
export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const authState = useAuthSessionStore();

  useEffect(() => {
    setGlobalQueryClient(queryClient);
    // Phase 4: Initialize unified cache events system
    cacheEvents.setQueryClient(queryClient);
  }, [queryClient]);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const clearCache = useCallback(() => {
    // Phase 4: Use unified cache invalidation
    cacheEvents.invalidateAuth({
      preserveTheme: true,
      preserveLanguage: true,
      clearReactQuery: true,
      clearZustand: false, // Don't reset Zustand here, handled separately
      clearLocalStorage: false, // Don't clear localStorage on simple cache clear
      clearSessionStorage: false,
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string, rememberMe = false): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
      try {
        authState.setLoading(true);

        clearAuthCacheOnFail();
        clearCache();

        const result = await authClient.login(username, password, rememberMe);

        if (result.success && result.user) {
          authState.setAuthenticated(true, result.user);
          authState.updateUser(result.user);
          authState.updateLastActivity();

          queryClient.setQueryData(["auth", "user"], result.user);
          queryClient.setQueryData(
            queryKeyFactories.user.profile(),
            result.user,
          );

          // Phase 4: Notify cache events system of login
          cacheEvents.onLogin();
          
          crossTabSync.notifyLogin();

          // Dispatch auth:login event for socket connection
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:login', {
              detail: { user: result.user }
            }));
          }

          toast.success(`Selamat datang, ${result.user.name}!`);

          return { success: true, user: result.user };
        } else {
          const errorMsg = result.error || "Login gagal";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Terjadi kesalahan koneksi";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        authState.setLoading(false);
      }
    },
    [authState, queryClient, clearCache],
  );

  const logout = useCallback(
    async (reason = "manual_logout"): Promise<void> => {
      try {
        authState.setLoggingOut(true);

        crossTabSync.notifyLogout();

        // Dispatch auth:logout event for socket disconnection
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: { reason }
          }));
        }

        // Phase 4: Use unified cache invalidation on logout
        cacheEvents.invalidateAuth({
          preserveTheme: true,
          preserveLanguage: true,
          clearReactQuery: true,
          clearZustand: true,
          clearLocalStorage: true,
          clearSessionStorage: true,
        });

        authClient.logout().catch((error) => {
          console.warn("Server logout failed:", error);
        });

        if (reason === "manual_logout") {
          toast.success("Anda telah keluar dari sistem");
        }
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        authState.setLoggingOut(false);
      }
    },
    [authState],
  );

  const validateSession = useCallback(async (): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> => {
    try {
      const result = await authClient.validateSession();

      if (result.success && result.valid && result.user) {
        authState.setAuthenticated(true, result.user);
        authState.updateUser(result.user);
        authState.updateLastActivity();

        queryClient.setQueryData(["auth", "user"], result.user);
        queryClient.setQueryData(queryKeyFactories.user.profile(), result.user);

        return { success: true, user: result.user };
      } else {
        // Phase 4: Use unified cache invalidation on session expiry
        cacheEvents.onSessionExpired();
        await logout("session_expired");
        return {
          success: false,
          error: result.error || "Sesi anda telah berakhir",
        };
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Gagal memvalidasi sesi";
      if (errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
        // Phase 4: Use unified cache invalidation on auth failure
        cacheEvents.onSessionExpired();
      }
      console.warn("Session validation error:", error);
      return { success: false, error: errorMsg };
    }
  }, [authState, queryClient, logout]);

  const refetch = useCallback(async (): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> => {
    return validateSession();
  }, [validateSession]);

  const updateUserProfile = useCallback(
    (userData: Partial<AuthUser>) => {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };

      authState.updateUser(updatedUser);

      queryClient.setQueryData(["auth", "user"], updatedUser);
      queryClient.setQueryData(queryKeyFactories.user.profile(), updatedUser);
    },
    [authState, queryClient],
  );

  const startProactiveRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // CRITICAL FIX: Dynamic refresh interval based on actual token expiry
    const getRefreshInterval = (): number => {
      try {
        // Extract access token from cookie
        const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
        if (!tokenMatch || !tokenMatch[1]) {
          logger.debug("HttpOnly access token not readable from document.cookie; using default refresh interval");
          return 25 * 60 * 1000; // Default 25 min
        }
        
        const token = tokenMatch[1];
        
        // Decode JWT payload (without verification - just read expiry)
        const parts = token.split('.');
        if (parts.length !== 3 || !parts[1]) {
          logger.debug("Invalid token format, using default refresh interval");
          return 25 * 60 * 1000;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        
        if (payload.exp) {
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          
          // Refresh at 50% of token lifetime, minimum 5 minutes
          const refreshAt = Math.max(timeUntilExpiry * 0.5, 5 * 60 * 1000);
          
          logger.debug(
            `[Auth Refresh] Token expires in ${(timeUntilExpiry / 60000).toFixed(1)} min, ` +
            `will refresh in ${(refreshAt / 60000).toFixed(1)} min (50% of lifetime)`
          );
          
          return refreshAt;
        }
      } catch (error) {
        logger.warn('Failed to parse token expiry, using default interval:', error);
      }
      
      // Default fallback
      return 25 * 60 * 1000; // 25 minutes
    };

    const refreshInterval = getRefreshInterval();

    refreshTimerRef.current = setTimeout(async () => {
      if (authState.isAuthenticated && authState.user) {
        try {
          const result = await authClient.refreshToken();
          if (result.success) {
            logger.info("Proactive token refresh successful");

            // Phase 4: Notify cache events system of token refresh
            cacheEvents.onTokenRefresh();
            
            crossTabSync.notifyTokenRefresh();

            // Reschedule with new token expiry (dynamic timing)
            startProactiveRefresh();
          } else {
            logger.warn(
              "Proactive token refresh failed, may need to re-authenticate",
            );
          }
        } catch (error) {
          logger.error("Proactive refresh error:", error);
        }
      }
    }, refreshInterval);
  }, [authState.isAuthenticated, authState.user]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      startProactiveRefresh();
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
  }, [authState.isAuthenticated, authState.user, startProactiveRefresh]);

  const lastSyncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event.query.queryKey;
      if (
        queryKey &&
        (queryKey.includes("user") || queryKey.includes("auth"))
      ) {
        const cachedUser =
          (queryClient.getQueryData(["auth", "user"]) as AuthUser) ||
          (queryClient.getQueryData(
            queryKeyFactories.user.profile(),
          ) as AuthUser);

        const isValidUser =
          cachedUser &&
          typeof cachedUser === "object" &&
          "id" in cachedUser &&
          "username" in cachedUser &&
          "name" in cachedUser &&
          "email" in cachedUser &&
          "role" in cachedUser &&
          !("success" in cachedUser && cachedUser.success === false);

        const hasUserChanged =
          isValidUser && cachedUser.id !== lastSyncedUserIdRef.current;

        if (hasUserChanged) {
          console.log("[useAuth] Syncing cached user data to Zustand");
          lastSyncedUserIdRef.current = cachedUser.id;
          authState.setAuthenticated(true, cachedUser);
          authState.updateUser(cachedUser);
        } else if (cachedUser && !isValidUser) {
          console.warn(
            "[useAuth] Ignoring invalid cached user data:",
            cachedUser,
          );
        }
      }
    });

    return unsubscribe;
  }, [queryClient, authState.setAuthenticated, authState.updateUser]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isLoggingOut: authState.isLoggingOut,
    socketConnected: authState.socketConnected,
    sessionExpiry: authState.sessionExpiry,
    lastActivity: authState.lastActivity,

    setLoggingOut: authState.setLoggingOut,
    setLoading: authState.setLoading,
    setSessionExpiry: authState.setSessionExpiry,
    setSocketConnected: authState.setSocketConnected,
    updateLastActivity: authState.updateLastActivity,
    reset: authState.reset,

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
// AUTH REDIRECT HOOK
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
    checkInterval = 5000,
  } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading, refetch } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isLoading) return;

    if (lastAuthState.current === true && !isAuthenticated) {
      console.log("[AuthRedirect] Session expired, redirecting to login");
      router.push(redirectTo);
      return;
    }

    lastAuthState.current = isAuthenticated;

    if (!isAuthenticated) {
      console.log("[AuthRedirect] Not authenticated, redirecting to login");
      router.push(redirectTo);
      return;
    }

    intervalRef.current = setInterval(() => {
      try {
        refetch();
      } catch (error) {
        console.warn("[AuthRedirect] Periodic auth check failed:", error);
        router.push(redirectTo);
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    enabled,
    isAuthenticated,
    isLoading,
    redirectTo,
    checkInterval,
    router,
    refetch,
  ]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      console.log("[AuthRedirect] Session expired or not authenticated, redirecting to login");
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  useEffect(() => {
    if (!enabled || isLoading) return;

    if (lastAuthState.current === true && isAuthenticated === false) {
      console.log(
        "[AuthRedirect] Auth state changed from authenticated to unauthenticated",
      );
      router.push(redirectTo);
    }

    lastAuthState.current = isAuthenticated;
  }, [enabled, isAuthenticated, isLoading, router, redirectTo]);

  return {
    isRedirecting: !isAuthenticated && !isLoading,
  };
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

export { canManageUsers, canAccessSettings, getRoleDisplayName };

export const authUtils = {
  hasRole: (user: AuthUser | null, role: string): boolean => {
    return user?.role === role;
  },

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

    const userLevel =
      roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel =
      roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  },
};

// ============================================================================
// CACHE DEBUG HOOK (Phase 4)
// ============================================================================

/**
 * Hook for debugging cache state
 * Useful for development and troubleshooting
 */
export function useCacheDebug() {
  const getCacheStats = useCallback(() => {
    return cacheEvents.getCacheStats();
  }, []);

  const debugCache = useCallback(() => {
    cacheEvents.debugCacheState();
  }, []);

  const clearAllCaches = useCallback(() => {
    cacheEvents.invalidateAll({
      preserveTheme: true,
      preserveLanguage: true,
    });
    toast.info("All caches cleared");
  }, []);

  const clearAuthCaches = useCallback(() => {
    cacheEvents.invalidateAuth({
      preserveTheme: true,
      preserveLanguage: true,
    });
    toast.info("Auth caches cleared");
  }, []);

  const clearDataCaches = useCallback(() => {
    cacheEvents.invalidateDataQueries();
    toast.info("Data caches cleared");
  }, []);

  return {
    getCacheStats,
    debugCache,
    clearAllCaches,
    clearAuthCaches,
    clearDataCaches,
  };
}

// Export types
export type { AuthUser as User };

// Legacy compatibility exports
export { useAuth as useUnifiedAuth };
export default useAuth;
