/**
 * Token Refresh Manager
 * Enterprise-grade proactive token refresh management
 */

import {
  ITokenRefreshManager,
  TokenRefreshEvent,
  TokenRefreshOptions
} from "../types";
import Logger from "../utils/Logger";
import {
  emitTokenRefreshStart,
  emitTokenRefreshSuccess,
  emitTokenRefreshError,
  authEventCoordinator
} from "../../auth-event-coordinator";

export class TokenRefreshManager implements ITokenRefreshManager {
  private checkInterval: NodeJS.Timeout | null = null;
  private pageVisibilityListener: (() => void) | null = null;
  private refreshListeners: Set<(event: TokenRefreshEvent) => void> = new Set();
  private lastRefreshAttempt = 0;
  private refreshCount = 0;
  private refreshErrors = 0;
  private options: Required<TokenRefreshOptions>;
  private logger: Logger;
  private isRunning = false;

  // Token refresh lock mechanism
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (result: boolean) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private readonly REFRESH_LOCK_TIMEOUT = 15000; // 15 seconds max lock time
  private lockTimeout: NodeJS.Timeout | null = null;

  constructor(logger: Logger, options: TokenRefreshOptions = {}) {
    this.logger = logger;
    this.options = {
      checkInterval: options.checkInterval || 2 * 60 * 1000, // 2 minutes
      refreshThreshold: options.refreshThreshold || 5 * 60, // 5 minutes
      maxRetries: options.maxRetries || 3,
    };

    this.logger.debug("TokenRefreshManager initialized", this.options);
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn("TokenRefreshManager already running");
      return;
    }

