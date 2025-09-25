"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";
import { backendPath } from "@/lib/backend";
import { toast } from "sonner";
import { createQueryOptions, queryKeyFactories, cacheInvalidation } from "@/lib/query-configs";
import { logger } from "@/lib/utils";

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
export const authKeys = {
  ...queryKeyFactories.user,
  combined: () => ['auth', 'combined'] as const,
};

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
      logger.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    },
  });
}

// Consolidated auth hook that combines verification and profile in a single query
export function useAuth() {
  const queryClient = useQueryClient();
  const logout = useLogout();
  
  // Single query that handles both auth verification and user profile
  const authQuery = useQuery({
    queryKey: authKeys.combined(),
    queryFn: async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
      try {
        // First verify auth
        const authResponse = await fetch(backendPath("/auth/verify"), {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!authResponse.ok) {
          return { isAuthenticated: false };
        }
        
        const authData: AuthResponse = await authResponse.json();
        if (!authData.success) {
          return { isAuthenticated: false };
        }
        
        // If authenticated, fetch user profile
        const profileResponse = await fetch(apiPath("/users/profile/me"), {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!profileResponse.ok) {
          return { isAuthenticated: true }; // Auth valid but profile fetch failed
        }
        
        const profileData: AuthResponse = await profileResponse.json();
        return {
          isAuthenticated: true,
          user: profileData.data || undefined,
        };
      } catch (error) {
        logger.error("Auth query error:", error);
        return { isAuthenticated: false };
      }
    },
    ...createQueryOptions('critical', {
      retry: (failureCount, error) => {
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          return false;
        }
        return failureCount < 2;
      },
    }),
  });
  
  return {
    // Auth state
    isAuthenticated: authQuery.data?.isAuthenticated ?? false,
    isLoading: authQuery.isLoading,
    error: authQuery.error,
    
    // User data
    user: authQuery.data?.user,
    
    // Actions
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
    
    // Refetch functions
    refetch: authQuery.refetch,
  };
}

// Hook for components that require authenticated user
export function useRequireAuth() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return { ...auth, isLoading: true };
  }
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error("Authentication required");
  }
  
  return { ...auth, isLoading: false, user: auth.user };
}

