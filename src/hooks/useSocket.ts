"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { socketClient, SocketClient, SocketState } from "@/lib/SocketClient";
import type { Socket } from "socket.io-client";
import { isAuthenticated } from "@/utils/auth-utils";

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isReady: boolean;
  connectionState: SocketState;
  error: string | null;
  reconnect: () => void;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
  off: (event: string, listener?: (...args: any[]) => void) => void;
  waitForReady: (timeoutMs?: number) => Promise<boolean>;
  getConnectionStats: () => any;
}

/**
 * Simplified Socket Hook
 *
 * Provides a clean React interface to the SocketClient with state management
 * for connection status, errors, and basic socket operations.
 *
 * Replaces the complex use-socket.ts and socket management parts of use-messaging-socket.ts
 */
export const useSocket = (): UseSocketReturn => {
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<SocketState>("disconnected");
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and state management
  const mountedRef = useRef(true);
  const stateUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe state update that checks if component is mounted
  const safeSetState = useCallback((updater: () => void) => {
    if (mountedRef.current) {
      updater();
    }
  }, []);

  // Debounced state sync to prevent excessive updates
  const syncState = useCallback(() => {
    if (stateUpdateTimeoutRef.current) {
      clearTimeout(stateUpdateTimeoutRef.current);
    }

    stateUpdateTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const currentSocket = socketClient.getSocket();
      const currentState = socketClient.getState();
      const currentConnected = socketClient.isConnected();

      safeSetState(() => {
        setSocket(currentSocket);
        setConnectionState(currentState);
        setIsConnected(currentConnected);

        // Clear error when connected
        if (currentConnected && currentState === "connected") {
          setError(null);
        }
      });
    }, 50); // Small debounce to batch updates
  }, [safeSetState]);

  // Initialize socket client and sync state
  useEffect(() => {
    mountedRef.current = true;

    // Initial state sync
    syncState();

    // Set up periodic state sync
    const syncInterval = setInterval(() => {
      if (mountedRef.current) {
        syncState();
      }
    }, 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(syncInterval);

      if (stateUpdateTimeoutRef.current) {
        clearTimeout(stateUpdateTimeoutRef.current);
        stateUpdateTimeoutRef.current = null;
      }
    };
  }, [syncState]);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthLogin = () => {
      console.log(
        "[useSocket] Authentication login detected, reconnecting socket"
      );

      // Check if user is actually authenticated before attempting connection
      if (!isAuthenticated()) {
        console.log("[useSocket] User not authenticated, skipping connection");
        return;
      }

      // Increased delay to ensure cookies are properly set
      setTimeout(() => {
        if (mountedRef.current && isAuthenticated()) {
          console.log("[useSocket] Attempting socket connection after login");
          socketClient.connect().catch((error) => {
            console.error(
              "[useSocket] Failed to reconnect after login:",
              error
            );
            if (mountedRef.current) {
              setError(
                "Failed to reconnect after login. Please refresh the page."
              );
            }
          });
        }
      }, 1000); // Increased from 500ms to 1000ms
    };

    const handleAuthLogout = () => {
      console.log(
        "[useSocket] Authentication logout detected, disconnecting socket"
      );
      socketClient.disconnect();
      safeSetState(() => {
        setError("User logged out");
      });
    };

    const handleSocketAuthRequired = () => {
      console.log("[useSocket] Socket authentication required");
      safeSetState(() => {
        setError(
          "Authentication required. Please refresh the page and log in again."
        );
      });
    };

    // Listen for authentication events
    window.addEventListener("auth:login", handleAuthLogin);
    window.addEventListener("auth:logout", handleAuthLogout);
    window.addEventListener("socket:auth-required", handleSocketAuthRequired);

    return () => {
      window.removeEventListener("auth:login", handleAuthLogin);
      window.removeEventListener("auth:logout", handleAuthLogout);
      window.removeEventListener(
        "socket:auth-required",
        handleSocketAuthRequired
      );
    };
  }, [safeSetState]);

  // Monitor connection state changes for error handling
  useEffect(() => {
    const updateError = () => {
      if (!mountedRef.current) return;

      const state = socketClient.getState();
      const connected = socketClient.isConnected();

      let errorMessage: string | null = null;

      switch (state) {
        case "error":
          errorMessage = "Connection error occurred";
          break;
        case "auth_failed":
          errorMessage =
            "Authentication failed. Please refresh and log in again.";
          break;
        case "disconnected":
          if (!connected) {
            errorMessage = "Connection lost. Attempting to reconnect...";
          }
          break;
        case "connecting":
        case "reconnecting":
          errorMessage = null; // Clear error during connection attempts
          break;
        case "connected":
          errorMessage = null; // Clear error when connected
          break;
      }

      safeSetState(() => {
        setError(errorMessage);
      });
    };

    updateError();
  }, [connectionState, isConnected, safeSetState]);

  // Public API methods
  const reconnect = useCallback(() => {
    if (!mountedRef.current) return;

    console.log("[useSocket] Manual reconnection requested");
    safeSetState(() => {
      setError(null);
    });

    socketClient.connect().catch((error) => {
      console.error("[useSocket] Manual reconnection failed:", error);
      if (mountedRef.current) {
        setError("Reconnection failed");
      }
    });
  }, [safeSetState]);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketClient.emit(event, ...args);
  }, []);

  const on = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      socketClient.on(event, listener);
    },
    []
  );

  const off = useCallback(
    (event: string, listener?: (...args: any[]) => void) => {
      socketClient.off(event, listener);
    },
    []
  );

  const waitForReady = useCallback(
    async (timeoutMs: number = 10000): Promise<boolean> => {
      if (!mountedRef.current) {
        return false;
      }

      // If already connected, resolve immediately
      if (isConnected && connectionState === "connected") {
        return true;
      }

      // If in error state, reject immediately
      if (connectionState === "error" || connectionState === "auth_failed") {
        return false;
      }

      return new Promise((resolve) => {
        const startTime = Date.now();

        const checkReady = () => {
          if (!mountedRef.current) {
            resolve(false);
            return;
          }

          const currentState = socketClient.getState();
          const currentConnected = socketClient.isConnected();

          if (currentConnected && currentState === "connected") {
            resolve(true);
          } else if (
            currentState === "error" ||
            currentState === "auth_failed"
          ) {
            resolve(false);
          } else if (Date.now() - startTime >= timeoutMs) {
            resolve(false);
          } else {
            setTimeout(checkReady, 100);
          }
        };

        checkReady();
      });
    },
    [isConnected, connectionState]
  );

  const getConnectionStats = useCallback(() => {
    return socketClient.getConnectionStats();
  }, []);

  // Computed ready state
  const isReady = isConnected && connectionState === "connected";

  return {
    socket,
    isConnected,
    isReady,
    connectionState,
    error,
    reconnect,
    emit,
    on,
    off,
    waitForReady,
    getConnectionStats,
  };
};

export default useSocket;
