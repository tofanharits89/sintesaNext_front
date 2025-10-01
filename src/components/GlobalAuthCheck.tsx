"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/server-error'];

export default function GlobalAuthCheck() {
  const pathname = usePathname();

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

    // Check if user has access token
    const hasToken = document.cookie.includes('accessToken=');
    
    if (!hasToken) {
      window.location.href = '/login';
      return;
    }
    
    // Verify session via lightweight /me endpoint; only redirect on 401/403
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
    .then(response => {
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
      }
    })
    .catch(() => {
      // Network hiccup: do not force logout; let middleware protect pages
    });
  }, [pathname]);

  return null;
}