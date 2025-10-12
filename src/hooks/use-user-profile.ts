import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/httpClient';
import type { User } from '@/stores/session-store';

// Re-export User type for convenience
export type { User };

export function useUserProfile() {
  return useQuery({
    queryKey: ['auth', 'user'], // Consistent with auth invalidation
    queryFn: async (): Promise<User> => {
      console.log('[useUserProfile] Fetching profile data...');
      const response = await apiClient.get('/users/profile/me');
      
      console.log('[useUserProfile] Raw response:', response);
      
      // Validate response structure - ensure it's actual user data, not an error object
      if (!response || typeof response !== 'object') {
        console.error('[useUserProfile] Invalid response structure');
        throw new Error('Invalid response from profile endpoint');
      }
      
      // Check if response is an error object
      if ('success' in response && response.success === false) {
        console.error('[useUserProfile] API returned error:', response);
        throw new Error(response.error || 'Failed to fetch profile');
      }
      
      // Check if response has user data (either directly or in data.user)
      const userData = response.data?.user || response.data || response;
      
      console.log('[useUserProfile] Extracted user data:', userData);
      
      // Validate that we have the required user fields
      if (!userData || !userData.id || !userData.username) {
        console.error('[useUserProfile] Invalid user data structure:', userData);
        throw new Error('Invalid user data structure');
      }
      
      return userData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Enable refetch on mount to get fresh data
    retry: 1,
    // Prevent error caching to avoid infinite loops
    select: (data) => data,
  });
}

export function useInvalidateUserProfile() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['auth', 'user'] }); // Consistent key
  };
}