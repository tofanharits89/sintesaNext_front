"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface AuthResult {
  success: boolean;
  data?: {
    userId: string;
    role: string;
  };
  message?: string;
}

interface UseClientAuthOptions {
  enabled?: boolean;
  redirectOnFailure?: boolean;
  redirectTo?: string;
}

/**
 * Client-side auth verification hook using React Query
 * Provides fast, cached authentication status with automatic retries
 */
export function useClientAuth(options: UseClientAuthOptions = {}) {
  const {
    enabled = true,
    redirectOnFailure = false,
    redirectTo = "/login",
  } = options;

  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: authResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AuthResult>({
    queryKey: ["auth", "verify"],
    queryFn: async (): Promise<AuthResult> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-fast`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle authentication failure
      if (!result.success && redirectOnFailure) {
        router.push(redirectTo);
      }

      return result;
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds (aligned with server cache)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 (auth failures)
      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        return false;
      }
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isAuthenticated = authResult?.success === true;
  const user = authResult?.data;

  // Invalidate auth cache (useful after login/logout)
  const invalidateAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  // Force refresh auth status
  const refreshAuth = useCallback(() => {
    return refetch();
  }, [refetch]);

  // Logout helper that clears cache and redirects
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Clear all auth-related cache
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.removeQueries({ queryKey: ["user"] });
      
      // Redirect to login
      router.push("/login");
    }
  }, [queryClient, router]);

  return {
    isAuthenticated,
    user,
    isLoading,
    isError,
    error,
    invalidateAuth,
    refreshAuth,
    logout,
  };
}

/**
 * Hook for components that require authentication
 * Automatically redirects to login if not authenticated
 */
export function useRequireAuth() {
  return useClientAuth({
    redirectOnFailure: true,
    redirectTo: "/login",
  });
}

/**
 * Hook for optional authentication (doesn't redirect)
 * Useful for components that show different content based on auth status
 */
export function useOptionalAuth() {
  return useClientAuth({
    redirectOnFailure: false,
  });
}

/**
 * Hook that only checks if user is authenticated (minimal data)
 * Useful for navigation components or conditional rendering
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useClientAuth();
  return { isAuthenticated, isLoading };
}