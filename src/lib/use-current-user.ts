import { useMemo } from "react";
import useSWR from "swr";
import { User } from "./users-store";
import { apiPath } from "./base-path";
import { getAuthTokenFromCookie } from "../utils/auth-utils";

const fetcher = (url: string) => {
  const token = getAuthTokenFromCookie();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    credentials: "include",
    headers,
  })
    .then(async (r) => {
      // Check if response has content
      const contentType = r.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return { success: false, error: "Invalid response format" };
      }

      // Check if response body is empty
      const text = await r.text();
      if (!text.trim()) {
        return { success: false, error: "Empty response" };
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        return { success: false, error: "Invalid JSON response" };
      }
    })
    .catch((error) => {
      throw error;
    });
};

export function useCurrentUser() {
  // Fetch current user's profile directly
  const { data: profileResp, mutate } = useSWR(
    apiPath("/users/profile/me"),
    fetcher
  );

  const currentUser = useMemo(() => {
    const u = profileResp?.data as User | undefined;
    return u as unknown as User;
  }, [profileResp]);

  return { currentUser, mutate, isLoading: !profileResp };
}
