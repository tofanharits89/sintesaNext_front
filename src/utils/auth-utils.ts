"use client";

import { parse } from "cookie";

/**
 * Get authentication token from cookies
 * Utility function for token extraction and validation
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

  // First check for the authState cookie (non-httpOnly, readable by JavaScript)
  // This is the primary cookie set by the backend for frontend authentication
  if (
    cookies.authState &&
    typeof cookies.authState === "string" &&
    cookies.authState.trim()
  ) {
    console.log("[Auth Debug] Found authState cookie");
    const parts = cookies.authState.split(".");
    if (parts.length === 3) {
      try {
        // Decode payload to check expiry
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now();
        const expTime = payload.exp * 1000;

        console.log("[Auth Debug] Token payload:", {
          userId: payload.userId,
          exp: payload.exp,
          currentTime: currentTime,
          expTime: expTime,
          isExpired: expTime <= currentTime,
        });

        // Check if token is expired
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          console.log("[Auth Debug] Using valid authState token");
          return cookies.authState;
        } else {
          console.log("[Auth Debug] authState token is expired");
        }
      } catch (decodeError) {
        console.log(
          "[Auth Debug] Failed to decode authState token:",
          decodeError instanceof Error ? decodeError.message : "decode error"
        );
        // Continue to fallback options if authState is invalid
      }
    } else {
      console.log(
        "[Auth Debug] authState token invalid format, parts:",
        parts.length
      );
    }
  } else {
    console.log("[Auth Debug] No authState cookie found");
  }

  // Fallback: Try other possible cookie names (though these are likely httpOnly)
  const possibleTokenNames = [
    "socket_token", // Add the actual cookie name that exists
    "auth_user", // Add the other actual cookie name that exists
    "accessToken",
    "access_token",
    "authToken",
    "auth_token",
    "token",
    "jwt",
    "authorization",
  ];

  for (const tokenName of possibleTokenNames) {
    const token = cookies[tokenName];

    if (token && typeof token === "string" && token.trim()) {
      // Basic JWT format validation
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          // Decode payload to check expiry
          const payload = JSON.parse(atob(parts[1]));

          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            continue;
          }

          return token;
        } catch (decodeError) {
          console.log(
            "[Auth Debug] Failed to decode token from",
            tokenName,
            ":",
            decodeError instanceof Error ? decodeError.message : "decode error"
          );
          continue;
        }
      }
    }
  }

  return null;
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
 * Utility function for token cleanup
 */
export function clearAuthToken(): void {
  try {
    const cookieNames = [
      "authState", // Primary non-httpOnly cookie
      "socket_token", // Add the actual cookie names that exist
      "auth_user",
      "accessToken",
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

    // Dispatch logout event
    dispatchAuthEvent("logout");
  } catch (error) {
    console.error("[Auth Utils Error] Failed to clear auth tokens:", error);
  }
}
