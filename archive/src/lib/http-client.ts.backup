/**
 * HTTP Client with Automatic Token Refresh
 * Handles 401 responses and refreshes tokens automatically
 * Minimal changes to existing auth architecture
 */

import { logger } from "@/lib/utils";

// Lazy import to avoid circular dependency
const getAuthClient = async () => {
  const { authClient } = await import("./auth-client");
  return authClient;
};

// Global flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
}> = [];

/**
 * Enhanced fetch with automatic token refresh on 401 responses
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Ensure credentials are always included for auth
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      logger.info("401 received, attempting token refresh");

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(async () => {
          // Retry the original request after refresh
          return fetch(url, fetchOptions);
        });
      }

      // Mark that we're refreshing
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const authClient = await getAuthClient();
        const refreshResult = await authClient.refreshToken();

        if (refreshResult.success) {
          logger.info("Token refreshed successfully, retrying request");

          // Resolve all queued requests
          refreshQueue.forEach(({ resolve }) => resolve(true));
          refreshQueue = [];

          // Retry the original request
          response = await fetch(url, fetchOptions);
        } else {
          logger.warn("Token refresh failed, logging out");

          // Reject all queued requests
          refreshQueue.forEach(({ reject }) =>
            reject(new Error("Token refresh failed")),
          );
          refreshQueue = [];

          // Refresh failed - trigger logout (handled by auth state)
          // The auth state will detect this and handle cleanup
          return response; // Return original 401 response
        }
      } catch (error) {
        logger.error("Token refresh error:", error);

        // Reject all queued requests
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        refreshQueue.forEach(({ reject }) => reject(errorObj));
        refreshQueue = [];
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    logger.error("Fetch error:", error);
    throw error;
  }
};

/**
 * JSON fetch helper that parses response automatically
 */
export const authenticatedJSONFetch = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const response = await authenticatedFetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid JSON response");
    }

    if (response.ok) {
      return { success: true, data: data as T };
    } else {
      // Extract error message from response data
      const errorData = data as Record<string, unknown>;
      const errorMessage =
        (typeof errorData?.error === "string" ? errorData.error : "") ||
        (typeof errorData?.message === "string" ? errorData.message : "") ||
        `HTTP ${response.status}`;
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
};

// Default export for convenience
export default authenticatedFetch;