    this.isRunning = true;
    this.startPeriodicCheck();
    this.setupPageVisibilityHandling();
    this.logger.info("TokenRefreshManager started", { options: this.options });
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.stopPeriodicCheck();
    this.removePageVisibilityHandling();
    this.logger.info("TokenRefreshManager stopped");
  }

  async checkAndRefresh(): Promise<boolean> {
    if (!this.isRunning) {
      this.logger.debug("TokenRefreshManager not running, skipping check");
      return false;
    }

    try {
      const token = this.getAuthToken();
      if (!token) {
        this.logger.debug("No auth token available");
        return false;
      }

      if (this.isTokenExpiringSoon(token)) {
        return await this.performTokenRefreshWithLock();
      }

      return true;
    } catch (error: unknown) {
      this.logger.error("Token check failed", { error });
      return false;
    }
  }

  isTokenExpiringSoon(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.warn("Invalid token format", { partsLength: parts.length });
        return false;
      }

      const payload = JSON.parse(atob(parts[1] || ""));
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;

      if (!expirationTime) {
        this.logger.warn("Token has no expiration time");
        return false;
      }

      const timeUntilExpiration = expirationTime - now;
      const isExpiringSoon = timeUntilExpiration <= this.options.refreshThreshold;

      this.logger.debug("Token expiration check", {
        expiresAt: new Date(expirationTime * 1000).toISOString(),
        timeUntilExpiration: `${timeUntilExpiration}s`,
        threshold: `${this.options.refreshThreshold}s`,
        isExpiringSoon
      });

      return isExpiringSoon;
    } catch (error: unknown) {
      this.logger.error("Error checking token expiration", { error });
      return false;
    }
  }

  onRefresh(callback: (event: TokenRefreshEvent) => void): () => void {
    this.refreshListeners.add(callback);

    // Return cleanup function
    return () => {
      this.refreshListeners.delete(callback);
    };
  }

  getRefreshStats(): {
    lastRefreshAttempt: number;
    refreshCount: number;
    refreshErrors: number;
    successRate: number;
  } {
    const successRate = this.refreshCount > 0
      ? ((this.refreshCount - this.refreshErrors) / this.refreshCount) * 100
      : 0;

    return {
      lastRefreshAttempt: this.lastRefreshAttempt,
      refreshCount: this.refreshCount,
      refreshErrors: this.refreshErrors,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkAndRefresh();
    }, this.options.checkInterval);

    this.logger.debug("Periodic token check started", {
      interval: `${this.options.checkInterval}ms`
    });
  }

  private stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.logger.debug("Periodic token check stopped");
    }
  }

  private setupPageVisibilityHandling(): void {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = async () => {
      if (!document.hidden && this.isRunning) {
        this.logger.debug("Page became visible, checking token");
        await this.checkAndRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    this.pageVisibilityListener = handleVisibilityChange;

    this.logger.debug("Page visibility handling setup");
  }

  private removePageVisibilityHandling(): void {
    if (this.pageVisibilityListener && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.pageVisibilityListener);
      this.pageVisibilityListener = null;
      this.logger.debug("Page visibility handling removed");
    }
  }

  private getAuthToken(): string | null {
    // Try to get token from cookie first
    const cookies = document?.cookie || "";
    const tokenMatch = cookies.match(/accessToken=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      return decodeURIComponent(tokenMatch[1]);
    }

    // Fallback to localStorage if available
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("accessToken");
      }
    } catch (error: unknown) {
      this.logger.debug("localStorage access failed", { error });
    }

    return null;
  }

  private async performTokenRefreshWithLock(): Promise<boolean> {
    // If already refreshing, queue this request and wait for the result
    if (this.isRefreshing) {
      this.logger.debug("Token refresh already in progress, queuing request");
      return new Promise<boolean>((resolve, reject) => {
        this.refreshQueue.push({
          resolve,
          reject,
          timestamp: Date.now()
        });
      });
    }

    // Acquire the refresh lock
    this.isRefreshing = true;
    this.refreshQueue = []; // Clear any stale queue entries

    // Set a timeout to prevent the lock from being held indefinitely
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }
    this.lockTimeout = setTimeout(() => {
      this.logger.warn("Token refresh lock timeout, releasing lock");
      this.releaseRefreshLock();
    }, this.REFRESH_LOCK_TIMEOUT);

    try {
      const result = await this.performTokenRefresh();
      this.releaseRefreshLock();
      return result;
    } catch (error) {
      this.releaseRefreshLock();
      throw error;
    }
  }

  private releaseRefreshLock(): void {
    if (!this.isRefreshing) {
      return; // Lock already released
    }

    // Clear lock timeout
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }

    // Release the lock
    this.isRefreshing = false;

    // Process queued requests (they should get the same result as the current refresh)
    const queuedRequests = this.refreshQueue.splice(0);
    if (queuedRequests.length > 0) {
      this.logger.debug(`Processing ${queuedRequests.length} queued token refresh requests`);
      
      // For queued requests, we can just check if the token is valid now
      // rather than performing another refresh immediately
      const token = this.getAuthToken();
      const isValid = token && !this.isTokenExpiringSoon(token);
      
      queuedRequests.forEach(({ resolve, reject, timestamp }) => {
        const waitTime = Date.now() - timestamp;
        this.logger.debug(`Resolving queued refresh request after ${waitTime}ms`, { isValid });
        
        if (isValid) {
          resolve(true);
        } else {
          reject(new Error("Token still invalid after refresh"));
        }
      });
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    this.lastRefreshAttempt = Date.now();
    this.refreshCount++;

    // Set flag to indicate refresh operation is in progress
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token_refresh_in_progress', 'true');
    }

    // Emit refresh start event for coordination
    await emitTokenRefreshStart({
      attemptCount: this.refreshCount,
      timestamp: this.lastRefreshAttempt
    });

    this.logger.info("Attempting token refresh", {
      attemptCount: this.refreshCount,
      timestamp: new Date(this.lastRefreshAttempt).toISOString(),
    });

    try {
      // Add a unique request ID to track this refresh attempt
      const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Refresh-Request-Id": requestId, // Track refresh requests
          "X-Client-Version": "1.0.0", // Help with debugging
        },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        this.logger.info("Token refresh successful", {
          attemptCount: this.refreshCount,
          responseStatus: response.status,
          requestId,
        });

        const event: TokenRefreshEvent = {
          success: true,
          timestamp: Date.now(),
        };

        this.notifyRefresh(event);

        // Emit success event for coordination
        await emitTokenRefreshSuccess({
          attemptCount: this.refreshCount,
          responseStatus: response.status,
          requestId
        });

        // Wait a brief moment for cookies to be properly set
        await new Promise(resolve => setTimeout(resolve, 50));

        return true;
      } else {
        const errorText = await response.text();
        this.logger.error("Token refresh failed", {
          attemptCount: this.refreshCount,
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
          requestId,
        });

        this.refreshErrors++;
        const event: TokenRefreshEvent = {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now(),
        };

        this.notifyRefresh(event);

        // Emit error event for coordination
        await emitTokenRefreshError({
          attemptCount: this.refreshCount,
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
          requestId
        });

        // If it's a 401, try to clear the auth state and redirect to login
        if (response.status === 401) {
          this.logger.warn("Token refresh returned 401, authentication fully expired");
          // Dispatch auth expired event for listeners to handle
          window.dispatchEvent(new CustomEvent('auth:expired', {
            detail: { reason: 'token_refresh_failed', status: 401 }
          }));
        }

        return false;
      }
    } catch (error: unknown) {
      this.refreshErrors++;
      this.logger.error("Token refresh error", {
        attemptCount: this.refreshCount,
        error: error instanceof Error ? error.message : String(error),
      });

      const event: TokenRefreshEvent = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      };

      this.notifyRefresh(event);
      return false;
    } finally {
      // Always clear the refresh in progress flag
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token_refresh_in_progress');
      }
    }
  }

  private notifyRefresh(event: TokenRefreshEvent): void {
    this.refreshListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error: unknown) {
        this.logger.error("Token refresh listener error", { error, event });
      }
    });
  }

  cleanup(): void {
    this.stop();
    this.refreshListeners.clear();
    
    // Clean up refresh lock
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }
    this.isRefreshing = false;
    this.refreshQueue = [];
    
    this.lastRefreshAttempt = 0;
    this.refreshCount = 0;
    this.refreshErrors = 0;
    this.logger.debug("TokenRefreshManager cleaned up");
  }
}

export default TokenRefreshManager;