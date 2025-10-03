/**
 * Enterprise-Grade Socket Client - Refactored Modular Architecture
 *
 * This is the main orchestrator that coordinates all socket-related functionality
 * through specialized managers while maintaining full backward compatibility.
 */

"use client";

import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { waitForAuthToken } from "@/utils/auth-utils";
import { SOCKET_EVENTS } from "@/shared/socket-events";
import {
  SocketState,
  SocketClientConfig,
  RequiredSocketClientConfig,
  ConnectionStats,
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES
} from "./types";
import Logger from "./utils/Logger";
import SocketManager from "./managers/SocketManager";
import ConnectionStateManager from "./managers/ConnectionStateManager";
import TokenRefreshManager from "./managers/TokenRefreshManager";
import EventManager from "./managers/EventManager";
import { authEventCoordinator } from "../auth-event-coordinator";

/**
 * Enterprise-Grade Socket Client
 * Orchestrates multiple specialized managers for socket operations
 */
export class SocketClient {
  // Configuration
  private config: RequiredSocketClientConfig;
  private logger: Logger;

  // Managers
  private socketManager: SocketManager;
  private stateManager: ConnectionStateManager;
  private tokenRefreshManager: TokenRefreshManager;
  private eventManager: EventManager;

  // State
  private connectionToastId: string | number | null = null;
  private isInitialized = false;
  private isDestroyed = false;

  constructor(config: SocketClientConfig = {}) {
    // Initialize configuration
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:88",
      path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      autoConnect: config.autoConnect ?? true,
      debug: config.debug ?? process.env.NODE_ENV === "development",
    };

    // Initialize logger
    this.logger = Logger.create({
      enabled: this.config.debug,
      level: this.config.debug ? "debug" : "info",
      prefix: "[SocketClient]"
    });

    // Initialize managers
    this.socketManager = new SocketManager(this.config, this.logger);
    this.stateManager = new ConnectionStateManager(this.logger);
    this.tokenRefreshManager = new TokenRefreshManager(this.logger);
    this.eventManager = new EventManager(this.logger);

    // Setup manager coordination
    this.setupManagerCoordination();

    // Setup auth event coordination
    this.setupAuthEventCoordination();

    // Auto-connect if enabled
    if (this.config.autoConnect && typeof window !== "undefined") {
      this.waitForAuthAndConnect();
    }

