/**
 * Session Manager
 * Enterprise-grade session lifecycle and expiration handling
 */

import Logger from "../utils/Logger";

export interface SessionExpiredPayload {
  reason: string;
  displayMessage?: string;
  userId?: string;
  timestamp?: number;
}

export interface SessionManagerOptions {
  onSessionExpired?: (payload: SessionExpiredPayload) => void;
  onLogout?: (reason: string) => void;
  onTokenRefreshRequired?: () => Promise<boolean>;
}

/**
 * Manages session lifecycle, expiration, and logout flows
 */
export class SessionManager {
  private logger: Logger;
  private options: SessionManagerOptions;
  private isHandlingExpiration = false;

  constructor(logger: Logger, options: SessionManagerOptions = {}) {
    this.logger = logger;
    this.options = options;
    this.logger.debug("SessionManager initialized");
  }

  /**
   * Handle session expiration with intelligent recovery
   */
  async handleSessionExpired(payload: SessionExpiredPayload): Promise<void> {
    // Prevent concurrent expiration handling
    if (this.isHandlingExpiration) {
      this.logger.debug("Session expiration already being handled");
      return;
    }

    this.isHandlingExpiration = true;

    try {
      this.logger.info("Session expired event received", payload);

      const reason = payload.reason || "Session expired";
      const isLoggedInElsewhere = reason === "LOGGED_IN_ELSEWHERE";

      // Immediate logout for explicit logout from another device
      if (isLoggedInElsewhere) {
        this.logger.info(
          "User logged in from another device, performing immediate logout"
        );
        await this.performLogout(reason, payload);
        return;
      }

      // For normal session expiry, attempt token refresh first
      await this.attemptRecoveryOrLogout(payload);
    } finally {
      this.isHandlingExpiration = false;
    }
  }

  /**
   * Attempt session recovery via token refresh, or logout if failed
   */
  private async attemptRecoveryOrLogout(
    payload: SessionExpiredPayload
  ): Promise<void> {
    this.logger.info("Attempting session recovery via token refresh", payload);

    try {
      // Try to refresh the token
      const refreshSuccess = await this.options.onTokenRefreshRequired?.();

      if (refreshSuccess) {
        this.logger.info("Session recovered successfully via token refresh");
        return;
      }

      this.logger.warn("Token refresh failed, proceeding with logout");
      await this.performLogout("TOKEN_REFRESH_FAILED", payload);
    } catch (error: unknown) {
      this.logger.error("Error during session recovery attempt", error);
      await this.performLogout("TOKEN_REFRESH_ERROR", payload);
    }
  }

  /**
   * Perform logout with cleanup and redirection
   */
  async performLogout(
    reason: string,
    payload: SessionExpiredPayload
  ): Promise<void> {
    this.logger.info("Performing logout", { reason, payload });

    // Clear authentication cookies
    this.clearAuthCookies();

    // Notify session expired callback
    this.options.onSessionExpired?.(payload);

    // Notify logout callback
    this.options.onLogout?.(reason);

    // Dispatch DOM events for broader integration
    this.dispatchLogoutEvents(reason, payload);

    // Server-side logout and redirect
    await this.serverLogoutAndRedirect(reason);
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(): void {
    const cookiesToClear = ["accessToken", "refreshToken", "XSRF-TOKEN"];
    const hostname = window.location.hostname;

    cookiesToClear.forEach((name) => {
      // Clear for current domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
      
      // Also try without domain for localhost
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    this.logger.debug("Authentication cookies cleared");
  }

  /**
   * Dispatch logout-related DOM events
   */
  private dispatchLogoutEvents(
    reason: string,
    payload: SessionExpiredPayload
  ): void {
    if (typeof window === "undefined") return;

    try {
      window.dispatchEvent(
        new CustomEvent("socket:auth-required", { detail: payload })
      );

      window.dispatchEvent(
        new CustomEvent("auth:logout", { detail: { reason } })
      );

      this.logger.debug("Logout events dispatched", { reason });
    } catch (error: unknown) {
      this.logger.error("Failed to dispatch logout events", error);
    }
  }

  /**
   * Call server logout endpoint and redirect to login
   */
  private async serverLogoutAndRedirect(reason: string): Promise<void> {
    // Small delay to allow events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Call server logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      this.logger.debug("Server logout successful");
    } catch (error: unknown) {
      this.logger.error("Server logout failed", error);
      // Continue with redirect even if server logout fails
    }

    // Redirect to login page
    const redirectUrl = `/login?reason=${reason.toLowerCase()}`;
    this.logger.info("Redirecting to login", { redirectUrl });
    window.location.replace(redirectUrl);
  }

  /**
   * Check if currently on login page
   */
  isOnLoginPage(): boolean {
    return (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/login")
    );
  }

  /**
   * Validate session state
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/validate-session", {
        method: "GET",
        credentials: "include",
      });

      const isValid = response.ok;
      this.logger.debug("Session validation result", { isValid });
      return isValid;
    } catch (error: unknown) {
      this.logger.error("Session validation failed", error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.isHandlingExpiration = false;
    this.logger.debug("SessionManager cleaned up");
  }
}

export default SessionManager;
