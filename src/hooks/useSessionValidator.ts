"use client";

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { performLogoutCleanup } from '@/lib/cookieManager';

const PUBLIC_PATHS = ['/login', '/server-error', '/unauthorized'];
const CHECK_INTERVAL = 30000; // Check every 30 seconds

// Global flag to prevent multiple logout attempts
let isLoggingOut = false;

/**
 * Hook to periodically validate session with backend
 * Automatically logs out user if session becomes invalid
 */
export function useSessionValidator() {
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    // Skip validation for public paths
    if (PUBLIC_PATHS.some(path => pathname?.startsWith(path))) {
      return;
    }

    // Skip if already logged out
    if (hasLoggedOutRef.current || isLoggingOut) {
      return;
    }

    const checkSession = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current || hasLoggedOutRef.current || isLoggingOut) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const response = await fetch('/api/v1/auth/session/validate', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          // Prevent multiple logout attempts
          if (hasLoggedOutRef.current || isLoggingOut) {
            return;
          }

          console.log('[SessionValidator] Session invalid, logging out');
          hasLoggedOutRef.current = true;
          isLoggingOut = true;
          
          // Stop the interval immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Clear cookies and perform logout cleanup
          await performLogoutCleanup();
          
          // Clear local storage
          if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.removeItem('auth_state');
          }

          // Redirect to login
          router.replace('/login?reason=session_expired');
        }
      } catch (error) {
        console.error('[SessionValidator] Error checking session:', error);
        // Don't log out on network errors - let middleware handle it
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkSession, 5000);

    // Set up periodic checks
    intervalRef.current = setInterval(checkSession, CHECK_INTERVAL);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname, router]);
}
