'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { setGlobalQueryClient } from '@/lib/auth';

/**
 * Auth Cache Provider
 * Initializes the global query client for auth interceptors.
 * 
 * Must be placed inside QueryClientProvider but outside any auth-dependent components.
 */
export function AuthCacheProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Initialize global query client for auth error handling
  useEffect(() => {
    setGlobalQueryClient(queryClient);
    console.log('[AuthCacheProvider] ✅ Global query client initialized for auth error handling');
  }, [queryClient]);

  return <>{children}</>;
}
