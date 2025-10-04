/**
 * Enterprise-Grade Socket Client - Fully Modular Architecture
 *
 * This is the main orchestrator that coordinates all socket-related functionality
 * through specialized managers while maintaining full backward compatibility.
 *
 * Architecture:
 * - SocketManager: Core socket connection management
 * - ConnectionStateManager: Connection state tracking
 * - TokenRefreshManager: Proactive token refresh
 * - EventManager: Event handling and lifecycle
 * - ErrorHandlerManager: Centralized error handling
 * - ReconnectionManager: Intelligent reconnection strategy
 * - SessionManager: Session lifecycle and expiration
 * - NotificationManager: User notifications
 * - StatePersistenceManager: State persistence for faster reconnection
 */

"use client";

import { Socket } from "socket.io-client";
import { waitForAuthToken } from "@/utils/auth-utils";
import {
  SocketState,
  SocketClientConfig,
  RequiredSocketClientConfig,
  ConnectionStats,
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES,
  EventAcknowledgment,
} from "./types";
import Logger from "./utils/Logger";
import SocketManager from "./managers/SocketManager";
import ConnectionStateManager from "./managers/ConnectionStateManager";
import TokenRefreshManager from "./managers/TokenRefreshManager";
import EventManager from "./managers/EventManager";
import ErrorHandlerManager from "./managers/ErrorHandlerManager";
import ReconnectionManager from "./managers/ReconnectionManager";
import SessionManager from "./managers/SessionManager";
import NotificationManager from "./managers/NotificationManager";
import StatePersistenceManager from "./managers/StatePersistenceManager";
import { authEventCoordinator } from "../auth-event-coordinator";

/**
 * Enterprise-Grade Socket Client
 * Orchestrates multiple specialized managers for socket operations
 */
export class SocketClient {
  // Configuration
  private config: RequiredSocketClientConfig;
  private logger: Logger;

  // Core Managers
  private socketManager: SocketManager;
  private stateManager: ConnectionStateManager;
  private tokenRefreshManager: TokenRefreshManager;
  private eventManager: EventManager;

  // Feature Managers
  private errorHandler: ErrorHandlerManager;
  private reconnectionManager: ReconnectionManager;
  private sessionManager: SessionManager;
  private notificationManager: NotificationManager;
  private persistenceManager: StatePersistenceManager;

  // State
  private isDestroyed = false;

