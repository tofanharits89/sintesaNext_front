"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authStateManager } from '@/lib/auth-state';

// Component to sync auth state from middleware headers
export function AuthSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Read auth state from middleware headers on route change
    const headers = new Headers();
    
    // Get headers from document meta tags (set by middleware)
    const authMeta = document.querySelector('meta[name="x-auth-state"]');
    const tokenMeta = document.querySelector('meta[name="x-auth-token"]');
    
    if (authMeta) headers.set('x-auth-isAuth', authMeta.getAttribute('content') || '0');
    if (tokenMeta) headers.set('x-auth-hasAccessToken', tokenMeta.getAttribute('content') || '0');
    
    authStateManager.setFromHeaders(headers);
  }, [pathname]);

  return null;
}