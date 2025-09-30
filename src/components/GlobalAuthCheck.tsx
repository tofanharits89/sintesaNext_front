"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/server-error'];

export default function GlobalAuthCheck() {
  const pathname = usePathname();

  useEffect(() => {
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
    
    // Verify token is valid
    fetch('/api/auth/verify', {
      method: 'GET',
      credentials: 'include',
    })
    .then(response => {
      if (!response.ok) {
        window.location.href = '/login';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });
  }, [pathname]);

  return null;
}