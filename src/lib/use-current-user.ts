import { useMemo } from "react";
import useSWR from "swr";
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
  // Fetch current user's profile directly from backend; hydrate with server-provided initial user if available
  const { data: profileResp, mutate } = useSWR(
    "current-user-profile",
    fetcher,
    initial ? { fallbackData: { data: initial } as any } : undefined
  );

  const currentUser = useMemo(() => {
    const u = profileResp?.data as User | undefined;
    return u as unknown as User;
  }, [profileResp]);

  return { currentUser, mutate, isLoading: !profileResp };
}
