/**
 * Simplified reconnection logic for socket connections
 * Focuses on business-specific needs: token refresh, network monitoring, and cross-tab coordination
 * Lets Socket.IO handle basic reconnection patterns
 */

import { toast } from "sonner";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { logger } from "@/lib/utils";

// Helper function to check if we're on login page
const isLoginPage = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/login');
};

// Configuration for business-specific reconnection features
const RECONNECTION_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes before expiry
  NETWORK_CHECK_INTERVAL: 5000, // 5 seconds
};

// Connection states
type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

// Network state tracking
interface NetworkState {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  lastChanged: number;
}

/**
 * Simplified reconnection manager
 * Focuses on business logic while letting Socket.IO handle basic reconnection
 */
export class ReconnectionManager {
  private socket: any = null;
  private connectionState: ConnectionState = "disconnected";
  private networkCheckTimer: NodeJS.Timeout | null = null;
  private networkState: NetworkState = {
    online: typeof window !== "undefined" ? navigator.onLine : true,
    lastChanged: Date.now(),
  };
  private tabId: string;
  private isActiveTab: boolean = true;
  private tokenExpiryTimer: NodeJS.Timeout | null = null;
  
  // Track toast IDs to dismiss/update on state changes
  private disconnectToastId: string | number | null = null;
  private networkOfflineToastId: string | number | null = null;

  // Event listeners
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onTokenRefreshNeeded?: () => void;

  constructor(
    options: {
      onConnectionStateChange?: (state: ConnectionState) => void;
      onTokenRefreshNeeded?: () => void;
    } = {}
  ) {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Provide no-op defaults to satisfy exactOptionalPropertyTypes
    this.onConnectionStateChange = options.onConnectionStateChange ?? (() => {});
    this.onTokenRefreshNeeded = options.onTokenRefreshNeeded ?? (() => {});

    this.setupEventListeners();
    this.startNetworkMonitoring();
    this.setupTabVisibilityHandling();
  }

  /**
   * Set the socket instance
   */
  setSocket(socket: any) {
    this.socket = socket;
    this.setupSocketEventListeners();
  }

  /**
   * Setup browser event listeners
   */
  private setupEventListeners() {
    // Only setup event listeners in browser environment
    if (typeof window === "undefined") return;

    // Network state changes
    window.addEventListener("online", this.handleNetworkOnline.bind(this));
    window.addEventListener("offline", this.handleNetworkOffline.bind(this));

    // Page visibility changes
    if (typeof document !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange.bind(this)
      );
    }

    // Before page unload
    window.addEventListener("beforeunload", this.handleBeforeUnload.bind(this));

