"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

    // Skip if already being handled by AuthProvider
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/login')) {
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

    // Check if user has any auth token (accessToken or socketToken)
    const hasAccessToken = document.cookie.includes('accessToken=');
    const hasSocketToken = document.cookie.includes('socketToken=');
    
    if (!hasAccessToken && !hasSocketToken) {
      if (!isRedirecting) {
        console.log('[GlobalAuthCheck] No auth tokens found, redirecting to login');
        isRedirecting = true;
        window.location.replace('/login');
      }
      return;
    }
    
    // Verify session via lightweight /me endpoint; only redirect on 401/403
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
    .then(response => {
      if ((response.status === 401 || response.status === 403) && !isRedirecting) {
        console.log('[GlobalAuthCheck] Session invalid (401/403), redirecting to login');
        isRedirecting = true;
        window.location.replace('/login');
      }
    })
    .catch(() => {
      // Network hiccup: do not force logout; let middleware protect pages
    });

    // Cleanup event listeners
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
      window.removeEventListener('socket:auth-required', handleSocketAuthRequired as EventListener);
    };
  }, [pathname, router]);

  return null;
}