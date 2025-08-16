import { useMemo } from "react";
import useSWR from "swr";
import { User } from "./users-store";
import { apiPath } from "./base-path";
import { getAuthTokenFromCookie } from "../utils/auth-utils";

const fetcher = (url: string) => {
  const token = getAuthTokenFromCookie();
  console.log("[useCurrentUser Debug] Fetching user profile:", {
    url,
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPrefix: token?.substring(0, 10) + "...",
  });

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
      console.log("[useCurrentUser Debug] Response:", {
        status: r.status,
        statusText: r.statusText,
        ok: r.ok,
        contentType: r.headers.get("content-type"),
      });

      // Check if response has content
      const contentType = r.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[useCurrentUser Debug] Non-JSON response received");
        return { success: false, error: "Invalid response format" };
      }

      // Check if response body is empty
      const text = await r.text();
      if (!text.trim()) {
        console.warn("[useCurrentUser Debug] Empty response body");
        return { success: false, error: "Empty response" };
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("[useCurrentUser Debug] JSON parse error:", parseError);
        console.error("[useCurrentUser Debug] Response text:", text);
        return { success: false, error: "Invalid JSON response" };
      }
    })
    .catch((error) => {
      console.error("[useCurrentUser Debug] Fetch error:", error);
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