    // Storage events for cross-tab coordination
    window.addEventListener("storage", this.handleStorageEvent.bind(this));
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", this.handleSocketConnect.bind(this));
    this.socket.on("disconnect", this.handleSocketDisconnect.bind(this));
    this.socket.on("connect_error", this.handleSocketError.bind(this));
  }

  /**
   * Handle socket connection
   */
  private handleSocketConnect() {
    this.setConnectionState("connected");
    this.scheduleTokenRefresh();

    // Dismiss any disconnection/network toasts on successful connect
    if (this.disconnectToastId !== null) {
      try { toast.dismiss(this.disconnectToastId); } catch {}
      this.disconnectToastId = null;
    }
    if (this.networkOfflineToastId !== null) {
      try { toast.dismiss(this.networkOfflineToastId); } catch {}
      this.networkOfflineToastId = null;
    }

    if (!isLoginPage()) {
      toast.success("Connected", {
        description: "Connection established successfully",
      });
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleSocketDisconnect(reason: string) {
    this.setConnectionState("disconnected");

    // Only show toast for unexpected disconnections (and not on login page)
    if (reason !== "io client disconnect" && !isLoginPage()) {
      const id = toast.warning("Disconnected", {
        description: "Attempting to reconnect...",
      });
      this.disconnectToastId = id;
    }
  }

  /**
   * Handle socket connection error
   */
  private handleSocketError(error: any) {
    logger.error("Socket connection error", error);

    // Check if it's a token expiry error
    if (error.message?.includes("token") || error.message?.includes("auth")) {
      this.handleTokenExpiry();
    }
  }

  /**
   * Handle network online event
   */
  private handleNetworkOnline() {
    this.updateNetworkState({ online: true });

    // Dismiss offline toast if present
    if (this.networkOfflineToastId !== null) {
      try { toast.dismiss(this.networkOfflineToastId); } catch {}
      this.networkOfflineToastId = null;
    }

    if (!isLoginPage()) {
      toast.success("Network online", { description: "Connection restored" });
    }
  }

  /**
   * Handle network offline event
   */
  private handleNetworkOffline() {
    this.updateNetworkState({ online: false });

    if (!isLoginPage()) {
      const id = toast.warning("Network offline", {
        description: "Connection will resume when network is available",
      });
      this.networkOfflineToastId = id;
    }
  }

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange() {
    this.isActiveTab =
      typeof document !== "undefined" ? !document.hidden : true;

    if (this.isActiveTab) {
      // Tab became active, check token expiry
      this.checkAndRefreshToken().catch(error => logger.error("Token refresh failed on tab focus", error));
    }
  }

  /**
   * Handle before page unload
   */
  private handleBeforeUnload() {
    this.cleanup();
  }

  /**
   * Handle storage events for cross-tab coordination
   */
  private handleStorageEvent(event: StorageEvent) {
    if (event.key === "socket_token_refresh") {
      // Another tab refreshed the token
      if (event.newValue && this.socket) {
        // Reconnect with new token
        this.socket.disconnect();
        this.socket.connect();
      }
    }
  }

  /**
   * Handle token expiry
   */
  private async handleTokenExpiry() {
    logger.debug("Token expired, attempting refresh...");

    try {
      // Try to refresh token
      await this.refreshAuthToken();

      // Notify other tabs about token refresh
      if (typeof window !== "undefined") {
        localStorage.setItem("socket_token_refresh", Date.now().toString());
        localStorage.removeItem("socket_token_refresh");
      }

      // Notify callback if provided
      if (this.onTokenRefreshNeeded) {
        this.onTokenRefreshNeeded();
      }

      // Reconnect with new token
      if (this.socket) {
        this.socket.disconnect();
        this.socket.connect();
      }
    } catch (error) {
      logger.error("Token refresh failed", error);

      // Redirect to login
      if (!isLoginPage()) {
        toast.error("Session expired", {
          description: "Please log in again",
          action: {
            label: "Login",
            onClick: () => (window.location.href = "/login"),
          },
        });
      }
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<void> {
    // Use same-origin Next API with base path helper; it proxies to backend and forwards cookies
    const { apiPath } = await import("@/lib/base-path");
    const response = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }
  }

  /**
   * Check and refresh token if needed
   */
  private async checkAndRefreshToken(): Promise<void> {
    const token = getAuthTokenFromCookie();

    if (!token) {
      // No token available - user might not be logged in
      // This is not necessarily an error, just log it for debugging
      logger.debug("No auth token available - user may not be logged in");
      return;
    }

    // Check token expiry (if you can decode it)
    try {
      const parts = token.split(".");
      if (parts.length !== 3 || parts[1] === undefined) {
        throw new Error("Invalid token format");
      }
      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000;
      const now = Date.now();

      if (expiryTime - now < RECONNECTION_CONFIG.TOKEN_REFRESH_THRESHOLD) {
        await this.refreshAuthToken();
      }
    } catch (error) {
      // Token parsing failed, assume it's valid
      logger.warn("Could not parse token for expiry check");
    }
  }

  /**
   * Schedule token refresh
   */
  private scheduleTokenRefresh() {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }

    // Schedule refresh 5 minutes before expiry
    this.tokenExpiryTimer = setTimeout(() => {
      this.checkAndRefreshToken().catch(error => logger.error("Scheduled token refresh failed", error));
    }, RECONNECTION_CONFIG.TOKEN_REFRESH_THRESHOLD);
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring() {
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
    }

    this.networkCheckTimer = setInterval(() => {
      this.updateNetworkInfo();
    }, RECONNECTION_CONFIG.NETWORK_CHECK_INTERVAL);
  }

  /**
   * Update network information
   */
  private updateNetworkInfo() {
    if (typeof window !== "undefined") {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        this.updateNetworkState({
          online: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      } else {
        this.updateNetworkState({ online: navigator.onLine });
      }
    }
  }

  /**
   * Update network state
   */
  private updateNetworkState(updates: Partial<NetworkState>) {
    const hasChanged = updates.online !== this.networkState.online;

    this.networkState = {
      ...this.networkState,
      ...updates,
      lastChanged: hasChanged ? Date.now() : this.networkState.lastChanged,
    };
  }

  /**
   * Setup tab visibility handling
   */
  private setupTabVisibilityHandling() {
    // Only setup in browser environment
    if (typeof window === "undefined") return;

    // Handle tab focus/blur for token management
    window.addEventListener("focus", () => {
      this.isActiveTab = true;
      // Check token when tab becomes active
      this.checkAndRefreshToken().catch((error) => {
        // Import logger locally to avoid circular dependencies
        if (process.env.NODE_ENV === 'development') {
          logger.error('Token refresh error:', error);
        }
      });
    });

    window.addEventListener("blur", () => {
      this.isActiveTab = false;
    });
  }

  /**
   * Set connection state
   */
  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      connectionState: this.connectionState,
      networkState: this.networkState,
      isActiveTab: this.isActiveTab,
      tabId: this.tabId,
    };
  }

  /**
   * Force token refresh
   */
  forceTokenRefresh() {
    this.checkAndRefreshToken().catch(error => logger.error("Force token refresh failed", error));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
    }

    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }
  }
}

// Export singleton instance
export const reconnectionManager = new ReconnectionManager();
