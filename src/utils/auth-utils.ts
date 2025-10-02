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

  // SECURITY FIX: Removed socketToken preference to prevent XSS vulnerability
  // Socket.IO will now use server-side cookie reading instead of client-side access
  const candidateCookieNames = [
    "accessToken",    // httpOnly cookie (Socket.IO will read this server-side)
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
 * Check if user is authenticated by validating session with API
 * SECURITY FIX: Replaced cookie presence check with proper validation
 */
export async function isAuthenticated(): Promise<boolean> {
  // Server-side rendering: cannot validate
  if (typeof window === "undefined") return false;

  try {
    // Use centralized validator for consistency
    const { simpleAuthValidator } = await import('./auth-state-manager');
    return await simpleAuthValidator.validateAuth();
  } catch (error) {
    // Network errors don't mean unauthenticated
    logger.warn('[Auth Utils] Authentication check failed:', error);
    return false;
  }
}

/**
 * Synchronous authentication check for immediate UI decisions
 * Falls back to conservative approach when async check is not possible
 * WARNING: This is less reliable than async isAuthenticated()
 */
export function isAuthSync(): boolean {
  if (typeof window === "undefined") return false;

  // Conservative approach: assume not authenticated unless we can verify
  // This prevents false positives that could expose protected content
  const cookieString = document.cookie || "";
  return Boolean(cookieString && cookieString.includes('accessToken='));
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
      // SECURITY FIX: Removed socketToken to prevent XSS vulnerability
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

    // Clear validation cache to prevent stale auth state
    import("./auth-state-manager").then(({ simpleAuthValidator }) => {
      simpleAuthValidator.clearCache();
    }).catch(() => {
      // Ignore if auth state manager is not available
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