    this.isInitialized = true;
    this.logger.info("SocketClient initialized", {
      url: this.config.url,
      path: this.config.path,
      autoConnect: this.config.autoConnect,
    });
  }

  // Public API - Connection Management
  public async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new SocketClientError(
        "connection",
        SOCKET_CLIENT_ERROR_CODES.CONNECTION_FAILED,
        "SocketClient has been destroyed",
        false
      );
    }

    if (this.stateManager.getState() === "connected") {
      this.logger.debug("Already connected");
      return;
    }

    try {
      this.stateManager.setState("connecting", "Manual connection attempt");
      await this.socketManager.connect();
    } catch (error: unknown) {
      this.stateManager.setState("error", "Connection failed");
      this.handleConnectionError(error);
      throw error;
    }
  }

  public disconnect(): void {
    this.logger.info("Manual disconnect requested");

    this.tokenRefreshManager.stop();
    this.socketManager.disconnect();
    this.stateManager.setState("disconnected", "Manual disconnect");
    this.dismissConnectionToast();
  }

  public isConnected(): boolean {
    return this.socketManager.isConnected();
  }

  public getState(): SocketState {
    return this.stateManager.getState();
  }

  public getConnectionStats(): ConnectionStats {
    const socketStats = this.stateManager.getConnectionStats();
    const tokenStats = this.tokenRefreshManager.getRefreshStats();

    return {
      ...socketStats,
      // tokenRefreshStats is not part of ConnectionStats interface,
      // so we're not including it to avoid type errors
    };
  }

  // Public API - Event Handling
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventManager.addListener(event, listener);
  }

  public off(event: string, listener?: (...args: any[]) => void): void {
    this.eventManager.removeListener(event, listener);
  }

  public emit(event: string, ...args: any[]): void {
    this.eventManager.emit(event, ...args);
  }

  public getSocket(): Socket | null {
    return this.socketManager.getSocket();
  }

  // Public API - Token Management
  public async checkAndRefreshToken(): Promise<boolean> {
    return this.tokenRefreshManager.checkAndRefresh();
  }

  // Public API - Cleanup
  public cleanup(): void {
    this.logger.info("Cleaning up SocketClient");
    this.isDestroyed = true;

    this.tokenRefreshManager.cleanup();
    this.eventManager.cleanup();
    this.socketManager.cleanup();
    this.stateManager.cleanup();

    this.dismissConnectionToast();
    this.logger.info("SocketClient cleaned up");
  }

  // Private Methods - Initialization
  private async waitForAuthAndConnect(): Promise<void> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Wait for authentication token
        await waitForAuthToken(10, 500);

        // Don't connect on login page
        if (window.location.pathname.startsWith('/login')) {
          this.logger.debug("Skipping auto-connect on login page");
          return;
        }

        // Wait for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 200));

        // Attempt connection
        await this.connect();
        this.logger.info("Auto-connect successful");
        return;

      } catch (error: unknown) {
        retries++;
        this.logger.error(`Auto-connect attempt ${retries}/${maxRetries} failed:`, error);

        if (retries < maxRetries) {
          const delay = 1000 * retries;
          this.logger.debug(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error("Failed to establish socket connection after all retries");
          this.showConnectionError("Connection failed", "Unable to connect to server. Please refresh the page.");
        }
      }
    }
  }

  private setupManagerCoordination(): void {
    // Socket events -> State Manager
    this.socketManager.onConnect(() => {
      const socket = this.socketManager.getSocket();
      if (socket) {
        this.stateManager.setSocketId(socket.id || "unknown");
        this.eventManager.setSocket(socket);
        this.tokenRefreshManager.start();
      }
      this.stateManager.setState("connected", "Socket connected");
      this.dismissConnectionToast();
    });

    this.socketManager.onDisconnect((reason) => {
      this.stateManager.clearSocketId();
      this.eventManager.setSocket(null);
      this.tokenRefreshManager.stop();
      this.stateManager.setState("disconnected", `Socket disconnected: ${reason}`);

      // Auto-reconnect for unexpected disconnections
      if (reason !== "io client disconnect" && this.stateManager.canReconnect()) {
        this.scheduleReconnect();
      }
    });

    this.socketManager.onConnectError((error) => {
      this.stateManager.setState("error", "Connection error");
      this.handleConnectionError(error);
    });

    this.socketManager.onError((error) => {
      this.stateManager.setState("error", "Socket error");
      this.handleSocketError(error);
    });

    this.socketManager.onHandshake((response) => {
      if (response.success) {
        this.logger.info("Handshake successful", response.data);
      } else {
        this.logger.error("Handshake failed", response.error);
        this.stateManager.setState("error", "Handshake failed");
      }
    });

    // Add server ready handler for race condition fix
    this.socketManager.onServerReady(() => {
      this.logger.info("Server ready, connection fully established");
      // Additional verification that server is ready to handle events
      this.stateManager.setState("connected", "Server ready - connection fully established");
    });

    // State changes -> External events
    this.stateManager.onStateChange((event) => {
      this.logger.debug("State changed", {
        from: event.oldState,
        to: event.newState,
        socketId: event.socketId,
      });
    });

    // Token refresh events
    this.tokenRefreshManager.onRefresh((event) => {
      if (event.success) {
        this.logger.info("Token refreshed successfully");
      } else {
        this.logger.error("Token refresh failed", event.error);
        this.handleTokenRefreshError(event.error);
      }
    });
  }

  private setupAuthEventCoordination(): void {
    // Listen to auth events from the global coordinator
    authEventCoordinator.addEventListener('token_refresh_success', (event: any) => {
      this.logger.debug("Auth event: token refresh success", event.data);

      // If socket is disconnected due to auth issues, try to reconnect
      if (this.stateManager.getState() === 'disconnected' || this.stateManager.getState() === 'error') {
        this.logger.info("Attempting to reconnect socket after successful token refresh");

        setTimeout(() => {
          if (!this.isDestroyed) {
            this.connect().catch(error => {
              this.logger.error("Failed to reconnect after token refresh", error);
            });
          }
        }, 100);
      }
    });

    authEventCoordinator.addEventListener('token_refresh_error', (event: any) => {
      this.logger.debug("Auth event: token refresh error", event.data);

      // If token refresh fails and socket is disconnected, handle session expiry
      if (this.stateManager.getState() === 'disconnected' || this.stateManager.getState() === 'error') {
        this.logger.info("Token refresh failed, handling session expiry");
        this.handleSessionExpired({
          reason: 'TOKEN_REFRESH_FAILED',
          displayMessage: event.data?.error
        });
      }
    });

    authEventCoordinator.addEventListener('auth_expired', (event: any) => {
      this.logger.debug("Auth event: auth expired", event.data);

      // Handle auth expiration with context
      this.handleSessionExpired({
        reason: 'AUTH_EXPIRED',
        ...event.data
      });
    });

    this.logger.debug("Auth event coordination setup completed");
  }

  // Private Methods - Error Handling
  private handleConnectionError(error: any): void {
    this.logger.error("Connection error", {
      message: error.message,
      type: error.type,
      description: error.description,
    });

    // Categorize error for user feedback
    const isAuthError = error.message?.includes("token") ||
                       error.message?.includes("auth") ||
                       error.message?.includes("unauthorized") ||
                       error.message?.includes("AUTH_REQUIRED") ||
                       error.message?.includes("INVALID_TOKEN") ||
                       error.message?.includes("TOKEN_EXPIRED");

    const isTokenExpiredError = error.message?.includes("TOKEN_EXPIRED") ||
                              error.message?.includes("Access token has expired");

    const isCorsError = error.message?.includes("CORS") ||
                       error.message?.includes("cross-origin");

    const isNetworkError = error.message?.includes("network") ||
                          error.message?.includes("timeout") ||
                          error.type === "TransportError";

    if (isTokenExpiredError) {
      this.showConnectionError("Token Expired", "Your session has expired. Please refresh the page.");
    } else if (isAuthError) {
      this.showConnectionError("Authentication Failed", "Please refresh the page and log in again.");
    } else if (isCorsError) {
      this.showConnectionError("Connection Blocked", "Server configuration issue. Please contact support.");
    } else if (isNetworkError) {
      this.scheduleReconnect();
    } else {
      this.showConnectionError("Connection Error", "Failed to connect to server.");
    }
  }

  private handleSocketError(error: Error): void {
    this.logger.error("Socket error", error);

    const code = (error as any)?.code || (error as any)?.error?.code;
    if (code === "SESSION_EXPIRED" || code === "SESSION_REVOKED") {
      this.handleSessionExpired({ reason: code });
    }
  }

  private handleTokenRefreshError(error?: string): void {
    this.showConnectionError("Session Expired", "Your session has expired. Please log in again.");
    this.handleSessionExpired({ reason: 'TOKEN_REFRESH_FAILED', displayMessage: error });
  }

  private handleSessionExpired(payload: any): void {
    this.logger.info("Session expired event received", payload);

    const reason = payload?.reason || "Session expired";
    const isLoggedInElsewhere = reason === 'LOGGED_IN_ELSEWHERE';

    // NEW STRATEGY: Try token refresh first before logging out
    // Only immediately logout if explicitly logged out from another device
    if (isLoggedInElsewhere) {
      this.logger.info("User logged in from another device, performing immediate logout");
      this.performImmediateLogout(reason, payload);
      return;
    }

    // For normal session expiry, attempt token refresh first
    this.attemptTokenRefreshBeforeLogout(payload);
  }

  private async attemptTokenRefreshBeforeLogout(payload: any): Promise<void> {
    this.logger.info("Attempting token refresh before logout", payload);

    // Disconnect socket temporarily
    this.socketManager.disconnect();

    try {
      // Try to refresh the token
      const refreshSuccess = await this.tokenRefreshManager.checkAndRefresh();

      if (refreshSuccess) {
        this.logger.info("Token refresh successful, reconnecting socket");

        // Wait a moment for cookies to be properly set
        await new Promise(resolve => setTimeout(resolve, 200));

        // Reconnect the socket with new token
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.connect().catch(error => {
              this.logger.error("Failed to reconnect after token refresh", error);
              // If reconnection fails, then proceed with logout
              this.performImmediateLogout('RECONNECT_FAILED', payload);
            });
          }
        }, 100);

        return;
      } else {
        this.logger.warn("Token refresh failed, proceeding with logout");
        this.performImmediateLogout('TOKEN_REFRESH_FAILED', payload);
      }
    } catch (error: any) {
      this.logger.error("Error during token refresh attempt", error);
      this.performImmediateLogout('TOKEN_REFRESH_ERROR', payload);
    }
  }

  private performImmediateLogout(reason: string, payload: any): void {
    this.logger.info("Performing immediate logout", { reason, payload });

    // Clear auth cookies (simplified version)
    const cookiesToClear = ["accessToken", "refreshToken", "XSRF-TOKEN"];
    const hostname = window.location.hostname;

    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
    });

    // Show notification
    const isLoggedInElsewhere = reason === 'LOGGED_IN_ELSEWHERE';
    const displayMessage = payload?.displayMessage || reason;

    if (!window.location.pathname.startsWith('/login')) {
      if (isLoggedInElsewhere) {
        toast.error("Logged in from another device", { description: displayMessage });
      } else {
        toast.error("Session Expired", { description: "Your session has expired and could not be refreshed" });
      }
    }

    // Dispatch events and redirect
    window.dispatchEvent(new CustomEvent("socket:auth-required", { detail: payload }));
    window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason } }));

    // Server-side logout and redirect
    setTimeout(async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
      } catch {}

      window.location.replace(`/login?reason=${reason.toLowerCase()}`);
    }, 100);
  }

  // Private Methods - Reconnection Logic
  private scheduleReconnect(): void {
    const stats = this.stateManager.getConnectionStats();
    if (stats.reconnectAttempts >= 5) {
      this.showConnectionError("Connection failed", "Unable to connect to server. Please refresh the page.");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, stats.reconnectAttempts), 10000);
    this.logger.debug(`Scheduling reconnect attempt ${stats.reconnectAttempts + 1}/5 in ${delay}ms`);

    setTimeout(() => {
      if (this.stateManager.getState() === "disconnected" || this.stateManager.getState() === "error") {
        this.connect().catch(() => {});
      }
    }, delay);
  }

  // Private Methods - UI Helpers
  private showConnectionError(title: string, description: string): void {
    this.connectionToastId = toast.error(title, { description });
  }

  private dismissConnectionToast(): void {
    if (this.connectionToastId !== null) {
      try {
        toast.dismiss(this.connectionToastId);
      } catch {}
      this.connectionToastId = null;
    }
  }
}

// Export types for backward compatibility
export type { SocketState, SocketClientConfig, ConnectionStats };

// Export the singleton instance and utilities for backward compatibility
let socketClientInstance: SocketClient | null = null;

export const socketClient = {
  getInstance: () => {
    if (!socketClientInstance) {
      socketClientInstance = new SocketClient();
    }
    return socketClientInstance;
  },
  connect: () => socketClient.getInstance().connect(),
  disconnect: () => socketClient.getInstance().disconnect(),
  emit: (event: string, ...args: any[]) => socketClient.getInstance().emit(event, ...args),
  on: (event: string, listener: (...args: any[]) => void) => socketClient.getInstance().on(event, listener),
  off: (event: string, listener?: (...args: any[]) => void) => socketClient.getInstance().off(event, listener),
  getState: () => socketClient.getInstance().getState(),
  isConnected: () => socketClient.getInstance().isConnected(),
  getSocket: () => socketClient.getInstance().getSocket(),
  getConnectionStats: () => socketClient.getInstance().getConnectionStats(),
  cleanup: () => {
    if (socketClientInstance) {
      socketClientInstance.cleanup();
    }
  }
};

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    socketClient.cleanup();
  });
}

export default SocketClient;