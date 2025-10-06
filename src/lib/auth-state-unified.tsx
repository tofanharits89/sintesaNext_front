/**
 * Unified Authentication State Management
 *
 * Consolidates 3 separate auth state systems into 1 cohesive solution:
 * - Replaces auth-state.ts (simple middleware state)
 * - Replaces auth-state-manager.ts (complex enterprise class)
 * - Replaces useAuth.ts (React Query hook) partially
 *
 * Architecture Principles:
 * - Single source of truth for auth state
 * - Optimistic UI updates with server validation
 * - Automatic token refresh and session management
 * - Cross-tab synchronization
 * - Performance optimized with smart caching
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/httpClient";
import { toast } from "sonner";
import { logger } from "@/lib/utils";
import { clearNonHttpOnlyCookies } from "@/lib/cookieManager";

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "co_admin"
    | "kantor_pusat"
    | "kanwil_djpb"
    | "kppn"
    | "lainnya";
  limitKodeBA?: string;
  kdkanwil?: string;
  kdkppn?: string;
  nmkanwil?: string;
  nmkppn?: string;
  status: "active" | "disabled";
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  lastActivity: number;
}

// Cache configuration
const AUTH_CACHE_KEY = "auth-state";
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_UPDATE_INTERVAL = 30 * 1000; // 30 seconds

/**
 * Simple cache utility for auth state
 */
class AuthCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > AUTH_CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.warn("Failed to set localStorage item:", error);
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.warn("Failed to get localStorage item:", error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn("Failed to remove localStorage item:", error);
    }
  }
}

const authCache = new AuthCache();

/**
 * Main authentication hook - consolidated from 3 separate systems
 */
