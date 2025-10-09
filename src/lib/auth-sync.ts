/**
 * Centralized Auth Synchronization
 * Ensures React Query and Zustand auth states stay in sync
 */

import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { useAuthSessionStore, type User } from '@/stores/session-store';
import { useEffect } from 'react';
import { queryKeyFactories } from '@/lib/query-configs';

/**
 * Hook that synchronizes auth state between React Query and Zustand
 * Call this once in your app layout to maintain consistency
 */
export function useAuthSync() {
  const queryClient = useQueryClient();
  const { setAuthenticated, updateUser, logout } = useAuthSessionStore();

  // Listen to React Query user data changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if this is a user-related query update
      if (Array.isArray(event.query.queryKey) && 
          (event.query.queryKey.includes('user') || 
          event.query.queryKey.includes('auth'))) {
        
        const userData = queryClient.getQueryData(queryKeyFactories.user.profile()) as User;
        
        if (userData) {
          // Update Zustand with fresh React Query data
          console.log('[AuthSync] Syncing fresh user data to Zustand:', userData);
          setAuthenticated(true, userData);
          updateUser(userData);
        } else if (event.type === 'removed') {
          // User data was removed/invalidated
          console.log('[AuthSync] User data invalidated, checking auth state...');
          const authData = queryClient.getQueryData(['auth', 'user']) as User;
          if (!authData) {
            logout();
          }
        }
      }
    });

    return unsubscribe;
  }, [queryClient, setAuthenticated, updateUser, logout]);
}

/**
 * Force immediate sync of user data
 * Call this after login/logout to ensure consistency
 */
export function syncUserNow(queryClient: QueryClient) {
  const { setAuthenticated, updateUser, logout } = useAuthSessionStore();
  
  // Get current user data from React Query
  const userData = queryClient.getQueryData(queryKeyFactories.user.profile()) as User;
  const authData = queryClient.getQueryData(['auth', 'user']) as User;
  
  if (userData || authData) {
    console.log('[AuthSync] Immediate sync - updating Zustand with fresh data');
    const latestUserData: User = userData || authData;
    setAuthenticated(true, latestUserData);
    updateUser(latestUserData);
  } else {
    console.log('[AuthSync] Immediate sync - clearing auth state');
    logout();
  }
}

/**
 * Comprehensive auth invalidation that updates both systems
 */
export function invalidateAuthData(queryClient: QueryClient) {
  console.log('[AuthSync] Invalidating all auth data');
  
  // Invalidate all auth-related queries
  queryClient.invalidateQueries({ queryKey: queryKeyFactories.user.all() });
  queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
  queryClient.removeQueries({ queryKey: queryKeyFactories.user.profile() });
  
  // Clear Zustand state
  const { reset } = useAuthSessionStore.getState();
  reset();
}
