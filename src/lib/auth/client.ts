/**
 * Consolidated Authentication Client
 * Server-side token validation only - no client-side cookie access
 * Secure HTTP-only cookie implementation with automatic token refresh
 */

import { logger } from "@/lib/utils";
import { http, clearLogoutGuard } from "../httpClient";
import { apiPath } from "../base-path";

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
   * Cookies are set automatically by the server
   */
  async login(
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<{
    success: boolean;
    user?: User;
    csrfToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(apiPath(`${this.baseURL}/auth/login`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password, rememberMe }),
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
        // Reset any stale logout guard that could block follow-up requests
        try { clearLogoutGuard(); } catch {}
        return {
          success: true,
          user: data.data.user,
          csrfToken: data.data.csrfToken,
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
   * Cookies are cleared automatically by the server
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get CSRF token from cookie for logout request
      const getCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };
      
      const csrfToken = getCookie('XSRF-TOKEN');
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success) {
        logger.info("Logout successful");
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
   * Refresh access token
   */
  async refreshToken(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success) {
        logger.info("Token refreshed successfully");
        return { success: true };
      } else {
        const error = data.error || data.message || "Token refresh failed";
        logger.warn("Token refresh failed:", error);
        return { success: false, error };
      }
    } catch (error) {
      logger.error("Token refresh error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Get CSRF token
   */
  async getCSRFToken(): Promise<{
    success: boolean;
    csrfToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/csrf`, {
        method: "GET",
        credentials: "include",
      });

      const data: AuthResponse<{ csrfToken: string }> = await response.json();

      if (response.ok && data.success && data.data) {
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
}

// Create singleton instance
export const authClient = new AuthClient();

// Export convenience functions
export const login = (
  username: string,
  password: string,
  rememberMe?: boolean,
) => authClient.login(username, password, rememberMe);

export const logout = () => authClient.logout();
export const getCurrentUser = () => authClient.getCurrentUser();
export const validateSession = () => authClient.validateSession();
export const refreshToken = () => authClient.refreshToken();
export const getCSRFToken = () => authClient.getCSRFToken();

// Export types
export type { AuthResponse };
export type { User as AuthUser };

export default authClient;
