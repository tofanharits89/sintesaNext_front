'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Auth Cache Provider
 * Legacy component - no longer needed with new useAuth hook
 *
 * The new useAuth hook manages its own query client internally,
 * so this provider can be safely removed from your component tree.
 */
export function AuthCacheProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // No longer needed - keeping for backwards compatibility
  useEffect(() => {
    // This can be safely removed
  }, [queryClient]);

  return <>{children}</>;
}
