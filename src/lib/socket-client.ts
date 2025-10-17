/**
 * Simplified Socket Client
 *
 * Clean, simple Socket.IO client following modern best practices
 * Single source of truth for frontend socket communication
 */

"use client";

import { io, Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/types/socket-events";
import { config, backendPath } from "@/lib/config";

export type SocketState = "disconnected" | "connecting" | "connected" | "error" | "reconnecting";

export interface SocketClientConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  debug?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

export interface ConnectionStats {
  connectedAt?: string;
  lastActivity?: string;
  reconnectAttempts: number;
  totalConnections: number;
}

/**
 * Simplified Socket Client
 * Provides clean API for socket communication with automatic state management
 */
export class SocketClient {
  private socket: Socket | null = null;
  private state: SocketState = "disconnected";
  private config: SocketClientConfig;
  private reconnectAttempts = 0;
  private connectionStats: ConnectionStats = {
    reconnectAttempts: 0,
    totalConnections: 0,
  };
  private stateChangeListeners = new Set<(state: SocketState) => void>();
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>();
  private isDestroyed = false;
  private connectPromise: Promise<Socket> | null = null;
  private isConnecting = false;
  private registeredListeners = new Set<string>();

  constructor(clientConfig: SocketClientConfig = {}) {
    this.config = {
      url: clientConfig.url || config.socketUrl,
      path: clientConfig.path || config.socketPath,
      autoConnect: clientConfig.autoConnect ?? false,
      debug: clientConfig.debug ?? config.isDevelopment,
      reconnection: clientConfig.reconnection ?? true,
      reconnectionAttempts: clientConfig.reconnectionAttempts ?? 5,
      reconnectionDelay: clientConfig.reconnectionDelay ?? 1000,
      reconnectionDelayMax: clientConfig.reconnectionDelayMax ?? 10000,
      timeout: clientConfig.timeout ?? 15000,
    };
  }

  /**
   * Connect to socket server
   */
  async connect(): Promise<Socket> {
    if (this.isDestroyed) {
      throw new Error("Socket client has been destroyed");
    }

    // If already connected, return existing socket
    if (this.socket?.connected) {
      this.debugLog("Already connected, returning existing socket");
      return this.socket;
    }

    // If connection is in progress, return the existing promise
    if (this.isConnecting && this.connectPromise) {
      this.debugLog("Connection already in progress, returning existing promise");
      return this.connectPromise;
    }

    // If socket exists but not connected, cleanup first
    if (this.socket && !this.socket.connected) {
      this.debugLog("Cleaning up disconnected socket before reconnecting");
      this.cleanup();
    }

    this.isConnecting = true;
    this.setState("connecting");

    try {
      // In dev we rely on HTTP-only cookies + withCredentials.
      // Reading cookies via document.cookie won’t work for HttpOnly (by design),
      // so we avoid noisy warnings here.
      const authToken = null;

      const socketOptions: any = {
        path: this.config.path,
        transports: ["websocket", "polling"] as const,
        timeout: this.config.timeout,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        reconnectionDelayMax: this.config.reconnectionDelayMax,
        withCredentials: true, // Send httpOnly cookies in the handshake
        autoConnect: true,
        // If in the future we obtain a short-lived socket token from an API,
        // we can place it here: auth: { token }
      };

      this.socket = io(this.config.url!, socketOptions);

      this.setupEventListeners();
      this.connectionStats.totalConnections++;
      this.connectionStats.connectedAt = new Date().toISOString();

      // Store the connection promise to prevent concurrent attempts
      this.connectPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false;
          this.connectPromise = null;
          this.debugLog("Connection timeout after " + this.config.timeout + "ms");
          reject(new Error("Connection timeout"));
        }, this.config.timeout);

        this.socket!.once("connect", () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectPromise = null;
          this.debugLog("Connection successful");
          resolve(this.socket!);
        });

        this.socket!.once("connect_error", (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectPromise = null;
          this.debugLog("Connection error:", error);
          reject(error);
        });
      });

      return this.connectPromise;
    } catch (error) {
      this.isConnecting = false;
      this.connectPromise = null;
      this.setState("error");
      throw error;
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.isDestroyed) return;

    this.debugLog("Disconnecting...");
    this.cleanup();
    this.setState("disconnected");
  }

  /**
   * Reconnect to socket server
   */
  async reconnect(): Promise<Socket> {
    if (this.isDestroyed) {
      throw new Error("Socket client has been destroyed");
    }

    this.debugLog("Starting reconnection...");
    this.reconnectAttempts++;
    this.connectionStats.reconnectAttempts++;

    return this.connect();
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.setState("connected");
      this.reconnectAttempts = 0;
      this.debugLog("Connected to socket server");

      // Send handshake request
      this.socket!.emit(SOCKET_EVENTS.HANDSHAKE_REQUEST, {
        timestamp: Date.now(),
        clientId: this.socket!.id
      });
    });

    this.socket.on("disconnect", (reason) => {
      this.setState("disconnected");
      this.debugLog(`Disconnected from socket server: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      this.setState("error");
      this.debugLog("Socket connection error:", error);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      this.debugLog(`Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.setState("reconnecting");
      this.debugLog(`Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on("reconnect_failed", () => {
      this.setState("error");
      this.debugLog("Reconnection failed");
    });

    // Socket event responses
    this.socket.on(SOCKET_EVENTS.HANDSHAKE_RESPONSE, (data: any) => {
      this.debugLog("Handshake response received:", data);
      if (!data.success) {
        this.debugLog("Handshake failed:", data.error);
        this.setState("error");
      }
    });

    this.socket.on(SOCKET_EVENTS.SERVER_READY, (data: any) => {
      this.debugLog("Server ready received:", data);
    });

    this.socket.on(SOCKET_EVENTS.AUTH_ERROR, (data: any) => {
      this.debugLog("Authentication error:", data);
      this.setState("error");
      this.handleAuthError(data);
    });

    this.socket.on("session:expired", (data: any) => {
      this.debugLog("Session expired:", data);
      this.handleSessionExpired(data);
    });

    // Apply any queued event listeners
    this.applyQueuedListeners();
  }

  /**
   * Apply queued event listeners to socket
   */
  private applyQueuedListeners(): void {
    if (!this.socket) return;

    this.eventListeners.forEach((listeners, event) => {
      const listenerKey = `${this.socket!.id}:${event}`;
      if (this.registeredListeners.has(listenerKey)) {
        return;
      }
      this.registeredListeners.add(listenerKey);

      this.socket!.on(event, (...args: any[]) => {
        const eventListeners = this.eventListeners.get(event);
        if (eventListeners) {
          eventListeners.forEach(listener => listener(...args));
        }
      });
    });
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(data: any): void {
    // Show user-friendly notification
    console.error("Socket authentication error:", data);

    // You can integrate with your preferred notification system here
    if (typeof window !== "undefined" && (window as any).toast) {
      (window as any).toast.error(data.message || "Authentication failed", {
        duration: 5000,
        position: "top-center"
      });
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(data: any): void {
    if (typeof window === "undefined") return;

    // Prevent multiple simultaneous handlers
    if ((window as any).__handlingSessionExpired || (window as any).__isLoggingOut) {
      this.debugLog("Already handling session expiration, skipping...");
      return;
    }

    (window as any).__handlingSessionExpired = true;
    (window as any).__isLoggingOut = true;

    const reason = data.reason || 'SESSION_EXPIRED';
    const displayMessage = data.displayMessage || 'Your session has expired';

    // Call backend logout API (versioned)
    fetch(backendPath('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignore errors during logout
    });

    // Clear storage and redirect
    this.clearCookiesAndStorage().then(() => {
      window.dispatchEvent(new CustomEvent('auth:expired', {
        detail: { reason, displayMessage }
      }));

      const redirectReason = reason === 'LOGGED_IN_ELSEWHERE' ? 'logged_in_elsewhere' : 'session_expired';
      window.location.href = `/login?reason=${redirectReason}&message=${encodeURIComponent(displayMessage)}`;
    });
  }

  /**
   * Clear cookies and storage
   */
  private async clearCookiesAndStorage(): Promise<void> {
    try {
      // Clear session storage
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
      }

      // Clear local storage (except for some keys you might want to keep)
      if (typeof localStorage !== "undefined") {
        const keysToKeep = ["theme", "language"];
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keysToKeep.includes(key)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private setState(newState: SocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeListeners.forEach(listener => listener(newState));

      // Dispatch custom events for React hooks
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("socket:state", {
          detail: { state: newState }
        }));

        if (newState === "connected") {
          window.dispatchEvent(new CustomEvent("socket:connected", {
            detail: { connected: true }
          }));
        }
      }
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current connection state
   */
  getState(): SocketState {
    return this.state;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): ConnectionStats {
    const stats: ConnectionStats = {
      reconnectAttempts: this.connectionStats.reconnectAttempts,
      totalConnections: this.connectionStats.totalConnections,
    };
    if (this.connectionStats.connectedAt) {
      stats.connectedAt = this.connectionStats.connectedAt;
    }
    if (this.socket) {
      stats.lastActivity = new Date().toISOString();
    }
    return stats;
  }

  /**
   * Emit event to socket
   */
  emit(event: string, ...args: any[]): void {
    if (!this.socket) {
      this.debugLog("Cannot emit event - socket not connected");
      return;
    }

    this.socket.emit(event, ...args);
    this.updateActivity();
  }

  /**
   * Listen to socket events
   */
  on(event: string, listener: (...args: any[]) => void): void {
    // Queue the listener regardless of connection state
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const eventListeners = this.eventListeners.get(event)!;
    eventListeners.add(listener);

    // If socket is already connected, register immediately
    if (this.socket && this.socket.connected) {
      if (eventListeners.size === 1) {
        this.socket.on(event, (...args: any[]) => {
          const listeners = this.eventListeners.get(event);
          if (listeners) {
            listeners.forEach(listener => listener(...args));
          }
        });
      }
    }
  }

  /**
   * Stop listening to socket events
   */
  off(event: string, listener?: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    if (listener) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.socket?.off(event);
        this.eventListeners.delete(event);
      }
    } else {
      this.socket?.off(event);
      this.eventListeners.delete(event);
    }
  }

  /**
   * Listen to state changes
   */
  onStateChange(listener: (state: SocketState) => void): void {
    this.stateChangeListeners.add(listener);
  }

  /**
   * Stop listening to state changes
   */
  offStateChange(listener: (state: SocketState) => void): void {
    this.stateChangeListeners.delete(listener);
  }

  /**
   * Update activity timestamp
   */
  private updateActivity(): void {
    this.connectionStats.lastActivity = new Date().toISOString();
  }

  // ✅ REMOVED: getAuthTokenFromCookie() method
  // Socket.IO now relies on withCredentials: true to send HTTP-only cookies automatically
  // No need to manually read cookies (which doesn't work for HTTP-only cookies anyway)

  /**
   * Debug logging
   */
  private debugLog(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[SocketClient] ${message}`, ...args);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.registeredListeners.clear();
  }

  /**
   * Destroy socket client and cleanup all resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.debugLog("Destroying socket client...");
    this.disconnect();
    this.stateChangeListeners.clear();
    this.eventListeners.clear();
    this.isDestroyed = true;
  }
}

// Create singleton instance for backward compatibility
const socketClient = new SocketClient();

export { socketClient };
export default socketClient;