export function useUnifiedAuth() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  // Public paths where auth query should be disabled
  // login/register/forgot-password: Truly public authentication pages
  // server-error/ip-blocked: Error pages that validate their own conditions
  const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/server-error', '/ip-blocked'];
  const isPublicPath = useMemo(
    () => PUBLIC_PATHS.some(path => pathname?.startsWith(path)),
    [pathname]
  );

  // Optimistic auth state from cache/middleware
  const getOptimisticAuth = useCallback((): AuthState => {
    const cached = authCache.get(AUTH_CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Fallback to middleware headers (from auth-state.ts functionality)
    const headers = new Headers(
      typeof window !== "undefined" && window.location ? {} : {}
    );
    const isAuth = headers.get("x-auth-isAuth") === "1";
    const hasToken = headers.get("x-auth-hasAccessToken") === "1";

    return {
      isAuthenticated: isAuth && hasToken,
      user: null,
      isLoading: false,
      isLoggingOut: false,
      lastActivity: Date.now(),
    };
  }, []);

  // Server auth validation (from useAuth.ts functionality)
  const authQuery = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async (): Promise<AuthState> => {
      try {
        // Check if logout is in progress - return unauthenticated immediately
        if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("__isLoggingOut") === "true") {
          console.log("[UnifiedAuth] Logout in progress, skipping /auth/me call");
          return {
            isAuthenticated: false,
            user: null,
            isLoading: false,
            isLoggingOut: true,
            lastActivity: Date.now(),
          } as AuthState;
        }
        
        // Check if we just logged in - give cookies time to settle
        const justLoggedIn = sessionStorage.getItem("just_logged_in");
        if (justLoggedIn === "true") {
          const loginTimestamp = parseInt(
            sessionStorage.getItem("login_timestamp") || "0"
          );
          const timeSinceLogin = Date.now() - loginTimestamp;

          // If login was very recent (< 500ms), wait a bit for cookies to be set
          if (timeSinceLogin < 500) {
            await new Promise((resolve) =>
              setTimeout(resolve, 500 - timeSinceLogin)
            );
          }
        }

        const response = await apiClient.get("/auth/me");

        console.log("[UnifiedAuth] /auth/me response:", response);
        console.log("[UnifiedAuth] response.success:", response.success);
        console.log("[UnifiedAuth] response.data:", response.data);

        // apiClient.get returns the data directly, not wrapped in response.data
        if (response.success) {
          const authState: AuthState = {
            isAuthenticated: true,
            user: response.data,
            isLoading: false,
            isLoggingOut: false,
            lastActivity: Date.now(),
          };

          // Cache the authenticated state
          authCache.set(AUTH_CACHE_KEY, authState);
          console.log("[UnifiedAuth] Auth state set:", authState);
          return authState;
        }

        console.warn("[UnifiedAuth] Response success was false or missing");

        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isLoggingOut: false,
          lastActivity: Date.now(),
        } as AuthState;
      } catch (error: any) {
        // Don't attempt refresh immediately after login failure
        const justLoggedIn = sessionStorage.getItem("just_logged_in");

        // Attempt token refresh on 401 (but not immediately after login)
        if (error.response?.status === 401 && justLoggedIn !== "true") {
          try {
            await apiClient.post("/auth/refresh");
            // Retry after refresh
            const retryResponse = await apiClient.get("/auth/me");
            if (retryResponse.success) {
              const authState: AuthState = {
                isAuthenticated: true,
                user: retryResponse.data,
                isLoading: false,
                isLoggingOut: false,
                lastActivity: Date.now(),
              };
              authCache.set(AUTH_CACHE_KEY, authState);
              return authState;
            }
          } catch (refreshError) {
            // Refresh failed - clear cache
            authCache.clear();
          }
        }

        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isLoggingOut: false,
          lastActivity: Date.now(),
        } as AuthState;
      }
    },
    staleTime: AUTH_CACHE_TTL,
    refetchInterval: ACTIVITY_UPDATE_INTERVAL,
    refetchIntervalInBackground: true,
    enabled: typeof window !== "undefined" && 
             !isPublicPath && // Disable on public pages (login, etc.)
             !(typeof sessionStorage !== "undefined" && sessionStorage.getItem("__isLoggingOut") === "true"), // Disable during logout
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("[UnifiedAuth] Calling logout API");
      try {
        // Mark this request to skip auth refresh interceptor
        await apiClient.post("/auth/logout", {}, { 
          _skipAuthRefresh: true 
        } as any);
        console.log("[UnifiedAuth] Logout API completed successfully");
      } catch (error) {
        console.warn("[UnifiedAuth] Logout API failed, but continuing with cleanup:", error);
        // Continue with cleanup even if API fails
      }
    },
    onMutate: async () => {
      console.log("[UnifiedAuth] Starting logout mutation");
      
      // Set global flag to prevent socket reconnection during logout
      // Use both window and sessionStorage for persistence across redirect
      if (typeof window !== "undefined") {
        (window as any).__isLoggingOut = true;
        sessionStorage.setItem("__isLoggingOut", "true");
        console.log("[UnifiedAuth] Set __isLoggingOut flag to TRUE (window + sessionStorage)");
      }
      
      // Cancel all auth queries immediately
      await queryClient.cancelQueries({ queryKey: ["auth", "user"] });
      
      // Disable the query by setting data to unauthenticated state
      queryClient.setQueryData(["auth", "user"], {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isLoggingOut: true,
        lastActivity: Date.now(),
      } as AuthState);
      
      // Invalidate to prevent refetch
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
    onSuccess: () => {
      console.log("[UnifiedAuth] Logout successful, clearing caches");
      // Clear all caches
      authCache.clear();
      authCache.removeItem("auth-state");
      queryClient.clear();

      // Clear non-HTTP-only cookies (HTTP-only cleared by backend)
      clearNonHttpOnlyCookies();

      // Dispatch events for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:logout", {
            detail: { timestamp: Date.now() },
          })
        );

        // Set logout flag for cross-tab sync
        try {
          localStorage.setItem("auth-logout", Date.now().toString());
        } catch (error) {
          console.warn("[UnifiedAuth] Failed to set logout flag:", error);
        }
      }

      console.log("[UnifiedAuth] Logout complete");
    },
    onError: (error) => {
      console.error("[UnifiedAuth] Logout failed:", error);
      logger.error("Logout failed:", error);

      // Still clear local state even if API fails
      authCache.clear();
      authCache.removeItem("auth-state");
      queryClient.clear();
      clearNonHttpOnlyCookies();
    },
  });

  // Activity tracking (from auth-state-manager.ts functionality)
  useEffect(() => {
    // Skip activity tracking on public pages
    if (isPublicPath) {
      return;
    }

    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);

      // Update cached activity
      const cached = authCache.get(AUTH_CACHE_KEY);
      if (cached) {
        cached.lastActivity = now;
        authCache.set(AUTH_CACHE_KEY, cached);
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic activity update
    activityTimerRef.current = setInterval(
      updateActivity,
      ACTIVITY_UPDATE_INTERVAL
    );

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [isPublicPath]);

  // Cross-tab synchronization (from auth-state-manager.ts functionality)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "auth-logout") {
        // Logout from another tab
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        authCache.clear();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  // Merge optimistic and server state
  const optimisticAuth = getOptimisticAuth();
  const serverAuth = authQuery.data || optimisticAuth;

  const authState: AuthState = {
    ...serverAuth,
    isLoading: authQuery.isLoading || logoutMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    lastActivity: Math.max(serverAuth.lastActivity || 0, lastActivity),
  };

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation.mutate]);

  const logoutAsync = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation.mutateAsync]);

  const refetch = useCallback(() => {
    return authQuery.refetch();
  }, [authQuery.refetch]);

  return {
    ...authState,
    logout,
    logoutAsync,
    refetch,
    error: authQuery.error,
  };
}

/**
 * Simple auth state provider (replaces AuthProvider.tsx complexity)
 */
export function UnifiedAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useUnifiedAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

import { createContext, useContext } from "react";

const AuthContext = createContext<ReturnType<typeof useUnifiedAuth> | null>(
  null
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within UnifiedAuthProvider");
  }
  return context;
}

/**
 * Utility functions (consolidated from multiple files)
 */
export const authUtils = {
  // Check if user has specific role (from rbac.ts)
  hasRole: (user: User | null, role: string): boolean => {
    return user?.role === role;
  },

  // Check if user can access resource (from rbac.ts)
  canAccess: (user: User | null, requiredRole: string): boolean => {
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

  // Clear auth state (from auth-state.ts)
  clearAuthState: () => {
    authCache.clear();
    authCache.removeItem("auth-state");
  },

  // Set auth state (from auth-state.ts)
  setAuthState: (state: Partial<AuthState>) => {
    const current = authCache.get(AUTH_CACHE_KEY) || {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      isLoggingOut: false,
      lastActivity: Date.now(),
    };

    const updated = { ...current, ...state };
    authCache.set(AUTH_CACHE_KEY, updated);
  },
};
