/**
 * Unified Socket Hook
 *
 * Simplified React hook for socket state management
 * Combines functionality from multiple hooks into one clean interface
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  socketClient,
  SocketState,
  SocketClientConfig,
} from "@/lib/socket-client";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import type { Socket } from "socket.io-client";

export interface UseUnifiedSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isReady: boolean;
  connectionState: SocketState;
  error: string | null;
  reconnect: () => void;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  off: (event: string, listener?: (...args: unknown[]) => void) => void;
  getConnectionStats: () => unknown;
  debug: boolean;
}

/**
 * Global initialization lock to prevent concurrent socket initialization across multiple hook instances
 */
const globalInitLock = {
  isInitializing: false,
  initPromise: null as Promise<void> | null,
};

/**
 * Simplified Socket Hook
 * Provides a clean React interface to the SocketClient with reliable state management
 */
export function useUnifiedSocket(
  config?: SocketClientConfig,
): UseUnifiedSocketReturn {
  const [isClient, setIsClient] = useState(false);
  const [state, setState] = useState(() => ({
    socket: socketClient.getSocket(),
    isConnected: socketClient.isConnected(),
    connectionState: socketClient.getState(),
    error: null as string | null,
    debug: config?.debug ?? false,
  }));

  const { user, isAuthenticated } = useUnifiedAuth();
  const initializedRef = useRef(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync state with socket client
  const syncState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      socket: socketClient.getSocket(),
      isConnected: socketClient.isConnected(),
      connectionState: socketClient.getState(),
      error: socketClient.getState() === "error" ? "Connection error" : null,
    }));
  }, []);

  // Listen to socket state changes
  useEffect(() => {
    if (!isClient) return;

    const handleStateChange = () => {
      syncState();
    };

    const handleConnect = () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        connectionState: "connected",
        error: null,
      }));
    };

    // Listen to custom events from SocketClient
    window.addEventListener("socket:state", handleStateChange as EventListener);
    window.addEventListener("socket:connected", handleConnect as EventListener);

    // Initial sync
    syncState();

    return () => {
      window.removeEventListener(
        "socket:state",
        handleStateChange as EventListener,
      );
      window.removeEventListener(
        "socket:connected",
        handleConnect as EventListener,
      );
    };
  }, [isClient, syncState]);

  // Auto-connect for authenticated users with global initialization lock
  useEffect(() => {
    if (!isClient || !isAuthenticated || !user) {
      return;
    }

    // Check if already initialized and connected
    if (initializedRef.current && socketClient.isConnected()) {
      syncState();
      return;
    }

    // If global initialization is in progress, wait for it
    if (globalInitLock.isInitializing && globalInitLock.initPromise) {
      globalInitLock.initPromise
        .then(() => {
          initializedRef.current = true;
          syncState();
        })
        .catch(() => {
          // Global init failed, let this instance try
        });
      return;
    }

    const initializeSocket = async () => {
      globalInitLock.isInitializing = true;

      try {
        // Check if already connected before attempting
        if (socketClient.isConnected()) {
          initializedRef.current = true;
          syncState();
          return;
        }

        setState((prev) => ({ ...prev, error: null }));

        // Check for post-login delay
        const justLoggedIn = sessionStorage.getItem("just_logged_in");
        const connectionDelay = justLoggedIn === "true" ? 500 : 0;

        if (justLoggedIn === "true") {
          sessionStorage.removeItem("just_logged_in");
        }

        if (connectionDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, connectionDelay));
        }

        await socketClient.connect();
        initializedRef.current = true;
        syncState();
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Connection failed",
        }));

        // Retry once after delay
        setTimeout(() => {
          if (!socketClient.isConnected()) {
            socketClient
              .connect()
              .then(() => {
                initializedRef.current = true;
                syncState();
              })
              .catch((retryError) => {
                console.error("Socket retry connection failed:", retryError);
              });
          }
        }, 2000);
      } finally {
        globalInitLock.isInitializing = false;
      }
    };

    globalInitLock.initPromise = initializeSocket();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount as other components might need the socket
    };
  }, [isClient, isAuthenticated, user, syncState]);

  // Handle authentication events
  useEffect(() => {
    if (!isClient) return;

    const handleLogin = () => {
      // Auto-connect after login
      setTimeout(() => {
        if (!socketClient.isConnected()) {
          socketClient
            .connect()
            .then(syncState)
            .catch(() => {});
        }
      }, 500);
    };

    const handleLogout = () => {
      // Disconnect on logout
      socketClient.disconnect();
      initializedRef.current = false;
      syncState();
    };

    const handleAuthExpired = (event: Event) => {
      console.log("Auth expired event received:", event);

      const customEvent = event as CustomEvent;
      const { displayMessage } = customEvent.detail || {};
      const message =
        displayMessage || "Your session has expired. Please log in again.";

      // Show user-friendly message
      if (typeof window !== "undefined") {
        const windowWithToast = window as Window & {
          toast?: {
            error: (
              msg: string,
              opts: { duration: number; position: string },
            ) => void;
          };
        };

        if (windowWithToast.toast) {
          windowWithToast.toast.error(message, {
            duration: 5000,
            position: "top-center",
          });
        }
      }

      // Disconnect socket
      socketClient.disconnect();
      initializedRef.current = false;
      syncState();
    };

    const handleTokenRefresh = (event: Event) => {
      console.log("Token refresh event received:", event);
      // Connection should remain active, just sync state
      syncState();
    };

    // Register auth event listeners
    window.addEventListener("auth:login", handleLogin);
    window.addEventListener("auth:logout", handleLogout);
    window.addEventListener("auth:expired", handleAuthExpired);
    window.addEventListener("token:refresh", handleTokenRefresh);

    return () => {
      window.removeEventListener("auth:login", handleLogin);
      window.removeEventListener("auth:logout", handleLogout);
      window.removeEventListener("auth:expired", handleAuthExpired);
      window.removeEventListener("token:refresh", handleTokenRefresh);
    };
  }, [isClient, syncState]);

  // Public API methods
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await socketClient.connect();
      syncState();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
    }
  }, [syncState]);

  const disconnect = useCallback(() => {
    socketClient.disconnect();
    initializedRef.current = false;
    syncState();
  }, [syncState]);

  const reconnect = useCallback(() => {
    socketClient
      .reconnect()
      .then(syncState)
      .catch(() => {});
  }, [syncState]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketClient.emit(event, ...args);
  }, []);

  const on = useCallback(
    (event: string, listener: (...args: unknown[]) => void) => {
      socketClient.on(event, listener);
    },
    [],
  );

  const off = useCallback(
    (event: string, listener?: (...args: unknown[]) => void) => {
      socketClient.off(event, listener);
    },
    [],
  );

  const getConnectionStats = useCallback(() => {
    return socketClient.getConnectionStats();
  }, []);

  const isReady = state.isConnected && state.connectionState === "connected";

  return {
    ...state,
    isReady,
    connect,
    disconnect,
    reconnect,
    emit,
    on,
    off,
    getConnectionStats,
  };
}

export default useUnifiedSocket;
