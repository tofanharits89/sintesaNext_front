"use client";

import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { parse } from "cookie";
import { ReconnectionManager } from "@/utils/reconnectionLogic";
import { getAuthTokenFromCookie, waitForAuthToken } from "@/utils/auth-utils";

// Socket connection states
export type SocketState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "auth_failed";

// Socket client configuration
interface SocketClientConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  debug?: boolean;
}

/**
 * Simplified Socket Client
 * Consolidates socket functionality with clean API and simplified authentication
 */
export class SocketClient {
  private socket: Socket | null = null;
  private state: SocketState = "disconnected";
  private config: Required<SocketClientConfig>;
  private reconnectionManager: ReconnectionManager;
  private eventListenersAttached = false;
  private readonly debugMode: boolean;

  private listenerRegistry: Map<string, Set<(...args: any[]) => void>> =
    new Map();

  constructor(config: SocketClientConfig = {}) {
    this.config = {
      url:
        config.url ||
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:88",
      path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
      autoConnect: config.autoConnect ?? true,
      debug: config.debug ?? process.env.NODE_ENV === "development",
    };

    this.debugMode = this.config.debug;

    // Initialize reconnection manager with callbacks
    this.reconnectionManager = new ReconnectionManager({
      onConnectionStateChange: (state) => {
        this.handleReconnectionStateChange(state);
      },
      onTokenRefreshNeeded: () => {
        this.handleTokenRefresh();
      },
    });

    // Bind methods to preserve context
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleConnectError = this.handleConnectError.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleSessionExpired = this.handleSessionExpired.bind(this);

    if (this.config.autoConnect) {
      if (typeof window !== "undefined") {
        const ric = (window as any).requestIdleCallback as
          | ((cb: () => void, opts?: { timeout?: number }) => number)
          | undefined;
        if (ric) {
          ric(
            () => {
              this.connect().catch((error) => {
                this.logError("Auto-connect failed:", error);
              });
            },
            { timeout: 1500 }
          );
        } else {
          // Fallback: defer to next tick to avoid blocking initial render
          setTimeout(() => {
            this.connect().catch((error) => {
              this.logError("Auto-connect failed:", error);
            });
          }, 0);
        }
      }
    }
  }

  /**
   * Get authentication token from cookies
   */
  private getAuthToken(): string | null {
    return getAuthTokenFromCookie();
  }

  /**
   * Get authentication token with retry logic
   */
  private async getAuthTokenWithRetry(): Promise<string | null> {
    return await waitForAuthToken(10, 100);
  }

