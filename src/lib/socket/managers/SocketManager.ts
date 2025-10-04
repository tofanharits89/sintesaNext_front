/**
 * Socket Manager
 * Enterprise-grade core socket connection management
 */

import { io, Socket } from "socket.io-client";
import {
  ISocketManager,
  RequiredSocketClientConfig,
  SocketManagerConfig,
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES
} from "../types";
import Logger from "../utils/Logger";

export class SocketManager implements ISocketManager {
  private socket: Socket | null = null;
  private config: RequiredSocketClientConfig;
  private socketConfig: SocketManagerConfig;
  private logger: Logger;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private handshakePromise: Promise<void> | null = null;
  private handshakeResolve: (() => void) | null = null;
  private handshakeReject: ((error: Error) => void) | null = null;

  // Server ready state management for race condition fix
  private isServerReady = false;
  private serverReadyPromise: Promise<void> | null = null;
  private serverReadyResolve: (() => void) | null = null;
  private serverReadyTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  private onConnectHandlers: Set<() => void> = new Set();
  private onDisconnectHandlers: Set<(reason: string) => void> = new Set();
  private onConnectErrorHandlers: Set<(error: any) => void> = new Set();
  private onErrorHandlers: Set<(error: Error) => void> = new Set();
  private onHandshakeHandlers: Set<(response: any) => void> = new Set();
  private onServerReadyHandlers: Set<() => void> = new Set();

  constructor(config: RequiredSocketClientConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    this.socketConfig = {
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: false, // We handle reconnection ourselves
      reconnectionAttempts: 0,
      reconnectionDelay: 1000,
      maxReconnectionDelay: 5000,
    };

    this.logger.debug("SocketManager initialized", {
      url: config.url,
      path: config.path,
      socketConfig: this.socketConfig,
    });
  }

