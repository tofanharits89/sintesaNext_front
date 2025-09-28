import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api-client';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  status: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async (): Promise<User> => {
      const response = await apiCall('/users/profile/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

export function useInvalidateUserProfile() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
  };
}