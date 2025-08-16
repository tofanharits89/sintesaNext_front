/**
 * Simplified Authentication Recovery System
 *
 * Provides core recovery strategies for socket authentication:
 * - Token refresh via API
 * - localStorage fallback
 * - sessionStorage fallback
 */

import { toast } from "sonner";
import { parse } from "cookie";

// Simplified types for authentication recovery
export interface AuthToken {
  value: string;
  source: "cookie" | "localStorage" | "sessionStorage";
  expiresAt?: number;
}

export interface RecoveryResult {
  success: boolean;
  token?: AuthToken;
  strategy?: string;
  error?: string;
}

export interface AuthRecoveryOptions {
  apiBaseUrl?: string;
  maxRetryAttempts?: number;
  debugMode?: boolean;
}

/**
 * Simplified Authentication Recovery Manager
 * Focuses on core recovery strategies without complex session management
 */
export class AuthRecoveryClient {
  private options: Required<AuthRecoveryOptions>;
  private refreshPromise: Promise<RecoveryResult> | null = null;
  private retryCount = 0;

  constructor(options: AuthRecoveryOptions = {}) {
    this.options = {
      apiBaseUrl:
        options.apiBaseUrl ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:88/api/v1",
      maxRetryAttempts: options.maxRetryAttempts || 3,
      debugMode: options.debugMode ?? process.env.NODE_ENV === "development",
    };
  }

  /**
   * Main recovery method - attempts recovery strategies in order
   */
  async recoverAuthentication(error?: any): Promise<RecoveryResult> {
    // Check retry limits
    if (this.retryCount >= this.options.maxRetryAttempts) {
      this.retryCount = 0; // Reset for next time
      return {
        success: false,
        error: "Maximum recovery attempts exceeded",
      };
    }

    this.retryCount++;
    this.log("Starting authentication recovery", {
      attempt: this.retryCount,
      error: error?.message,
    });

    try {
      // Strategy 1: Token refresh if refresh token available
      if (this.hasRefreshToken()) {
        this.log("Attempting token refresh");
        const refreshResult = await this.attemptTokenRefresh();
        if (refreshResult.success) {
          this.retryCount = 0; // Reset on success
          return refreshResult;
        }
      }

      // Strategy 2: localStorage fallback
      const localStorageResult = this.attemptLocalStorageFallback();
      if (localStorageResult.success) {
        this.retryCount = 0; // Reset on success
        return localStorageResult;
      }

      // Strategy 3: sessionStorage fallback
      const sessionStorageResult = this.attemptSessionStorageFallback();
      if (sessionStorageResult.success) {
        this.retryCount = 0; // Reset on success
        return sessionStorageResult;
      }

      // All strategies failed
      return {
        success: false,
        error: "All recovery strategies failed",
      };
    } catch (recoveryError) {
      this.logError("Recovery attempt failed", recoveryError);
      return {
        success: false,
        error:
          recoveryError instanceof Error
            ? recoveryError.message
            : "Unknown recovery error",
      };
    }
  }

