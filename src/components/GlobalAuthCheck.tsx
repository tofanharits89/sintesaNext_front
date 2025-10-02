"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { simpleAuthValidator } from '@/utils/auth-state-manager';

const PUBLIC_PATHS = ['/login', '/server-error'];

// Global flag to prevent multiple redirects
let isRedirecting = false;

export default function GlobalAuthCheck() {
  const pathname = usePathname();
  const router = useRouter();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;

    // Skip auth check for public pages
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
      return;
    }

    // CRITICAL: Skip if on login page or coming from middleware redirect
    if (typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/login') ||
         window.location.search.includes('from_redirect=1'))) {
      console.debug('[GlobalAuthCheck] Skipping - on login page or from redirect');
      return;
    }

    // Skip if already redirecting or already checked
    if (isRedirecting || hasCheckedRef.current) {
      return;
    }

    // Listen for session expiration events from Socket.IO
    const handleAuthLogout = (event: CustomEvent) => {
      if (isRedirecting) return;

      console.log('[GlobalAuthCheck] Auth logout event received:', event.detail);
      isRedirecting = true;

      // Clear any local state
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('auth_state');
      }
      // Redirect to login
      router.replace('/login?reason=session_expired');
    };

    const handleSocketAuthRequired = (event: CustomEvent) => {
      if (isRedirecting) return;

      console.log('[GlobalAuthCheck] Socket auth required event received:', event.detail);
      isRedirecting = true;
      router.replace('/login?reason=auth_required');
    };

    window.addEventListener('auth:logout', handleAuthLogout as EventListener);
    window.addEventListener('socket:auth-required', handleSocketAuthRequired as EventListener);

    // Mark as checked to prevent duplicate checks
    hasCheckedRef.current = true;

    // SECURITY FIX: Use centralized auth validation for consistency
    // This ensures synchronization with the useAuth system and prevents stale auth state
    const validateAuthState = async () => {
      try {
        const isValid = await simpleAuthValidator.validateAuth();

        if (!isValid && !isRedirecting) {
          console.log('[GlobalAuthCheck] Session invalid, redirecting to login');
          isRedirecting = true;
          window.location.replace('/login?reason=session_expired');
        }

        return isValid;
      } catch (error) {
        console.warn('[GlobalAuthCheck] Auth validation failed:', error);
        // Network errors should not force logout - let middleware handle protection
        return false;
      }
    };

    // Perform validation but don't block the component
    validateAuthState();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
      window.removeEventListener('socket:auth-required', handleSocketAuthRequired as EventListener);
    };
  }, [pathname, router]);

  return null;
}