import { useMemo } from "react";
import useSWR from "swr";
import { User } from "./users-store";
import { apiClient } from "./httpClient";

// Fetcher hits backend directly so Axios interceptors handle CSRF and token refresh
const fetcher = async () => {
  return apiClient.get("/users/profile/me");
};

export function useCurrentUser() {
  // Fetch current user's profile directly from backend
  const { data: profileResp, mutate } = useSWR(
    "current-user-profile",
    fetcher
  );

  const currentUser = useMemo(() => {
    const u = profileResp?.data as User | undefined;
    return u as unknown as User;
  }, [profileResp]);

  return { currentUser, mutate, isLoading: !profileResp };
}
