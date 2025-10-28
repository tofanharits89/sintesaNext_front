/**
 * Consolidated Authentication Client
 * Server-side token validation only - no client-side cookie access
 * Secure HTTP-only cookie implementation with automatic token refresh
 */

import { logger } from "../utils/logger";
import { http, clearLogoutGuard, setPostLoginGrace } from "../api/httpClient";
import { apiPath } from "../config/base-path";

// User interface (matches backend API response)
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "co_admin"
    | "kantor_pusat"
    | "kanwil_djpb"
    | "kppn"
    | "lainnya";
  limitKodeBA?: string | null;
  kdkanwil?: string | null;
  kdkppn?: string | null;
  nmkanwil?: string | null;
  nmkppn?: string | null;
  status: "active" | "disabled";
  createdAt: string;
}

// API response interfaces
interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Authentication client using server-side validation only
 * HTTP-only cookies are handled automatically by the browser
 */
export class AuthClient {
  private baseURL: string;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
  }

  /**
   * Login with username and password
   * SECURITY FIX: Reads CSRF token from response headers (not accessible to JavaScript)
   * Cookies are set automatically by the server
   */
  async login(
    username: string,
    password: string,
    rememberMe = false,
    extras?: { captcha?: string; expectedCaptcha?: string },
  ): Promise<{
    success: boolean;
    user?: User;
    csrfToken?: string;
    error?: string;
  }> {
    try {
      const payload: Record<string, unknown> = {
        username,
        password,
        rememberMe,
      };

      if (extras?.captcha) {
        payload.captcha = extras.captcha;
      }
      if (extras?.expectedCaptcha) {
        payload.expectedCaptcha = extras.expectedCaptcha;
      }

      const response = await fetch(apiPath(`${this.baseURL}/auth/login`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Source": "authClient.login",
          "X-Debug-Trace": (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8)).toUpperCase(),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data: AuthResponse<{ user: User; csrfToken: string }> =
        await response.json();

      logger.info("[Auth Client] Raw login response:", {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok && data.success && data.data) {
        logger.info("Login successful");
        logger.info("[Auth Client] Parsed user data:", data.data.user);

        // SECURITY FIX: Extract CSRF token from response headers
        // This is more secure than cookies because headers are not accessible to JavaScript
        const csrfTokenFromHeader = response.headers.get("X-CSRF-Token");
        const csrfToken = csrfTokenFromHeader || data.data.csrfToken; // Fallback to body for backwards compatibility

        logger.info("[Auth Client] CSRF token extracted:", {
          fromHeader: !!csrfTokenFromHeader,
          fromBody: !!data.data.csrfToken,
          method: csrfTokenFromHeader ? "header" : "body",
        });

        // Reset any stale logout guard that could block follow-up requests
        try { clearLogoutGuard(); } catch {}
        // Enter post-login grace window to avoid refresh/401 races
        // Extend post-login grace a bit to avoid premature refresh/logout flapping under slow networks
        try { setPostLoginGrace(4000); } catch {}

        return {
          success: true,
          user: data.data.user,
          csrfToken,
        };
      } else {
        const error = data.error || data.message || "Login failed";
        logger.warn("Login failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Logout user
   * SECURITY FIX: No longer needs to read CSRF token from cookies (header is preferred)
   * Cookies are cleared automatically by the server
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // SECURITY FIX: No longer reading CSRF token from document.cookie
      // The backend now sets CSRF token in response headers
      // We send CSRF token in header for logout request

      // Try to get CSRF token from session storage (set by login response)
      // This is more secure than reading from document.cookie
      let csrfToken: string | null = null;
      if (typeof window !== 'undefined') {
        csrfToken = sessionStorage.getItem('csrf_token');
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Send CSRF token in header (preferred method)
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
        logger.debug("[Auth Client] Using CSRF token from sessionStorage");
      }

      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: "POST",
        headers: {
          ...headers,
          "X-Debug-Source": "authClient.logout",
          "X-Debug-Trace": (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8)).toUpperCase(),
        },
        credentials: "include",
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success) {
        logger.info("Logout successful");
        // Clear CSRF token from session storage on successful logout
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('csrf_token');
        }
        return { success: true };
      } else {
        const error = data.error || data.message || "Logout failed";
        logger.warn("Logout failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("Logout error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Get current user from server
   * Uses HTTP-only cookies for authentication with automatic refresh
   */
  async getCurrentUser(): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const response = await http.get(`${this.baseURL}/auth/me`);
      const data: AuthResponse<User | { user: User }> = response.data;

      if (response.status === 200 && data.success && data.data) {
        const user = "user" in data.data ? data.data.user : data.data;
        return { success: true, user };
      } else {
        const error = data.error || data.message || "Failed to get user";
        logger.warn("Get user failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("Get user error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<{
    success: boolean;
    valid?: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const response = await http.get(
        `${this.baseURL}/auth/validate?include=user`
      );

      const data: AuthResponse<{ valid: boolean; user: User }> =
        response.data;

      if (response.status === 200 && data.success && data.data) {
        return {
          success: true,
          valid: data.data.valid,
          user: data.data.user,
        };
      } else {
        const error = data.error || data.message || "Validation failed";
        logger.warn("Session validation failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("Session validation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Get CSRF token
   * SECURITY FIX: Returns CSRF token from sessionStorage (more secure than cookies)
   */
  async getCSRFToken(): Promise<{
    success: boolean;
    csrfToken?: string;
    error?: string;
  }> {
    try {
      // SECURITY FIX: First try to get CSRF token from sessionStorage
      // This is populated from login response headers
      if (typeof window !== 'undefined') {
        const csrfToken = sessionStorage.getItem('csrf_token');
        if (csrfToken) {
          logger.debug("[Auth Client] CSRF token retrieved from sessionStorage");
          return { success: true, csrfToken };
        }
      }

      // Fallback: Fetch new CSRF token from server
      logger.debug("[Auth Client] CSRF token not in sessionStorage, fetching from server");
      const response = await fetch(`${this.baseURL}/auth/csrf`, {
        method: "GET",
        credentials: "include",
      });

      const data: AuthResponse<{ csrfToken: string }> = await response.json();

      if (response.ok && data.success && data.data) {
        // Store in sessionStorage for future use
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('csrf_token', data.data.csrfToken);
        }
        return { success: true, csrfToken: data.data.csrfToken };
      } else {
        const error = data.error || data.message || "Failed to get CSRF token";
        logger.warn("CSRF token fetch failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("CSRF token error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Helper to get CSRF token for API calls
   * SECURITY FIX: Returns token from sessionStorage (secure storage)
   */
  getCSRFTokenForRequests(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return sessionStorage.getItem('csrf_token');
  }
}

// Create singleton instance
export const authClient = new AuthClient();

// Export types
export type { AuthResponse };
export type { User as AuthUser };

export default authClient;
