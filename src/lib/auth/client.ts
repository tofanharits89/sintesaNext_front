/**
 * Consolidated Authentication Client
 * Server-side token validation only - no client-side cookie access
 * Secure HTTP-only cookie implementation with automatic token refresh
 */

import { logger } from "../utils/logger";
import { primeCSRFToken, attachCSRFToken } from "../security/csrfManager";

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
  | "ditpa"
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
  message?: string | Record<string, unknown>;
  error?: string | Record<string, unknown>;
}

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
    const nestedError = (error as { error?: unknown }).error;
    if (typeof nestedError === "string" && nestedError.trim()) return nestedError;
    if (nestedError && typeof nestedError === "object") {
      const nestedMessage = (nestedError as { message?: unknown }).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }
    }
  }
  return fallback;
}

function localizeAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase().trim();
  if (!normalized) return message;

  const mappings: Array<[RegExp, string]> = [
    [/invalid credentials|invalid username|invalid password|wrong password/i, "Username atau password salah"],
    [/captcha/i, "Captcha tidak valid"],
    [/too many attempts|rate limit|too many requests/i, "Terlalu banyak percobaan login. Silakan coba lagi nanti"],
    [/account disabled|user disabled|inactive/i, "Akun dinonaktifkan"],
    [/unauthorized|authentication failed|auth failed/i, "Autentikasi gagal"],
  ];

  for (const [pattern, localized] of mappings) {
    if (pattern.test(message)) {
      return localized;
    }
  }

  return message;
}

/**
 * Authentication client using server-side validation only
 * HTTP-only cookies are handled automatically by the browser
 */
export class AuthClient {
  private baseURL: string;

  constructor(baseURL: string = "/api/v1") {
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
    extras?: { captcha?: string },
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

      // Use fully-qualified versioned path directly to avoid double-prefixing
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Source": "authClient.login",
          "X-Debug-Trace": (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)).toUpperCase(),
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

        // Extract CSRF token from response headers (set by backend in login.controller.ts:124)
        // Also fallback to response body for backward compatibility
        const csrfTokenFromHeader = response.headers.get("X-CSRF-Token");
        const csrfToken = csrfTokenFromHeader || data.data.csrfToken;

        logger.info("[Auth Client] CSRF token extracted:", {
          fromHeader: !!csrfTokenFromHeader,
          fromBody: !!data.data.csrfToken,
          method: csrfTokenFromHeader ? "header" : "body",
        });

        // Prime in-memory CSRF cache
        if (csrfToken) {
          try {
            primeCSRFToken(csrfToken);
          } catch (err) {
            logger.warn("[Auth Client] Failed to prime CSRF cache", err);
          }
        }

        return {
          success: true,
          user: data.data.user,
          csrfToken,
        };
      } else {
        const error = localizeAuthErrorMessage(
          normalizeErrorMessage(data.error || data.message, "Login failed")
        );
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
   * SECURITY FIX: Attach CSRF token to prevent CSRF validation failures
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Prepare headers and attach CSRF token
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Debug-Source": "authClient.logout",
        "X-Debug-Trace": (
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 8)
        ).toUpperCase(),
      };

      // Attach CSRF token to prevent CSRF validation failures
      await attachCSRFToken(headers);

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
        const error = localizeAuthErrorMessage(
          normalizeErrorMessage(data.error || data.message, "Logout failed")
        );
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

}

// Create singleton instance
export const authClient = new AuthClient();

export type { User as AuthUser };

export default authClient;