  async createSocket(): Promise<Socket> {
    if (this.socket) {
      this.logger.warn("Socket already exists, cleaning up first");
      this.cleanup();
    }

    try {
      const token = this.getAuthToken();
      const socketConfig = this.buildSocketConfig(token);

      this.logger.debug("Creating socket connection", {
        url: this.config.url,
        path: this.config.path,
        hasToken: !!token,
        transports: this.socketConfig.transports,
      });

      this.socket = io(this.config.url, socketConfig);
      this.attachEventListeners();

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          const error = new SocketClientError(
            "connection",
            SOCKET_CLIENT_ERROR_CODES.CONNECTION_FAILED,
            "Connection timeout",
            true
          );
          this.notifyConnectError(error);
        }
      }, this.socketConfig.timeout);

      return this.socket;
    } catch (error: unknown) {
      this.logger.error("Failed to create socket", { error });
      throw new SocketClientError(
        "connection",
        SOCKET_CLIENT_ERROR_CODES.CONNECTION_FAILED,
        `Failed to create socket: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      this.logger.warn("Connection already in progress");
      return;
    }

    if (this.socket?.connected) {
      this.logger.debug("Socket already connected");
      return;
    }

    this.isConnecting = true;
    this.isServerReady = false; // Reset server ready state

    try {
      // Create socket if it doesn't exist
      if (!this.socket) {
        await this.createSocket();
      }

      // Set up both handshake and server ready promises
      this.setupHandshakePromise();
      this.setupServerReadyPromise();

      // Connect the socket
      this.socket?.connect();

      // Wait for handshake completion first
      await this.handshakePromise;
      
      // Then wait for server ready signal
      await this.serverReadyPromise;

      this.logger.info("Socket connected and server ready successfully");
    } catch (error: unknown) {
      this.isConnecting = false;
      this.logger.error("Socket connection failed", { error });
      throw error;
    }
  }

  disconnect(): void {
    this.isConnecting = false;
    this.isServerReady = false;
    this.clearConnectionTimeout();
    this.clearServerReadyTimeout();

    if (this.socket) {
      this.logger.debug("Disconnecting socket");

      // Remove all listeners before disconnecting
      this.removeAllSocketListeners();

      this.socket.disconnect();
      this.socket = null;
    }

    this.logger.info("Socket disconnected");
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Event handling
  onConnect(handler: () => void): () => void {
    this.onConnectHandlers.add(handler);
    return () => this.onConnectHandlers.delete(handler);
  }

  onDisconnect(handler: (reason: string) => void): () => void {
    this.onDisconnectHandlers.add(handler);
    return () => this.onDisconnectHandlers.delete(handler);
  }

  onConnectError(handler: (error: any) => void): () => void {
    this.onConnectErrorHandlers.add(handler);
    return () => this.onConnectErrorHandlers.delete(handler);
  }

  onError(handler: (error: Error) => void): () => void {
    this.onErrorHandlers.add(handler);
    return () => this.onErrorHandlers.delete(handler);
  }

  onHandshake(handler: (response: any) => void): () => void {
    this.onHandshakeHandlers.add(handler);
    return () => this.onHandshakeHandlers.delete(handler);
  }

  onServerReady(handler: () => void): () => void {
    this.onServerReadyHandlers.add(handler);
    return () => this.onServerReadyHandlers.delete(handler);
  }

  isReady(): boolean {
    return this.isConnected() && this.isServerReady;
  }

  emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      this.logger.warn(`Cannot emit ${event}: socket not connected`);
      return;
    }

    // Prevent emitting events before server is ready (race condition fix)
    if (!this.isServerReady && !this.isSafeEvent(event)) {
      this.logger.warn(`Cannot emit ${event}: server not ready yet`, { 
        event, 
        isServerReady: this.isServerReady,
        socketId: this.socket?.id 
      });
      return;
    }

    this.socket.emit(event, ...args);
    this.logger.debug(`Emitted event: ${event}`, { args });
  }

  cleanup(): void {
    this.logger.debug("Cleaning up SocketManager");

    this.isConnecting = false;
    this.isServerReady = false;
    this.clearConnectionTimeout();
    this.clearServerReadyTimeout();
    this.disconnect();

    // Clear all handlers
    this.onConnectHandlers.clear();
    this.onDisconnectHandlers.clear();
    this.onConnectErrorHandlers.clear();
    this.onErrorHandlers.clear();
    this.onHandshakeHandlers.clear();
    this.onServerReadyHandlers.clear();

    // Clear promises
    this.handshakePromise = null;
    this.handshakeResolve = null;
    this.handshakeReject = null;
    this.serverReadyPromise = null;
    this.serverReadyResolve = null;
  }

  private buildSocketConfig(token: string | null): any {
    const config: any = {
      path: this.config.path,
      transports: this.socketConfig.transports,
      timeout: this.socketConfig.timeout,
      reconnection: this.socketConfig.reconnection,
      autoConnect: false, // We control connection manually
      withCredentials: true,
    };

    // Add token to auth if available
    if (token) {
      config.auth = { token };
    }

    return config;
  }

  private attachEventListeners(): void {
    if (!this.socket) return;

    // Core socket events
    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
    this.socket.on("connect_error", this.handleConnectError.bind(this));
    this.socket.on("error", this.handleError.bind(this));
    this.socket.on("auth:error", this.handleAuthError.bind(this));
    this.socket.on("handshake:response", this.handleHandshakeResponse.bind(this));
    this.socket.on("server:ready", this.handleServerReady.bind(this));
    this.socket.on("session:refreshed", this.handleSessionRefreshed.bind(this));
    this.socket.on("session:expired", this.handleSessionExpired.bind(this));

    this.logger.debug("Socket event listeners attached");
  }

  private removeAllSocketListeners(): void {
    if (!this.socket) return;

    this.socket.off("connect", this.handleConnect);
    this.socket.off("disconnect", this.handleDisconnect);
    this.socket.off("connect_error", this.handleConnectError);
    this.socket.off("error", this.handleError);
    this.socket.off("auth:error", this.handleAuthError);
    this.socket.off("handshake:response", this.handleHandshakeResponse);
    this.socket.off("server:ready", this.handleServerReady);
    this.socket.off("session:refreshed", this.handleSessionRefreshed);
    this.socket.off("session:expired", this.handleSessionExpired);

    this.logger.debug("Socket event listeners removed");
  }

  private handleConnect(): void {
    this.clearConnectionTimeout();
    this.isConnecting = false;

    this.logger.info("Socket connected", {
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
    });

    // Send handshake request
    this.emit("handshake:request", {
      timestamp: Date.now(),
      clientId: this.socket?.id,
    });

    // Notify handlers
    this.onConnectHandlers.forEach(handler => {
      try {
        handler();
      } catch (error: unknown) {
        this.logger.error("Connect handler error", { error });
      }
    });
  }

  private handleDisconnect(reason: string): void {
    this.isConnecting = false;
    this.clearConnectionTimeout();

    this.logger.info("Socket disconnected", { reason });

    // Notify handlers
    this.onDisconnectHandlers.forEach(handler => {
      try {
        handler(reason);
      } catch (error: unknown) {
        this.logger.error("Disconnect handler error", { error });
      }
    });
  }

  private handleConnectError(error: any): void {
    this.isConnecting = false;
    this.clearConnectionTimeout();

    this.logger.error("Socket connection error", {
      message: error.message,
      type: error.type,
      description: error.description,
      context: error.context,
    });

    this.notifyConnectError(error);
  }

  private handleError(error: Error): void {
    this.logger.error("Socket error", {
      message: error.message,
      stack: error.stack,
    });

    // Notify handlers
    this.onErrorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError: unknown) {
        this.logger.error("Error handler error", { handlerError });
      }
    });
  }

  private handleAuthError(error: any): void {
    this.logger.error("Socket authentication error", {
      code: error?.error?.code || error?.code,
      message: error?.error?.message || error?.message,
      timestamp: error?.timestamp,
    });

    // Convert to standard error format
    const errorObj = new SocketClientError(
      "authentication",
      error?.error?.code || error?.code || SOCKET_CLIENT_ERROR_CODES.AUTH_FAILED,
      error?.error?.message || error?.message || "Authentication failed",
      false
    );

    // Notify error handlers
    this.onErrorHandlers.forEach(handler => {
      try {
        handler(errorObj);
      } catch (handlerError: unknown) {
        this.logger.error("Auth error handler error", { handlerError });
      }
    });

    // Also notify connect error handlers since auth errors prevent connection
    this.notifyConnectError(errorObj);
  }

  private handleHandshakeResponse(response: any): void {
    this.logger.debug("Handshake response received", { response });

    // Resolve handshake promise
    if (this.handshakeResolve) {
      this.handshakeResolve();
      this.handshakeResolve = null;
      this.handshakeReject = null;
    }

    // Notify handlers
    this.onHandshakeHandlers.forEach(handler => {
      try {
        handler(response);
      } catch (error: unknown) {
        this.logger.error("Handshake handler error", { error });
      }
    });
  }

  private handleServerReady(data: any): void {
    this.logger.info("Server ready signal received", { data });
    
    this.isServerReady = true;
    
    // Clear server ready timeout
    if (this.serverReadyTimeout) {
      clearTimeout(this.serverReadyTimeout);
      this.serverReadyTimeout = null;
    }

    // Resolve server ready promise
    if (this.serverReadyResolve) {
      this.serverReadyResolve();
      this.serverReadyResolve = null;
    }

    // Notify handlers
    this.onServerReadyHandlers.forEach(handler => {
      try {
        handler();
      } catch (error: unknown) {
        this.logger.error("Server ready handler error", { error });
      }
    });
  }

  private handleSessionRefreshed(response: any): void {
    this.logger.info("Session refreshed", {
      userId: response?.data?.userId,
      lastActivity: response?.data?.lastActivity,
    });

    // Session is still valid, no action needed
    // The token refresh manager will handle token updates if needed
  }

  private handleSessionExpired(payload: any): void {
    this.logger.warn("Session expired event received", {
      userId: payload?.userId,
      reason: payload?.reason,
    });

    // Notify error handlers about session expiration
    const error = new SocketClientError(
      "session",
      "SESSION_EXPIRED",
      payload?.reason || "Session expired",
      false
    );

    this.onErrorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError: unknown) {
        this.logger.error("Session expired handler error", { handlerError });
      }
    });

    // Disconnect socket since session is no longer valid
    this.disconnect();
  }

  private setupHandshakePromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.handshakeResolve = resolve;
      this.handshakeReject = reject;
      this.handshakePromise = new Promise((res, rej) => {
        const originalResolve = this.handshakeResolve;
        const originalReject = this.handshakeReject;

        this.handshakeResolve = () => {
          originalResolve?.();
          res();
        };

        this.handshakeReject = (error: Error) => {
          originalReject?.(error);
          rej(error);
        };
      });

      // Set up timeout for handshake
      setTimeout(() => {
        if (this.handshakeReject) {
          const error = new SocketClientError(
            "handshake",
            SOCKET_CLIENT_ERROR_CODES.HANDSHAKE_TIMEOUT,
            "Handshake timeout",
            true
          );
          this.handshakeReject(error);
        }
      }, 10000); // 10 second handshake timeout
    });
  }

  private notifyConnectError(error: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Notify handlers
    this.onConnectErrorHandlers.forEach(handler => {
      try {
        handler(errorObj);
      } catch (handlerError: unknown) {
        this.logger.error("Connect error handler error", { handlerError });
      }
    });

    // Reject handshake promise if pending
    if (this.handshakeReject) {
      this.handshakeReject(errorObj);
      this.handshakeReject = null;
      this.handshakeResolve = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private clearServerReadyTimeout(): void {
    if (this.serverReadyTimeout) {
      clearTimeout(this.serverReadyTimeout);
      this.serverReadyTimeout = null;
    }
  }

  private setupServerReadyPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverReadyResolve = resolve;
      this.serverReadyPromise = new Promise((res, rej) => {
        const originalResolve = this.serverReadyResolve;

        this.serverReadyResolve = () => {
          originalResolve?.();
          res();
        };
      });

      // Set up timeout for server ready signal (fallback for race conditions)
      this.serverReadyTimeout = setTimeout(() => {
        this.logger.warn("Server ready timeout, proceeding anyway (possible race condition)");
        this.isServerReady = true; // Proceed anyway to avoid hanging
        
        if (this.serverReadyResolve) {
          this.serverReadyResolve();
          this.serverReadyResolve = null;
        }
      }, 2000); // Reduced to 2 seconds for better login responsiveness
    });
  }

  private isSafeEvent(event: string): boolean {
    // Events that are safe to emit before server is ready
    // Include essential authentication and session events needed for login
    const safeEvents = [
      "handshake:request",
      "ping",
      "disconnect",
      // Authentication events - essential for login flow
      "auth:request",
      "auth:response", 
      "auth:error",
      // Session events - needed for session management during login
      "session:expired",
      "session:recovered",
      // User events - needed for login state
      "user:login",
      "users:get-online",
      // Health and connection events
      "pong"
    ];
    return safeEvents.includes(event);
  }

  private getAuthToken(): string | null {
    // Try cookie first
    const cookies = document?.cookie || "";
    const tokenMatch = cookies.match(/accessToken=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      return decodeURIComponent(tokenMatch[1]);
    }

    // Fallback to localStorage
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem("accessToken");
      }
    } catch (error: unknown) {
      this.logger.debug("localStorage access failed", { error });
    }

    return null;
  }
}

export default SocketManager;