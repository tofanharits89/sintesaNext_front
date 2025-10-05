/**
 * Legacy useAuth Hook
 *
 * This file provides backward compatibility for components that still import
 * from the old useAuth.ts file. It delegates to the new unified auth system.
 *
 * @deprecated Use useUnifiedAuth from auth-state-unified.tsx instead
 */

import { useUnifiedAuth, type User, type AuthState } from '@/lib/auth-state-unified';

/**
 * Legacy useAuth hook for backward compatibility
 * Wraps the new unified auth system to maintain the old interface
 */
export function useAuth(): AuthState & {
  user: User | null;
  logout: () => void;
  logoutAsync: () => Promise<void>;
  refetch: () => void;
  error: any;
} {
  const auth = useUnifiedAuth();

  return auth;
}

// Export types for backward compatibility
export type { User, AuthState };

// Re-export the unified auth hook as the default
export { useUnifiedAuth };
export default useUnifiedAuth;