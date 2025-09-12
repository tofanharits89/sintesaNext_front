"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";
import { backendPath } from "@/lib/backend";
import { toast } from "sonner";
import { createQueryOptions, queryKeyFactories, cacheInvalidation } from "@/lib/query-configs";

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: any;
}

interface AuthResponse {
  success: boolean;
  data?: User;
  message?: string;
}

// Use centralized query keys from query-configs
export const authKeys = queryKeyFactories.user;

// Client-side auth verification with React Query
export function useAuthVerification() {
  return useQuery({
    queryKey: authKeys.verify(),
    queryFn: async (): Promise<AuthResponse> => {
      const response = await fetch(backendPath("/auth/verify"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Auth verification failed: ${response.status}`);
      }
      
      return response.json();
    },
    ...createQueryOptions('critical', {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 (auth failures)
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          return false;
        }
        return failureCount < 2;
      },
    }),
  });
}

// Enhanced user profile hook with optimistic updates
export function useUserProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async (): Promise<User> => {
      const response = await fetch(apiPath("/users/profile/me"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.status}`);
      }
      
      const data: AuthResponse = await response.json();
      if (!data.success || !data.data) {
        throw new Error("Invalid user data");
      }
      
      return data.data;
    },
    ...createQueryOptions('user', {
      refetchOnWindowFocus: false, // Don't refetch profile on focus (less critical)
    }),
  });
}

// Logout mutation with cache invalidation
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(apiPath("/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear all auth-related cache using centralized invalidation
      cacheInvalidation.invalidateUser(queryClient);
      queryClient.removeQueries({ queryKey: authKeys.all() });
      
      // Redirect to login
      window.location.href = "/login";
      
      toast.success("Logged out successfully");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    },
  });
}

// Combined auth hook for convenience
export function useAuth() {
  const authVerification = useAuthVerification();
  const userProfile = useUserProfile();
  const logout = useLogout();
  
  return {
    // Auth state
    isAuthenticated: authVerification.data?.success ?? false,
    isAuthLoading: authVerification.isLoading,
    authError: authVerification.error,
    
    // User data
    user: userProfile.data,
    isUserLoading: userProfile.isLoading,
    userError: userProfile.error,
    
    // Actions
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
    
    // Refetch functions
    refetchAuth: authVerification.refetch,
    refetchUser: userProfile.refetch,
  };
}

// Hook for components that require authenticated user
export function useRequireAuth() {
  const auth = useAuth();
  
  if (auth.isAuthLoading || auth.isUserLoading) {
    return { ...auth, isLoading: true };
  }
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error("Authentication required");
  }
  
  return { ...auth, isLoading: false, user: auth.user };
}