/**
 * Simplified Socket Client
 *
 * Consolidates the 8+ managers into 3 essential managers:
 * 1. ConnectionManager - handles connection, authentication, and reconnection
 * 2. EventManager - handles event listeners and state management
 * 3. NotificationManager - handles user notifications and error display
 *
 * Maintains backward compatibility with the existing API
 */

"use client";

import { Socket } from "socket.io-client";
import { waitForAuthToken } from "@/utils/auth-utils";
import { SOCKET_EVENTS } from "@/shared/socket-events";

export type SocketState = "disconnected" | "connecting" | "connected" | "error" | "reconnecting";

export interface SimpleSocketClientConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  debug?: boolean;
  reconnection?: {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
}

export interface ConnectionStats {
  connectedAt?: string;
  lastActivity?: string | undefined;
  reconnectAttempts: number;
  totalConnections: number;
}

/**
 * Simple Connection Manager
 * Handles connection, authentication, and reconnection logic
 */
class SimpleConnectionManager {
  private socket: Socket | null = null;
  private config: SimpleSocketClientConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionStats: ConnectionStats = {
    reconnectAttempts: 0,
    totalConnections: 0,
  };

  constructor(config: SimpleSocketClientConfig) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:88",
      path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      autoConnect: config.autoConnect ?? true,
      debug: config.debug ?? process.env.NODE_ENV === "development",
      reconnection: {
        enabled: config.reconnection?.enabled ?? true,
        maxAttempts: config.reconnection?.maxAttempts ?? 5,
        initialDelay: config.reconnection?.initialDelay ?? 1000,
        maxDelay: config.reconnection?.maxDelay ?? 10000,
      },
    };
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.cleanup();
    }

    // Use httpOnly cookie for authentication instead of client-side token
    // This is more secure and prevents XSS attacks
    const { io } = await import("socket.io-client");
    const socketOptions: any = {
      path: this.config.path || "/socket.io",
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: false, // We handle reconnection ourselves
      withCredentials: true, // Send httpOnly cookies with request
    };
    
    this.socket = io(this.config.url!, socketOptions);

    this.connectionStats.totalConnections++;
    this.connectionStats.connectedAt = new Date().toISOString();

    return this.socket;
  }

  disconnect(): void {
    this.cleanup();
  }

  reconnect(): Promise<Socket> {
    const reconnectionConfig = this.config.reconnection!;
    
    if (!reconnectionConfig.enabled) {
      throw new Error("Reconnection is disabled");
    }

    if (this.reconnectAttempts >= reconnectionConfig.maxAttempts) {
      throw new Error("Maximum reconnection attempts exceeded");
    }

    this.cleanup();

    const delay = Math.min(
      reconnectionConfig.initialDelay * Math.pow(2, this.reconnectAttempts),
      reconnectionConfig.maxDelay
    );

    return new Promise((resolve, reject) => {
      this.reconnectTimeout = setTimeout(async () => {
        try {
          this.reconnectAttempts++;
          this.connectionStats.reconnectAttempts++;
          const socket = await this.connect();
          resolve(socket);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionStats(): ConnectionStats {
    return {
      ...this.connectionStats,
      lastActivity: this.socket ? new Date().toISOString() : undefined,
    };
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

/**
 * Simple Event Manager
 * Handles event listeners and state management
 */
class SimpleEventManager {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private state: SocketState = "disconnected";
  private stateChangeListeners: Set<(state: SocketState) => void> = new Set();

  constructor(private connectionManager: SimpleConnectionManager) {
    // Setup listeners will be called after connection is established
  }

  setupConnectionListeners(): void {
    const socket = this.connectionManager.getSocket();
    if (!socket) return;

    socket.on("connect", () => {
      this.setState("connected");
      this.connectionManager.resetReconnectAttempts();
      
      // Send handshake request immediately after connection
      console.debug("Sending handshake request...");
      socket.emit(SOCKET_EVENTS.HANDSHAKE_REQUEST, {
        timestamp: Date.now(),
        clientId: socket.id
      });
    });

    socket.on("disconnect", () => {
      this.setState("disconnected");
    });

    socket.on("connect_error", (error: Error) => {
      this.setState("error");
      console.error("Socket connection error:", error);
    });

    socket.on(SOCKET_EVENTS.HANDSHAKE_RESPONSE, (data: any) => {
      console.debug("Handshake response received:", data);
      if (data.success) {
        console.debug("Handshake successful");
      } else {
        console.error("Handshake failed:", data.error);
      }
    });

    socket.on(SOCKET_EVENTS.SERVER_READY, (data: any) => {
      console.debug("Server ready received:", data);
    });

    socket.on(SOCKET_EVENTS.AUTH_ERROR, (data: any) => {
      console.error("Authentication error:", data);
      this.setState("error");
    });

    // Apply any queued listeners
    this.applyQueuedListeners();
  }

  private applyQueuedListeners(): void {
    const socket = this.connectionManager.getSocket();
    if (!socket) return;

    // Register all queued listeners with the socket
    this.listeners.forEach((listeners, event) => {
      socket.on(event, (...args: any[]) => {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach(listener => listener(...args));
        }
      });
    });
  }

  on(event: string, listener: (...args: any[]) => void): void {
    // Queue the listener regardless of connection state
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }

    // If socket is already connected, register immediately
    const socket = this.connectionManager.getSocket();
    if (socket && socket.connected) {
      // Check if this is the first listener for this event
      if (eventListeners && eventListeners.size === 1) {
        socket.on(event, (...args: any[]) => {
          const listeners = this.listeners.get(event);
          if (listeners) {
            listeners.forEach(listener => listener(...args));
          }
        });
      }
    }
  }

  off(event: string, listener?: (...args: any[]) => void): void {
    const socket = this.connectionManager.getSocket();
    if (!socket) return;

    const listeners = this.listeners.get(event);
    if (!listeners) return;

    if (listener) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        socket.off(event);
        this.listeners.delete(event);
      }
    } else {
      socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event: string, ...args: any[]): void {
    const socket = this.connectionManager.getSocket();
    if (!socket) {
      console.warn("Cannot emit event - socket not connected");
      return;
    }

    socket.emit(event, ...args);
    this.updateActivity();
  }

  getState(): SocketState {
    return this.state;
  }

  onStateChange(listener: (state: SocketState) => void): void {
    this.stateChangeListeners.add(listener);
  }

  offStateChange(listener: (state: SocketState) => void): void {
    this.stateChangeListeners.delete(listener);
  }

  private setState(newState: SocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeListeners.forEach(listener => listener(newState));
      
      // Dispatch custom events for useSocket hook
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('socket:state', { 
          detail: { state: newState } 
        }));
        
        // Dispatch connected event specifically when connected
        if (newState === 'connected') {
          window.dispatchEvent(new CustomEvent('socket:connected', {
            detail: { connected: true }
          }));
        }
      }
    }
  }

  private updateActivity(): void {
    // Activity is tracked in getConnectionStats
    // This method is kept for future enhancements
  }

  cleanup(): void {
    this.listeners.clear();
    this.stateChangeListeners.clear();
  }
}

/**
 * Simple Notification Manager
 * Handles user notifications and error display
 */
class SimpleNotificationManager {
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  showConnectionError(userMessage: string, technicalMessage?: string): void {
    console.error("Connection Error:", userMessage, technicalMessage);

    // Show user-friendly notification
    if (typeof window !== 'undefined') {
      // You can integrate with your preferred notification system here
      // For now, just log the error
      console.warn("Connection error notification:", userMessage);
    }
  }

  showSessionExpired(reason: string, displayMessage?: string): void {
    console.warn("Session expired:", reason, displayMessage);

    // Trigger logout flow
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired', {
        detail: { reason, displayMessage }
      }));
    }
  }

  debugLog(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[SimpleSocketClient] ${message}`, ...args);
    }
  }
}

/**
 * Simplified Socket Client
 * Consolidates functionality into 3 essential managers
 */
export class SimpleSocketClient {
  private connectionManager: SimpleConnectionManager;
  private eventManager: SimpleEventManager;
  private notificationManager: SimpleNotificationManager;
  private isDestroyed = false;

  constructor(config: SimpleSocketClientConfig = {}) {
    this.connectionManager = new SimpleConnectionManager(config);
    this.notificationManager = new SimpleNotificationManager(config.debug);
    this.eventManager = new SimpleEventManager(this.connectionManager);
  }

  async connect(): Promise<Socket> {
    if (this.isDestroyed) {
      throw new Error("Socket client has been destroyed");
    }

    try {
      this.notificationManager.debugLog("Starting connection...");
      const socket = await this.connectionManager.connect();

      // Re-setup event listeners after connection
      this.eventManager = new SimpleEventManager(this.connectionManager);
      this.eventManager.setupConnectionListeners();

      this.notificationManager.debugLog("Connected successfully");
      return socket;
    } catch (error) {
      this.notificationManager.showConnectionError(
        "Failed to connect",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  disconnect(): void {
    if (this.isDestroyed) return;

    this.notificationManager.debugLog("Disconnecting...");
    this.connectionManager.disconnect();
    this.eventManager.cleanup();
  }

  async reconnect(): Promise<Socket> {
    if (this.isDestroyed) {
      throw new Error("Socket client has been destroyed");
    }

    try {
      this.notificationManager.debugLog("Starting reconnection...");
      const socket = await this.connectionManager.reconnect();

      // Re-setup event listeners after reconnection
      this.eventManager = new SimpleEventManager(this.connectionManager);
      this.eventManager.setupConnectionListeners();

      this.notificationManager.debugLog("Reconnected successfully");
      return socket;
    } catch (error) {
      this.notificationManager.showConnectionError(
        "Failed to reconnect",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  getSocket(): Socket | null {
    return this.connectionManager.getSocket();
  }

  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  getState(): SocketState {
    return this.eventManager.getState();
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventManager.on(event, listener);
  }

  off(event: string, listener?: (...args: any[]) => void): void {
    this.eventManager.off(event, listener);
  }

  emit(event: string, ...args: any[]): void {
    this.eventManager.emit(event, ...args);
  }

  onStateChange(listener: (state: SocketState) => void): void {
    this.eventManager.onStateChange(listener);
  }

  offStateChange(listener: (state: SocketState) => void): void {
    this.eventManager.offStateChange(listener);
  }

  getConnectionStats(): ConnectionStats {
    return this.connectionManager.getConnectionStats();
  }

  cleanup(): void {
    if (this.isDestroyed) return;

    this.notificationManager.debugLog("Cleaning up...");
    this.disconnect();
    this.isDestroyed = true;
  }
}

// Create singleton instance for backward compatibility
const simpleSocketClient = new SimpleSocketClient();

// Export for backward compatibility
export { SimpleSocketClient as SocketClient };
export { simpleSocketClient as socketClient };
export default simpleSocketClient;