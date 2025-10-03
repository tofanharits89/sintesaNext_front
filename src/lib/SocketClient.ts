"use client";

import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { getAuthTokenFromCookie, waitForAuthToken } from "@/utils/auth-utils";
import { SOCKET_EVENTS } from "@/shared/socket-events";

// Socket connection states - simplified
export type SocketState = "disconnected" | "connecting" | "connected" | "error";

// Socket client configuration
interface SocketClientConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  debug?: boolean;
}

/**
 * Simplified Socket Client
 * Industry-grade socket client with single source of truth for connection state
 */
export class SocketClient {
  private socket: Socket | null = null;
  private state: SocketState = "disconnected";
  private config: Required<SocketClientConfig>;
  private readonly debugMode: boolean;
  private connectionToastId: string | number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  constructor(config: SocketClientConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:88",
      path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      autoConnect: config.autoConnect ?? true,
      debug: config.debug ?? process.env.NODE_ENV === "development",
    };

    this.debugMode = this.config.debug;

    // Auto-connect after authentication is ready
    if (this.config.autoConnect && typeof window !== "undefined") {
      this.waitForAuthAndConnect();
    }
  }

  /**
   * Wait for authentication and connect
   * Enhanced with retry logic and better error handling
   */
  private async waitForAuthAndConnect(): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Increase timeout to 5 seconds (10 attempts * 500ms)
        await waitForAuthToken(10, 500);
        
        // Don't connect on login page
        if (window.location.pathname.startsWith('/login')) {
          this.log("Skipping auto-connect on login page");
          return;
        }
        
        // Wait a bit for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Attempt connection
        await this.connect();
        this.log("Auto-connect successful");
        return;
        
      } catch (error) {
        retries++;
        this.logError(`Auto-connect attempt ${retries}/${maxRetries} failed:`, error);
        
        if (retries < maxRetries) {
          // Exponential backoff: 1s, 2s, 3s
          const delay = 1000 * retries;
          this.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // All retries exhausted - surface error to UI
          this.logError("Failed to establish socket connection after all retries");
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('socket:connection-failed', {
              detail: { 
                error: 'Failed to establish socket connection',
                retries: maxRetries 
              }
            }));
          }
        }
      }
    }
  }

  /**
   * Create socket connection
   * Enhanced with explicit token authentication
   */
  private createSocket(): Socket {
    const token = getAuthTokenFromCookie();

    this.log("Creating socket connection:", {
      url: this.config.url,
      path: this.config.path,
      hasToken: !!token,
      tokenLength: token?.length,
    });

    // Simplified socket configuration with explicit auth
    const socketConfig: any = {
      path: this.config.path,
      transports: ["websocket", "polling"],
      withCredentials: true, // Send cookies
      autoConnect: false, // We'll connect manually
      reconnection: false, // We'll handle reconnection ourselves
      timeout: 10000,
      // CRITICAL: Send token explicitly as backup to cookies
      auth: token ? { token } : undefined,
    };

    this.log("Socket config:", {
      path: socketConfig.path,
      transports: socketConfig.transports,
      withCredentials: socketConfig.withCredentials,
      hasAuth: !!socketConfig.auth,
    });

    const socket = io(this.config.url, socketConfig);
    return socket;
  }

  /**
   * Attach event listeners to socket
   */
  private attachEventListeners(): void {
    if (!this.socket) return;

    // Core socket events - bind to this context
    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
    this.socket.on("connect_error", this.handleConnectError.bind(this));
    this.socket.on("error", this.handleError.bind(this));
    this.socket.on("session:expired", this.handleSessionExpired.bind(this));
    this.socket.on("auth:token-expired", this.handleTokenExpired.bind(this));
    
    // CRITICAL: Handle handshake response to prevent timeout
    this.socket.on("handshake:response", this.handleHandshakeResponse.bind(this));

    // Re-attach custom listeners
    this.rebindCustomListeners();
  }

  /**
   * Rebind custom listeners to the current socket
   */
  private rebindCustomListeners(): void {
    if (!this.socket) return;

    for (const [event, listeners] of this.listeners.entries()) {
      for (const listener of listeners) {
        this.socket.on(event, listener);
      }
    }

    this.log(`Rebound ${this.listeners.size} custom event listeners`);
  }

  /**
   * Remove event listeners from socket
   */
  private removeEventListeners(): void {
    if (!this.socket) return;

    // Remove core listeners
    this.socket.off("connect", this.handleConnect);
    this.socket.off("disconnect", this.handleDisconnect);
    this.socket.off("connect_error", this.handleConnectError);
    this.socket.off("error", this.handleError);
    this.socket.off("session:expired", this.handleSessionExpired);
    this.socket.off("auth:token-expired", this.handleTokenExpired);
    this.socket.off("handshake:response", this.handleHandshakeResponse);

    // Remove custom listeners
    for (const [event, listeners] of this.listeners.entries()) {
      for (const listener of listeners) {
        this.socket.off(event, listener);
      }
    }
  }

  /**
   * Handle socket connection
   */
  private handleConnect(): void {
    this.log("Socket connected successfully");
    this.setState("connected");
    this.reconnectAttempts = 0;

    // Dismiss any error toasts
    if (this.connectionToastId !== null) {
      try { toast.dismiss(this.connectionToastId); } catch {}
      this.connectionToastId = null;
    }

    // Send handshake immediately
    this.sendHandshake();
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(reason: string): void {
    this.log("Socket disconnected:", reason);
    this.setState("disconnected");

    // Auto-reconnect for unexpected disconnections
    if (reason !== "io client disconnect" && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle socket connection error
   * Enhanced with detailed error logging and categorization
   */
  private handleConnectError(error: any): void {
    // Enhanced error logging
    this.logError("Socket connection error:", {
      message: error.message,
      type: error.type,
      description: error.description,
      context: error.context,
      url: this.config.url,
      path: this.config.path,
      hasToken: !!getAuthTokenFromCookie(),
      currentState: this.state,
      reconnectAttempts: this.reconnectAttempts,
    });

    // Check for specific error types
    const isAuthError = error.message?.includes("token") ||
                       error.message?.includes("auth") ||
                       error.message?.includes("unauthorized") ||
                       error.message?.includes("AUTH_REQUIRED") ||
                       error.message?.includes("INVALID_TOKEN");

    const isCorsError = error.message?.includes("CORS") ||
                       error.message?.includes("cross-origin");

    const isNetworkError = error.message?.includes("network") ||
                          error.message?.includes("timeout") ||
                          error.type === "TransportError";

    if (isAuthError) {
      this.setState("error");
      this.logError("Authentication error detected - token may be missing or invalid");
      
      if (!window.location.pathname.startsWith('/login')) {
        toast.error("Authentication failed", {
          description: "Please refresh the page and log in again",
        });
      }
    } else if (isCorsError) {
      this.setState("error");
      this.logError("CORS error detected - check server CORS configuration");
      
      toast.error("Connection blocked", {
        description: "Server configuration issue. Please contact support.",
      });
    } else if (isNetworkError) {
      this.setState("error");
      this.logError("Network error detected - will retry");
      this.scheduleReconnect();
    } else {
      this.setState("error");
      this.scheduleReconnect();
    }
  }

  /**
   * Handle socket error
   */
  private handleError(error: Error): void {
    this.logError("Socket error:", error);

    const anyErr: any = error as any;
    const code = anyErr?.code || anyErr?.error?.code;

    if (code === "SESSION_EXPIRED" || code === "SESSION_REVOKED") {
      this.handleSessionExpired({ reason: code });
      return;
    }

    this.setState("error");
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.showErrorToast("Connection failed", "Unable to connect to server. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);

    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.state === "disconnected" || this.state === "error") {
        this.connect().catch(() => {});
      }
    }, delay);
  }

  /**
   * Show error toast
   */
  private showErrorToast(title: string, description: string): void {
    this.connectionToastId = toast.error(title, { description });
  }

  /**
   * Send handshake request
   */
  private sendHandshake(): void {
    if (!this.socket?.connected) {
      this.logError("Cannot send handshake: socket not connected");
      return;
    }

    this.log("Sending handshake request");
    this.socket.emit("handshake:request", {
      timestamp: Date.now(),
      clientId: this.socket.id,
    });
  }

  /**
   * Handle handshake response from server
   * CRITICAL: This prevents handshake timeout disconnections
   */
  private handleHandshakeResponse(response: any): void {
    if (response.success) {
      this.log("Handshake successful:", {
        serverId: response.data?.serverId,
        userId: response.data?.userId,
        username: response.data?.username,
      });
    } else {
      this.logError("Handshake failed:", response.error);
    }
  }

  /**
   * Set socket state and broadcast changes
   */
  private setState(newState: SocketState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log(`State: ${oldState} -> ${newState}`);

      // Broadcast state changes for UI components
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('socket:state', {
            detail: { state: newState, connected: this.isConnected() }
          }));

          if (newState === 'connected') {
            window.dispatchEvent(new CustomEvent('socket:connected'));
          }
        } catch {}
      }
    }
  }

  /**
   * Log debug messages
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      console.log(`[SocketClient] ${message}`, ...args);
    }
  }

  /**
   * Log error messages
   */
  private logError(message: string, ...args: unknown[]): void {
    console.error(`[SocketClient Error] ${message}`, ...args);
  }

  // Public API

  /**
   * Connect to the socket server
   */
  public async connect(): Promise<void> {
    if (this.socket?.connected) {
      this.log("Already connected");
      return;
    }

    if (this.state === "connecting") {
      this.log("Connection already in progress");
      return;
    }

    this.setState("connecting");

    try {
      // Clean up existing socket
      if (this.socket) {
        this.removeEventListeners();
        this.socket.disconnect();
      }

      // Create and connect new socket
      this.socket = this.createSocket();
      this.attachEventListeners();
      this.socket.connect();

      this.log("Connection initiated");
    } catch (error) {
      this.logError("Failed to initiate connection:", error);
      this.setState("error");
      throw error;
    }
  }

  /**
   * Disconnect from the socket server
   */
  public disconnect(): void {
    this.log("Disconnecting socket");
    this.reconnectAttempts = 0;

    if (this.socket) {
      this.removeEventListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.setState("disconnected");
  }

  /**
   * Emit an event to the server
   */
  public emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      this.logError(`Cannot emit ${event}: socket not connected`);
      return;
    }

    this.socket.emit(event, ...args);
    this.log(`Emitted: ${event}`);
  }

  /**
   * Listen for an event from the server
   */
  public on(event: string, listener: (...args: unknown[]) => void): void {
    // Store listener for reconnection
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Bind immediately if socket is connected
    if (this.socket?.connected) {
      this.socket.on(event, listener);
    }

    this.log(`Added listener for: ${event}`);
  }

  /**
   * Remove event listener
   */
  public off(event: string, listener?: (...args: unknown[]) => void): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    if (listener) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    } else {
      listeners.clear();
      this.listeners.delete(event);
    }

    // Remove from socket
    if (this.socket) {
      if (listener) {
        this.socket.off(event, listener);
      } else {
        this.socket.off(event);
      }
    }

    this.log(`Removed listener for: ${event}`);
  }

  /**
   * Get current socket state
   */
  public getState(): SocketState {
    return this.state;
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    return {
      state: this.state,
      connected: this.isConnected(),
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.log("Cleaning up socket client");
    this.disconnect();
    this.listeners.clear();
  }

  /**
   * Handle token expiration (but session still valid)
   * CRITICAL: This allows socket to stay connected while token refreshes
   */
  private async handleTokenExpired(payload: any): Promise<void> {
    this.log("Token expired event received, triggering refresh", payload);
    
    try {
      // Trigger token refresh via HTTP request
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        this.log("Token refreshed successfully, reconnecting socket");
        
        // Reconnect socket with new token
        await this.disconnect();
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
        await this.connect();
      } else {
        this.logError("Token refresh failed, session may be expired");
        this.handleSessionExpired({ reason: 'TOKEN_REFRESH_FAILED' });
      }
    } catch (error) {
      this.logError("Error refreshing token:", error);
      this.handleSessionExpired({ reason: 'TOKEN_REFRESH_ERROR' });
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(payload: any): void {
    this.log("Session expired event received", payload);
    this.setState("error");

    // Disconnect socket immediately
    this.disconnect();

    // Clear auth cookies
    if (typeof window !== "undefined") {
      const cookiesToClear = ["accessToken", "refreshToken", "XSRF-TOKEN"];
      const hostname = window.location.hostname;

      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
      });
    }

    // Show notification
    const reason = payload?.reason || "Session expired";
    const isLoggedInElsewhere = reason === 'LOGGED_IN_ELSEWHERE';

    if (!window.location.pathname.startsWith('/login')) {
      toast.error(
        isLoggedInElsewhere ? "Logged in from another device" : "Session expired",
        { description: payload?.displayMessage || reason }
      );
    }

    // Dispatch events and redirect
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("socket:auth-required", { detail: payload }));
      window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));

      // Server-side logout and redirect
      setTimeout(async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'session_expired' }),
          });
        } catch {}

        window.location.replace('/login?reason=session_expired');
      }, 100);
    }
  }
}

// Singleton socket client instance
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
