import { useMemo, useCallback } from "react";
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
    throw new Error(`Profile request failed: ${resp.status}`);
  }
  return resp.json();
};

export function useCurrentUser(initial?: User) {
  const queryClient = useQueryClient();
  // Fetch current user's profile directly from backend; hydrate with server-provided initial user if available
  const { data: profileResp, isLoading } = useQuery<{ data: User } | any>({
    queryKey: ["current-user-profile"],
    queryFn: fetcher,
    initialData: initial ? ({ data: initial } as any) : undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  // Provide a SWR-like mutate alias that invalidates the query
  const mutate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
  }, [queryClient]);

  const currentUser = useMemo(() => {
    const u = profileResp?.data as User | undefined;
    return u as unknown as User;
  }, [profileResp]);

  return { currentUser, mutate, isLoading: isLoading || !profileResp };
}
