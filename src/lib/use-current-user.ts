import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "./users-store";
import { apiPath } from "./base-path";

// Fetcher now uses same-origin Next API proxy to ensure cookies are sent reliably
const fetcher = async () => {
  const resp = await fetch(apiPath("/users/profile/me"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!resp.ok) {
    // Don't throw error for 401 (unauthenticated) - just return null
    if (resp.status === 401) {
      return null;
    }
    throw new Error(`Profile request failed: ${resp.status}`);
  }
  return resp.json();
};

export function useCurrentUser(initial?: User) {
  const queryClient = useQueryClient();
  
  // Fetch current user's profile directly from backend; hydrate with server-provided initial user if available
  const { data: profileResp, refetch, isLoading } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: fetcher,
    initialData: initial ? { data: initial } as any : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (user not authenticated)
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const currentUser = useMemo(() => {
    const u = profileResp?.data as User | undefined;
    return u as unknown as User;
  }, [profileResp]);

  const clearCache = () => {
    queryClient.setQueryData(["current-user-profile"], undefined);
  };

  const mutate = refetch; // For backward compatibility

  return { currentUser, mutate, clearCache, isLoading };
}