  /**
   * Attempt to refresh the access token
   */
  private async attemptTokenRefresh(): Promise<RecoveryResult> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      this.log("Token refresh already in progress, waiting...");
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<RecoveryResult> {
    try {
      this.log("Performing token refresh");

      const response = await fetch(`${this.options.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Send httpOnly cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.accessToken) {
        const newToken: AuthToken = {
          value: data.data.accessToken,
          source: "cookie",
          expiresAt: data.data.expiresAt,
        };

        this.log("Token refresh successful");
        return {
          success: true,
          token: newToken,
          strategy: "TOKEN_REFRESH",
        };
      } else {
        throw new Error("Invalid refresh response format");
      }
    } catch (error) {
      this.logError("Token refresh failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  /**
   * Attempt to recover token from localStorage
   */
  private attemptLocalStorageFallback(): RecoveryResult {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return { success: false, error: "localStorage not available" };
      }

      const tokenKeys = ["accessToken", "authToken", "token"];

      for (const key of tokenKeys) {
        const tokenData = localStorage.getItem(key);
        if (tokenData) {
          const token = this.parseStoredToken(tokenData, "localStorage");
          if (token && this.isTokenValid(token)) {
            this.log("Token recovered from localStorage");
            return {
              success: true,
              token,
              strategy: "LOCALSTORAGE_FALLBACK",
            };
          }
        }
      }

      return { success: false, error: "No valid tokens in localStorage" };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "localStorage fallback failed",
      };
    }
  }

  /**
   * Attempt to recover token from sessionStorage
   */
  private attemptSessionStorageFallback(): RecoveryResult {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) {
        return { success: false, error: "sessionStorage not available" };
      }

      const tokenKeys = ["accessToken", "authToken", "token"];

      for (const key of tokenKeys) {
        const tokenData = sessionStorage.getItem(key);
        if (tokenData) {
          const token = this.parseStoredToken(tokenData, "sessionStorage");
          if (token && this.isTokenValid(token)) {
            this.log("Token recovered from sessionStorage");
            return {
              success: true,
              token,
              strategy: "SESSIONSTORAGE_FALLBACK",
            };
          }
        }
      }

      return { success: false, error: "No valid tokens in sessionStorage" };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "sessionStorage fallback failed",
      };
    }
  }

  /**
   * Check if refresh token is available
   */
  private hasRefreshToken(): boolean {
    if (typeof document === "undefined") return false;

    const cookies = parse(document.cookie || "");
    return !!(cookies.refreshToken || cookies.refresh_token);
  }

  /**
   * Parse stored token data
   */
  private parseStoredToken(
    tokenData: string,
    source: "localStorage" | "sessionStorage"
  ): AuthToken | null {
    try {
      // Try parsing as JSON first
      let tokenValue: string;
      try {
        const parsed = JSON.parse(tokenData);
        tokenValue =
          parsed.token || parsed.accessToken || parsed.value || tokenData;
      } catch {
        tokenValue = tokenData;
      }

      // Basic JWT format validation
      const parts = tokenValue.split(".");
      if (parts.length !== 3) {
        return null;
      }

      // Decode payload to get expiration
      const payload = JSON.parse(atob(parts[1]));

      return {
        value: tokenValue,
        source,
        expiresAt: payload.exp ? payload.exp * 1000 : undefined,
      };
    } catch (error) {
      this.logError(`Failed to parse stored token from ${source}`, error);
      return null;
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  private isTokenValid(token: AuthToken): boolean {
    if (!token.value) return false;

    // Check expiration
    if (token.expiresAt && token.expiresAt < Date.now()) {
      this.log(`Token from ${token.source} is expired`);
      return false;
    }

    return true;
  }

  /**
   * Reset retry counter (call after successful connection)
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Check if recovery is possible
   */
  canAttemptRecovery(): boolean {
    return this.retryCount < this.options.maxRetryAttempts;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  private log(message: string, data?: any): void {
    if (this.options.debugMode) {
      console.log(`🔄 [AUTH-RECOVERY] ${message}`, data || "");
    }
  }

  private logError(message: string, data?: any): void {
    console.error(`❌ [AUTH-RECOVERY] ${message}`, data || "");
  }
}

// Export singleton instance for easy use
export const authRecoveryClient = new AuthRecoveryClient();

/**
 * Simple helper function for SocketClient integration
 */
export async function recoverSocketAuthentication(
  error?: any
): Promise<RecoveryResult> {
  const result = await authRecoveryClient.recoverAuthentication(error);

  // Show user feedback only for final failures
  if (!result.success && !authRecoveryClient.canAttemptRecovery()) {
    toast.error("Authentication Failed", {
      description: "Please refresh the page and log in again",
      duration: 5000,
    });
  }

  return result;
}
