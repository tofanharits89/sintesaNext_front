"use client";

import { parse } from "cookie";

/**
 * Get authentication token from cookies
 * Optimized for simplified cookie structure (accessToken only)
 */
export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    console.log("[Auth Debug] SSR environment, no document available");
    return null;
  }

  const cookieString = document.cookie || "";
  console.log(
    "[Auth Debug] Cookie string:",
    cookieString ? "present" : "empty"
  );

  if (!cookieString.trim()) {
    console.log("[Auth Debug] No cookies found");
    return null;
  }

  const cookies = parse(cookieString);
  console.log("[Auth Debug] Available cookies:", Object.keys(cookies));

  // Prefer new cookie names, but fall back to legacy ones for compatibility
  const candidateCookieNames = [
    "accessToken", // new primary (backend, httpOnly)
    "authState", // frontend-readable mirror set by Next login route
    "token", // server-side guard cookie
    "socket_token",
    "access_token",
    "authToken",
    "auth_token",
  ];

  for (const name of candidateCookieNames) {
    const token = (cookies as any)[name];
    if (token && typeof token === "string" && token.trim()) {
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          // Decode payload to check expiry
          const payload = JSON.parse(atob(parts[1]));
          const now = Date.now();
          const expMs = (payload.exp ?? 0) * 1000;

          console.log("[Auth Debug] Token candidate payload:", {
            sourceCookie: name,
            userId: payload.userId,
            exp: payload.exp,
            isExpired: expMs <= now,
          });

          if (payload.exp && expMs > now) {
            console.log(`[Auth Debug] Using valid token from cookie: ${name}`);
            return token;
          }
        } catch (decodeError) {
          console.log(
            `[Auth Debug] Failed to decode JWT from ${name}:`,
            decodeError instanceof Error ? decodeError.message : "decode error"
          );
        }
      } else {
        console.log(
          `[Auth Debug] ${name} invalid JWT format, parts:`,
          parts.length
        );
      }
    }
  }

  console.log("[Auth Debug] No valid auth token cookie found");
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
      console.log(`[Auth Utils] Token found on attempt ${attempt}`);
      return token;
    }

    if (attempt < maxAttempts) {
      console.log(
        `[Auth Utils] Token not found, attempt ${attempt}/${maxAttempts}, retrying in ${delayMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.warn(`[Auth Utils] Token not found after ${maxAttempts} attempts`);
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

  console.log(`[Auth Utils] Dispatching auth:${eventType} event`, data);
  window.dispatchEvent(event);
}

/**
 * Check if user is authenticated by checking for valid token
 */
export function isAuthenticated(): boolean {
  const token = getAuthTokenFromCookie();
  return !!token;
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

    console.log("[Auth Utils] Cleared all authentication cookies");

    // Dispatch logout event
    dispatchAuthEvent("logout");
  } catch (error) {
    console.error("[Auth Utils Error] Failed to clear auth tokens:", error);
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

    const response = await fetch("/api/v1/auth/refresh", {
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
      console.log("[Auth Utils] Token refreshed successfully");
      return { success: true, accessToken: data.data.accessToken };
    } else {
      return { success: false, error: data.message || "Refresh failed" };
    }
  } catch (error) {
    console.error("[Auth Utils] Token refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
