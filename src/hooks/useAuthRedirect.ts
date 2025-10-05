"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface UseAuthRedirectOptions {
  enabled?: boolean;
  redirectTo?: string;
  checkInterval?: number;
}

/**
 * Hook that automatically redirects users to login when their session expires
 * Handles the case where session is expired but user hasn't been redirected yet
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    enabled = true,
    redirectTo = "/login",
    checkInterval = 5000, // Check every 5 seconds
  } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading, error, refetch } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Don't start checking if still loading initial auth state
    if (isLoading) return;

    // If user becomes unauthenticated and was previously authenticated, redirect immediately
    if (lastAuthState.current === true && !isAuthenticated) {
      console.log("[AuthRedirect] Session expired, redirecting to login");
      router.push(redirectTo);
      return;
    }

    // Update last known auth state
    lastAuthState.current = isAuthenticated;

    // If not authenticated, redirect immediately
    if (!isAuthenticated) {
      console.log("[AuthRedirect] Not authenticated, redirecting to login");
      router.push(redirectTo);
      return;
    }

    // Set up periodic auth check for authenticated users
    intervalRef.current = setInterval(() => {
      try {
        // Trigger refetch to check auth status
        refetch();
      } catch (error) {
        console.warn("[AuthRedirect] Periodic auth check failed:", error);
        // On auth check failure, redirect to login
        router.push(redirectTo);
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, isLoading, redirectTo, checkInterval, router, refetch]);

  // Handle auth errors by redirecting
  useEffect(() => {
    if (error && !isLoading) {
      console.log("[AuthRedirect] Auth error detected, redirecting to login");
      router.push(redirectTo);
    }
  }, [error, isLoading, router, redirectTo]);

  // Monitor auth state changes and redirect if user becomes unauthenticated
  useEffect(() => {
    if (!enabled || isLoading) return;

    if (lastAuthState.current === true && isAuthenticated === false) {
      console.log("[AuthRedirect] Auth state changed from authenticated to unauthenticated");
      router.push(redirectTo);
    }

    lastAuthState.current = isAuthenticated;
  }, [enabled, isAuthenticated, isLoading, router, redirectTo]);

  return {
    isRedirecting: !isAuthenticated && !isLoading,
  };
}