  /**
   * Create socket connection
   */
  private createSocket(): Socket {
    const token = this.getAuthToken();

    this.log("Creating socket connection:", {
      url: this.config.url,
      path: this.config.path,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
    });

    // Socket configuration
    const socketConfig: any = {
      path: this.config.path,
      transports: ["websocket", "polling"],
      withCredentials: true, // Enable credentials for httpOnly cookies
      autoConnect: false, // We'll connect manually
      reconnection: true, // Let Socket.IO handle basic reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    };

    // Add auth token if available
    if (token) {
      socketConfig.auth = { token };
    }

    const socket = io(this.config.url, socketConfig);

    // Set socket in reconnection manager
    this.reconnectionManager.setSocket(socket);

    return socket;
  }

  /**
   * Attach event listeners to socket
   */
  private attachEventListeners(): void {
    if (!this.socket || this.eventListenersAttached) {
      return;
    }

    this.socket.on("connect", this.handleConnect);
    this.socket.on("disconnect", this.handleDisconnect);
    this.socket.on("connect_error", this.handleConnectError);
    this.socket.on("error", this.handleError);
    this.socket.on("session:expired", this.handleSessionExpired);

    // Re-attach any previously registered custom listeners after (re)connect
    this.rebindRegisteredListeners();

    this.eventListenersAttached = true;
    this.log("Event listeners attached");
  }

  /**
   * Rebind all previously registered custom listeners to the current socket
   */
  private rebindRegisteredListeners(): void {
    if (!this.socket) return;
    for (const [event, listeners] of this.listenerRegistry.entries()) {
      for (const listener of listeners) {
        this.socket.on(event, listener);
      }
    }
    this.log("Rebound registered custom listeners", {
      eventCount: this.listenerRegistry.size,
    });
  }

  /**
   * Remove event listeners from socket
   */
  private removeEventListeners(): void {
    if (this.socket && this.eventListenersAttached) {
      this.socket.off("connect", this.handleConnect);
      this.socket.off("disconnect", this.handleDisconnect);
      this.socket.off("connect_error", this.handleConnectError);
      this.socket.off("error", this.handleError);
      this.socket.off("session:expired", this.handleSessionExpired);

      this.eventListenersAttached = false;
      this.log("Event listeners removed");
    }
  }

  /**
   * Handle socket connection
   */
  private handleConnect(): void {
    this.log("Socket connected successfully");
    this.setState("connected");

    // Send handshake request to prevent server timeout
    this.socket?.emit("handshake:request", {
      timestamp: Date.now(),
      clientId: this.socket?.id,
      attempt: 1,
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(reason: string): void {
    this.log("Socket disconnected:", reason);
    this.setState("disconnected");

    // Show user-friendly message for unexpected disconnections
    if (reason !== "io client disconnect") {
      toast.warning("Connection lost", {
        description: "Attempting to reconnect...",
      });
    }
  }

  /**
   * Handle socket connection error
   */
  private handleConnectError(error: any): void {
    this.logError("Socket connection error:", error);

    // Check if it's an authentication error
    const isAuthError =
      error.message?.includes("token") ||
      error.message?.includes("auth") ||
      error.message?.includes("unauthorized");

    if (isAuthError) {
      this.setState("auth_failed");
      toast.error("Authentication failed", {
        description: "Please refresh the page and log in again",
      });
    } else {
      this.setState("error");
      toast.error("Connection failed", {
        description: "Unable to connect to server",
      });
    }
  }

  /**
   * Handle socket error
   */
  private handleError(error: Error): void {
    this.logError("Socket error:", error);

    // Some servers may emit structured error envelopes
    const anyErr: any = error as any;
    const code = anyErr?.code || anyErr?.error?.code || anyErr?.reason;
    const message = anyErr?.message || anyErr?.error?.message;

    if (code === "SESSION_EXPIRED" || code === "SESSION_REVOKED") {
      // Treat as auth failure and trigger re-auth flow
      this.setState("auth_failed");
      toast.error("Session expired", {
        description: message || "Please sign in again.",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("socket:auth-required"));
      }
      // Disconnect to avoid noisy retries with invalid session
      this.socket?.disconnect();
      return;
    }

    this.setState("error");
  }

  /**
   * Handle reconnection manager state changes
   */
  private handleReconnectionStateChange(state: string): void {
    this.log("Reconnection state change:", state);

    switch (state) {
      case "connecting":
        this.setState("connecting");
        break;
      case "reconnecting":
        this.setState("reconnecting");
        break;
      case "connected":
        this.setState("connected");
        break;
      case "disconnected":
        this.setState("disconnected");
        break;
      case "failed":
        this.setState("error");
        break;
    }
  }

  /**
   * Handle token refresh
   */
  private handleTokenRefresh(): void {
    this.log("Token refresh needed, reconnecting...");

    if (this.socket) {
      // Disconnect and reconnect with new token
      this.socket.disconnect();
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000);
    }
  }

  /**
   * Set socket state
   */
  private setState(newState: SocketState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log(`State transition: ${oldState} -> ${newState}`);
    }
  }

  /**
   * Log debug messages
   */
  private log(message: string, ...args: unknown[]): void {
    // Debug logs silenced
  }

  /**
   * Log error messages
   */
  private logError(message: string, ...args: unknown[]): void {
    console.error(`[SocketClient Error] ${message}`, ...args);
  }

  // Public API methods

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

    // In cookie-only mode, proceed even when no JS-visible token exists.
    // Token will be sent via cookies (withCredentials) and validated server-side.
    const token = this.getAuthToken();

    this.setState("connecting");

    try {
      // Clean up existing socket
      if (this.socket) {
        this.removeEventListeners();
        this.socket.disconnect();
      }

      // Create new socket
      this.socket = this.createSocket();
      this.attachEventListeners();

      // Connect
      this.socket.connect();

      this.log("Connection initiated with token");
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

    if (this.socket) {
      this.removeEventListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.setState("disconnected");
  }

  /**
   * Emit an event to the server with connection state validation
   */
  public emit(event: string, ...args: any[]): void {
    if (!this.socket) {
      this.logError("Cannot emit: socket not available");
      return;
    }

    if (!this.socket.connected) {
      this.logError(
        `Cannot emit ${event}: socket not connected (state: ${this.state})`
      );
      return;
    }

    if (this.state !== "connected") {
      this.logError(
        `Cannot emit ${event}: client not in connected state (current: ${this.state})`
      );
      return;
    }

    this.socket.emit(event, ...args);
    this.log(`Emitted event: ${event}`, {
      socketConnected: this.socket.connected,
      clientState: this.state,
    });
  }

  /**
   * Listen for an event from the server
   */
  public on(event: string, listener: (...args: unknown[]) => void): void {
    // Store in registry for rebind on reconnect
    let set = this.listenerRegistry.get(event);
    if (!set) {
      set = new Set();
      this.listenerRegistry.set(event, set);
    }
    set.add(listener);

    if (!this.socket) {
      // Socket not ready yet; listener stored in registry and will be bound on connect
      this.log("Deferring listener binding until socket is available");
      return;
    }

    this.socket.on(event, listener);
    this.log(`Added listener for event: ${event}`);
  }

  /**
   * Remove event listener
   */
  public off(event: string, listener?: (...args: unknown[]) => void): void {
    // Update registry
    const set = this.listenerRegistry.get(event);
    if (set) {
      if (listener) {
        set.delete(listener);
      } else {
        set.clear();
      }
      if (set.size === 0) {
        this.listenerRegistry.delete(event);
      }
    }

    if (!this.socket) {
      // Socket not available; listener already removed from registry above
      this.log(
        `Listener removed from registry; socket not available for event: ${event}`
      );
      return;
    }

    if (listener) {
      this.socket.off(event, listener);
    } else {
      this.socket.off(event);
    }

    this.log(`Removed listener for event: ${event}`);
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
   * Force token refresh
   */
  public refreshToken(): void {
    this.reconnectionManager.forceTokenRefresh();
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats() {
    return {
      state: this.state,
      connected: this.isConnected(),
      socketId: this.socket?.id || null,
      ...this.reconnectionManager.getConnectionStats(),
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.log("Cleaning up socket client");

    this.removeEventListeners();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectionManager.cleanup();
    this.setState("disconnected");
  }

  /**
   * Handle explicit session expiration event from server
   */
  private handleSessionExpired(payload: any): void {
    this.log("Session expired event received", payload);
    this.setState("auth_failed");

    const reason = payload?.reason || "Session expired";
    
    // Disconnect socket immediately to prevent further requests
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // CRITICAL: Clear auth cookies immediately and aggressively
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Clear cookies manually first (synchronous)
      const cookiesToClear = ["accessToken", "refreshToken", "socketToken", "XSRF-TOKEN", "csrfToken"];
      const hostname = window.location.hostname;
      const paths = ["/", "/api", "/auth"];
      
      // Try all combinations - be VERY aggressive
      cookiesToClear.forEach(name => {
        paths.forEach(path => {
          // Without domain
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; max-age=0`;
          // With hostname
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${hostname}; max-age=0`;
          // With dot prefix
          if (hostname.includes('.')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${hostname}; max-age=0`;
          }
        });
      });
      
      this.log("Auth cookies cleared immediately (manual)", {
        cookiesCleared: cookiesToClear.length,
        remainingCookies: document.cookie
      });
    }

    // Show toast notification with friendly message
    const displayMessage = payload?.displayMessage || payload?.message || reason;
    const isLoggedInElsewhere = reason === 'LOGGED_IN_ELSEWHERE' || 
                                 displayMessage?.includes('another device');
    
    toast.error(
      isLoggedInElsewhere ? "Logged in from another device" : "Session expired", 
      {
        description: displayMessage,
        duration: 5000, // Longer duration for important message
      }
    );

    if (typeof window !== "undefined") {
      // Dispatch custom event for other components to handle
      window.dispatchEvent(new CustomEvent("socket:auth-required", { detail: payload }));
      window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "session_expired" } }));
      
      // CRITICAL: Wait a moment for cookies to be fully cleared before redirect
      // Also ask server to clear HttpOnly cookies (client cannot delete those)
      setTimeout(async () => {
        // Verify cookies are cleared
        const remainingCookies = document.cookie;
        console.log('[SocketClient] Cookies before redirect:', remainingCookies);
        
        // Force clear again if any auth cookies remain
        if (remainingCookies.includes('accessToken') || 
            remainingCookies.includes('refreshToken') || 
            remainingCookies.includes('socketToken')) {
          console.warn('[SocketClient] Cookies still present, clearing again');
          const cookiesToClear = ["accessToken", "refreshToken", "socketToken", "XSRF-TOKEN"];
          cookiesToClear.forEach(name => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; max-age=0`;
          });
        }
        
        // Server-side logout to clear HttpOnly cookies reliably
        try {
          const { getCsrfToken } = await import("@/utils/csrf-utils");
          let csrf = getCsrfToken();
          if (!csrf) {
            // Prime CSRF via same-origin endpoint
            try { await fetch('/api/csrf-token', { method: 'GET', credentials: 'include', cache: 'no-store' }); } catch {}
            csrf = getCsrfToken();
          }
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
            },
            body: JSON.stringify({ reason: 'session_expired' }),
            cache: 'no-store',
          }).catch(() => {});
        } catch (e) {
          // non-fatal
        }
        
        // Now redirect
        window.location.replace('/login?reason=session_expired');
      }, 100); // 100ms delay to ensure cookies are cleared
    }
  }
}

// Export singleton instance for backward compatibility
export const socketClient = new SocketClient();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    socketClient.cleanup();
  });
}

export default SocketClient;
