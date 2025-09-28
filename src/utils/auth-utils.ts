"use client";

import { parse } from "cookie";
import { apiPath } from "@/lib/base-path";
import { logger } from "@/lib/utils";

/**
 * Get authentication token from cookies
 * Optimized for simplified cookie structure (accessToken only)
 */
export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie || "";

  if (!cookieString.trim()) {
    return null;
  }

  const cookies = parse(cookieString);

  // Prefer httpOnly backend cookie only; no JS-visible mirrors in cookie-only mode
  const candidateCookieNames = [
    // Note: httpOnly cookies are not accessible via document.cookie; this will typically return null
    "accessToken",
  ];

  for (const name of candidateCookieNames) {
    const token = (cookies as any)[name];
    if (token && typeof token === "string" && token.trim()) {
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          // Decode payload to check expiry
          const payload = JSON.parse(atob(parts[1]!));
          const now = Date.now();
          const expMs = (payload.exp ?? 0) * 1000;

          if (payload.exp && expMs > now) {
            return token;
          }
        } catch (decodeError) {
          // ignore decode errors silently
        }
      } else {
        // invalid jwt format; continue
      }
    }
  }

  return null;
}

/**
 * Get refresh token from cookies
 * Used for token refresh operations
 */
export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie || "";
  if (!cookieString.trim()) {
    return null;
  }

  const cookies = parse(cookieString);
  return cookies.refreshToken || null;
}

/**
 * Check if authentication token is available with retry logic
 */
export async function waitForAuthToken(
  maxAttempts: number = 10,
  delayMs: number = 100
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const token = getAuthTokenFromCookie();
    if (token) {
      return token;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

/**
 * Dispatch authentication event
 */
export function dispatchAuthEvent(
  eventType: "login" | "logout",
  data?: any
): void {
  if (typeof window === "undefined") return;

  const event = new CustomEvent(`auth:${eventType}`, {
    detail: data,
    bubbles: true,
  });
  window.dispatchEvent(event);
}

/**
 * Check if user is authenticated by checking for valid token
 */
export function isAuthenticated(): boolean {
  // In cookie-only mode, client-side cannot reliably read httpOnly cookies.
  // Prefer SSR guards and middleware. This helper now always returns true if any cookies exist, false otherwise.
  if (typeof document === "undefined") return false;
  const cookieString = document.cookie || "";
  // document.cookie will not include httpOnly cookies; this becomes a best-effort hint only.
  return Boolean(cookieString && cookieString.trim().length > 0);
}

/**
 * Clear authentication tokens from cookies
 * Optimized for simplified cookie structure
 */
export function clearAuthToken(): void {
  try {
    const cookieNames = [
      "accessToken",
      "refreshToken",
      // Legacy cookie names for backward compatibility
      "authState",
      "socket_token",
      "auth_user",
      "access_token",
      "authToken",
      "auth_token",
      "token",
      "jwt",
      "authorization",
    ];

    cookieNames.forEach((cookieName) => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      if (window.location.hostname.includes(".")) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname
          .split(".")
          .slice(-2)
          .join(".")}`;
      }
    });

    // Clear React Query cache for user profile to prevent stale data
    import("@tanstack/react-query").then(({ QueryClient }) => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["current-user-profile"], undefined);
    }).catch(() => {
      // Ignore if React Query is not available
    });

    // Dispatch logout event
    dispatchAuthEvent("logout");
  } catch (error) {
    logger.error("[Auth Utils Error] Failed to clear auth tokens:", error);
  }
}

/**
 * Refresh access token using refresh token
 * Makes API call to refresh endpoint
 */
export async function refreshAccessToken(): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const refreshToken = getRefreshTokenFromCookie();
    if (!refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    const response = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      return { success: true, accessToken: data.data.accessToken };
    } else {
      return { success: false, error: data.message || "Refresh failed" };
    }
  } catch (error) {
    logger.error("[Auth Utils] Token refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