  constructor(config: SocketClientConfig = {}) {
    // Initialize configuration with enterprise-grade defaults
    this.config = {
      url:
        config.url ||
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:88",
      path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      autoConnect: config.autoConnect ?? true,
      debug: config.debug ?? process.env.NODE_ENV === "development",
      reconnection: {
        enabled: config.reconnection?.enabled ?? true,
        maxAttempts: config.reconnection?.maxAttempts ?? 5,
        initialDelay: config.reconnection?.initialDelay ?? 1000,
        maxDelay: config.reconnection?.maxDelay ?? 10000,
        factor: config.reconnection?.factor ?? 2,
      },
    };

    // Initialize logger
    this.logger = Logger.create({
      enabled: this.config.debug,
      level: this.config.debug ? "debug" : "info",
      prefix: "[SocketClient]",
    });

    // Initialize core managers
    this.socketManager = new SocketManager(this.config, this.logger);
    this.stateManager = new ConnectionStateManager(
      this.logger,
      this.config.reconnection.maxAttempts
    );
    this.tokenRefreshManager = new TokenRefreshManager(this.logger);
    this.eventManager = new EventManager(this.logger);

    // Initialize feature managers
    this.notificationManager = new NotificationManager(this.logger);
    this.persistenceManager = new StatePersistenceManager(this.logger);
    this.reconnectionManager = new ReconnectionManager(
      this.config.reconnection,
      this.logger
    );

    // Initialize error handler with callbacks
    this.errorHandler = new ErrorHandlerManager(this.logger, {
      onAuthError: (error) => {
        this.notificationManager.showConnectionError(
          error.userMessage,
          error.technicalMessage
        );
      },
      onNetworkError: (error) => {
        if (error.retryable) {
          this.handleReconnection("Network error");
        } else {
          this.notificationManager.showConnectionError(
            error.userMessage,
            error.technicalMessage
          );
        }
      },
      onSessionError: (error) => {
        this.sessionManager.handleSessionExpired({
          reason: error.type.toUpperCase(),
          displayMessage: error.userMessage,
        });
      },
      onCriticalError: (error) => {
        this.notificationManager.showConnectionError(
          error.userMessage,
          error.technicalMessage
        );
      },
    });

    // Initialize session manager with callbacks
    this.sessionManager = new SessionManager(this.logger, {
      onSessionExpired: (payload) => {
        this.notificationManager.showSessionExpired(
          payload.reason,
          payload.displayMessage
        );
      },
      onLogout: (reason) => {
        this.disconnect();
      },
      onTokenRefreshRequired: async () => {
        return await this.tokenRefreshManager.checkAndRefresh();
      },
    });

    // Setup manager coordination
    this.setupManagerCoordination();

    // Setup auth event coordination
    this.setupAuthEventCoordination();

    this.logger.info("SocketClient initialized", {
      url: this.config.url,
      path: this.config.path,
      autoConnect: this.config.autoConnect,
      reconnection: this.config.reconnection,
    });

    // Restore persisted state for faster reconnection
    const restoredState = this.persistenceManager.restoreState();
    if (restoredState) {
      this.logger.info("Restored persisted connection state", restoredState);
    }

    // Auto-connect if enabled (after logging initialization)
    if (this.config.autoConnect && typeof window !== "undefined") {
      this.waitForAuthAndConnect();
    }
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
      this.errorHandler.handleConnectionError(error);
      throw error;
    }
  }

  public disconnect(): void {
    this.logger.info("Manual disconnect requested");

    this.tokenRefreshManager.stop();
    this.reconnectionManager.cancelScheduledReconnect();
    this.socketManager.disconnect();
    this.stateManager.setState("disconnected", "Manual disconnect");
    this.notificationManager.dismissConnectionToast();
  }

  public isConnected(): boolean {
    return this.socketManager.isConnected();
  }

  public getState(): SocketState {
    return this.stateManager.getState();
  }

  public getConnectionStats(): ConnectionStats {
    return this.stateManager.getConnectionStats();
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

  /**
   * Emit event with acknowledgment (Enterprise Feature #4)
   * Ensures critical events are received and processed by the server
   *
   * @param event - Event name to emit
   * @param data - Data to send with the event
   * @param timeout - Timeout in milliseconds (default: 5000)
   * @returns Promise that resolves with server response or rejects on timeout/error
   *
   * @example
   * ```typescript
   * try {
   *   const result = await socketClient.emitWithAck('message:send', {
   *     conversationId: '123',
   *     content: 'Hello'
   *   });
   *   console.log('Message sent:', result.data);
   * } catch (error) {
   *   console.error('Failed to send:', error);
   * }
   * ```
   */
  public emitWithAck<T = any>(
    event: string,
    data: any,
    timeout: number = 5000
  ): Promise<EventAcknowledgment<T>> {
    return new Promise((resolve, reject) => {
      // Check connection state
      if (!this.isConnected()) {
        reject(
          new SocketClientError(
            "connection",
            SOCKET_CLIENT_ERROR_CODES.CONNECTION_FAILED,
            "Socket not connected",
            true
          )
        );
        return;
      }

      const socket = this.getSocket();
      if (!socket) {
        reject(
          new SocketClientError(
            "connection",
            SOCKET_CLIENT_ERROR_CODES.CONNECTION_FAILED,
            "Socket not available",
            true
          )
        );
        return;
      }

      // Set timeout for acknowledgment
      const timeoutId = setTimeout(() => {
        this.logger.warn(`Acknowledgment timeout for event: ${event}`, {
          timeout,
          data,
        });
        reject(
          new SocketClientError(
            "connection",
            SOCKET_CLIENT_ERROR_CODES.NETWORK_ERROR,
            `Acknowledgment timeout for event: ${event}`,
            true
          )
        );
      }, timeout);

      // Emit with callback
      try {
        socket.emit(event, data, (response: EventAcknowledgment<T>) => {
          clearTimeout(timeoutId);

          this.logger.debug(`Acknowledgment received for event: ${event}`, {
            success: response?.success,
            hasData: !!response?.data,
          });

          if (response?.success) {
            resolve(response);
          } else {
            reject(
              new SocketClientError(
                "connection",
                SOCKET_CLIENT_ERROR_CODES.UNKNOWN_ERROR,
                response?.error || "Event failed",
                false
              )
            );
          }
        });
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        this.logger.error(`Failed to emit event with ack: ${event}`, error);
        reject(
          new SocketClientError(
            "connection",
            SOCKET_CLIENT_ERROR_CODES.UNKNOWN_ERROR,
            error instanceof Error ? error.message : "Unknown error",
            false
          )
        );
      }
    });
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

    // Persist state before cleanup for faster reconnection
    const stats = this.stateManager.getConnectionStats();
    this.persistenceManager.persistState(
      stats.socketId,
      stats.state,
      stats.reconnectAttempts
    );

    // Cleanup all managers
    this.tokenRefreshManager.cleanup();
    this.eventManager.cleanup();
    this.socketManager.cleanup();
    this.stateManager.cleanup();
    this.errorHandler.cleanup();
    this.reconnectionManager.cleanup();
    this.sessionManager.cleanup();
    this.notificationManager.cleanup();
    this.persistenceManager.cleanup();

    this.logger.info("SocketClient cleaned up");
  }

  // Private Methods - Initialization
  private async waitForAuthAndConnect(): Promise<void> {
    // Don't connect on login page
    if (window.location.pathname.startsWith("/login")) {
      this.logger.debug("Skipping auto-connect on login page");
      return;
    }

    // BEST PRACTICE: Connect immediately without waiting for token
    // Benefits:
    // 1. Faster connection (no artificial delays)
    // 2. Socket.IO handles auth failures gracefully
    // 3. Built-in exponential backoff for retries
    // 4. Server validates auth via httpOnly cookies

    try {
      // Quick check if token exists (non-blocking)
      const hasToken = await waitForAuthToken(3, 100); // Max 300ms

      if (!hasToken) {
        this.logger.debug("No auth token found, skipping auto-connect");
        return;
      }

      // Connect immediately - let server handle auth validation
      await this.connect();
      this.logger.info("Auto-connect successful");
    } catch (error: unknown) {
      // Don't show error on initial connection failure
      // Socket.IO will auto-retry with exponential backoff
      this.logger.debug(
        "Initial connection attempt failed, Socket.IO will auto-retry",
        error
      );

      // Connection errors are handled by connect_error event
      // No need for manual retry loop here
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
      this.notificationManager.dismissConnectionToast();
      this.reconnectionManager.reset();

      // Persist successful connection state
      const stats = this.stateManager.getConnectionStats();
      this.persistenceManager.persistState(
        stats.socketId,
        stats.state,
        stats.reconnectAttempts
      );
    });

    this.socketManager.onDisconnect((reason) => {
      this.stateManager.clearSocketId();
      this.eventManager.setSocket(null);
      this.tokenRefreshManager.stop();
      this.stateManager.setState(
        "disconnected",
        `Socket disconnected: ${reason}`
      );

      // Auto-reconnect for unexpected disconnections
      this.handleReconnection(reason);
    });

    this.socketManager.onConnectError((error) => {
      this.stateManager.setState("error", "Connection error");
      this.errorHandler.handleConnectionError(error);
    });

    this.socketManager.onError((error) => {
      this.stateManager.setState("error", "Socket error");
      this.errorHandler.handleSocketError(error);
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
      this.stateManager.setState(
        "connected",
        "Server ready - connection fully established"
      );
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
        this.errorHandler.handleTokenRefreshError(event.error);
      }
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(reason: string): void {
    const currentState = this.stateManager.getState();
    const stats = this.stateManager.getConnectionStats();

    if (
      this.reconnectionManager.shouldReconnect(
        currentState,
        reason,
        stats.reconnectAttempts
      )
    ) {
      this.reconnectionManager.scheduleReconnect(
        stats.reconnectAttempts,
        async () => {
          const currentState = this.stateManager.getState();
          if (currentState === "disconnected" || currentState === "error") {
            this.logger.info(
              `Attempting reconnection (attempt ${stats.reconnectAttempts + 1}/${
                this.config.reconnection.maxAttempts
              })`
            );
            await this.connect();
          } else {
            this.logger.debug(
              `Skipping reconnection - current state: ${currentState}`
            );
          }
        },
        reason
      );
    }
  }

  private setupAuthEventCoordination(): void {
    // Listen to auth events from the global coordinator
    authEventCoordinator.addEventListener(
      "token_refresh_success",
      (event: any) => {
        this.logger.debug("Auth event: token refresh success", event.data);

        // If socket is disconnected due to auth issues, try to reconnect
        if (
          this.stateManager.getState() === "disconnected" ||
          this.stateManager.getState() === "error"
        ) {
          this.logger.info(
            "Attempting to reconnect socket after successful token refresh"
          );

          setTimeout(() => {
            if (!this.isDestroyed) {
              this.connect().catch((error) => {
                this.logger.error(
                  "Failed to reconnect after token refresh",
                  error
                );
              });
            }
          }, 100);
        }
      }
    );

    authEventCoordinator.addEventListener(
      "token_refresh_error",
      (event: any) => {
        this.logger.debug("Auth event: token refresh error", event.data);

        // If token refresh fails and socket is disconnected, handle session expiry
        if (
          this.stateManager.getState() === "disconnected" ||
          this.stateManager.getState() === "error"
        ) {
          this.logger.info("Token refresh failed, handling session expiry");
          this.sessionManager.handleSessionExpired({
            reason: "TOKEN_REFRESH_FAILED",
            displayMessage: event.data?.error,
          });
        }
      }
    );

    authEventCoordinator.addEventListener("auth_expired", (event: any) => {
      this.logger.debug("Auth event: auth expired", event.data);

      // Handle auth expiration with context
      this.sessionManager.handleSessionExpired({
        reason: "AUTH_EXPIRED",
        ...event.data,
      });
    });

    this.logger.debug("Auth event coordination setup completed");
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
  emit: (event: string, ...args: any[]) =>
    socketClient.getInstance().emit(event, ...args),
  emitWithAck: <T = any>(event: string, data: any, timeout?: number) =>
    socketClient.getInstance().emitWithAck<T>(event, data, timeout),
  on: (event: string, listener: (...args: any[]) => void) =>
    socketClient.getInstance().on(event, listener),
  off: (event: string, listener?: (...args: any[]) => void) =>
    socketClient.getInstance().off(event, listener),
  getState: () => socketClient.getInstance().getState(),
  isConnected: () => socketClient.getInstance().isConnected(),
  getSocket: () => socketClient.getInstance().getSocket(),
  getConnectionStats: () => socketClient.getInstance().getConnectionStats(),
  cleanup: () => {
    if (socketClientInstance) {
      socketClientInstance.cleanup();
    }
  },
};

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    socketClient.cleanup();
  });
}

export default SocketClient;
