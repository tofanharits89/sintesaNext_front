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
  // Don't initialize socket on login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
  
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<SocketState>(isLoginPage ? "disconnected" : "disconnected");
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
    }, 10); // Reduced debounce for faster updates
  }, [safeSetState]);

  // Initialize socket client and sync state
  useEffect(() => {
    mountedRef.current = true;

    // Skip socket initialization on login page
    if (isLoginPage) {
      return;
    }

    // Initial state sync
    syncState();

    // Event-driven state sync instead of polling
    const handleStateChange = () => syncState();
    
    // Immediate state sync for connection events (no debounce)
    const handleConnect = () => {
      if (!mountedRef.current) return;
      const currentSocket = socketClient.getSocket();
      const currentState = socketClient.getState();
      const currentConnected = socketClient.isConnected();
      
      safeSetState(() => {
        setSocket(currentSocket);
        setConnectionState(currentState);
        setIsConnected(currentConnected);
        setError(null); // Clear error immediately on connect
      });
    };
    
    socketClient.on('connect', handleConnect);
    socketClient.on('disconnect', handleStateChange);
    socketClient.on('error', handleStateChange);
    socketClient.on('reconnect', handleConnect);

    // Auto-connect if not connected and we have auth cookies
    const checkAndConnect = () => {
      if (!socketClient.isConnected() && !isLoginPage) {
        // Use the proper auth check function instead of manual cookie checking
        const hasAuth = isAuthenticated();
        
        if (hasAuth) {
          socketClient.connect().catch(() => {
            // Connection failed, but don't show error immediately
            // Let the retry logic handle it
          });
        }
      }
    };

    // Check connection after a brief delay to allow for page initialization
    // Use shorter delay if user just logged in
    const isPostLogin = sessionStorage.getItem('just_logged_in') === 'true';
    const delay = isPostLogin ? 200 : 500; // Faster connection attempt after login
    
    const connectTimeout = setTimeout(checkAndConnect, delay);

    return () => {
      mountedRef.current = false;
      
      clearTimeout(connectTimeout);
      
      socketClient.off('connect', handleConnect);
      socketClient.off('disconnect', handleStateChange);
      socketClient.off('error', handleStateChange);
      socketClient.off('reconnect', handleConnect);

      if (stateUpdateTimeoutRef.current) {
        clearTimeout(stateUpdateTimeoutRef.current);
        stateUpdateTimeoutRef.current = null;
      }
    };
  }, [syncState, isLoginPage]);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthLogin = () => {
      // Skip socket connection on login page
      if (isLoginPage) {
        return;
      }

      // Don't check isAuthenticated() immediately as cookies might not be set yet
      // Instead, wait for cookies to be set and then attempt connection
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = 200; // Check every 200ms

      const attemptConnection = () => {
        attempts++;
        
        // Use the proper auth check function
        const hasAuth = isAuthenticated();
        
        if (hasAuth || attempts >= maxAttempts) {
          // Auth is available or we've reached max attempts, try to connect
          if (mountedRef.current && !isLoginPage) {
            // Clear any existing error before attempting connection
            safeSetState(() => {
              setError(null);
            });
            
            socketClient.connect().catch((error) => {
              if (mountedRef.current) {
                console.warn("Socket connection failed after login:", error);
                // Don't set error immediately, let the connection status component handle it
              }
            });
          }
        } else {
          // Auth not ready yet, try again
          setTimeout(attemptConnection, checkInterval);
        }
      };

      // Start the connection attempt process with a longer delay after login
      // to give the server time to fully process the login
      const isPostLogin = sessionStorage.getItem('just_logged_in') === 'true';
      const initialDelay = isPostLogin ? 1000 : 300; // 1 second after login, 300ms otherwise
      
      setTimeout(attemptConnection, initialDelay);
    };

    const handleAuthLogout = () => {
      socketClient.disconnect();
      safeSetState(() => {
        setError("User logged out");
      });
    };

    const handlePostLoginRetry = () => {
      // More aggressive retry logic specifically for post-login scenarios
      let retryCount = 0;
      const maxRetries = 5;
      const baseDelay = 1000;

      const retryConnection = () => {
        if (retryCount >= maxRetries || mountedRef.current === false) {
          return;
        }

        retryCount++;
        const delay = baseDelay * Math.min(retryCount, 3); // Cap delay at 3 seconds

        setTimeout(() => {
          if (mountedRef.current && !socketClient.isConnected() && !isLoginPage) {
            socketClient.connect().catch(() => {
              // If this retry fails, try again
              retryConnection();
            });
          }
        }, delay);
      };

      // Start retry sequence
      retryConnection();
    };

    const handleSocketAuthRequired = () => {
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
    
    // Listen for custom retry events (can be triggered by UI components)
    window.addEventListener("socket:retry-connection", handlePostLoginRetry);

    return () => {
      window.removeEventListener("auth:login", handleAuthLogin);
      window.removeEventListener("auth:logout", handleAuthLogout);
      window.removeEventListener(
        "socket:auth-required",
        handleSocketAuthRequired
      );
      window.removeEventListener("socket:retry-connection", handlePostLoginRetry);
    };
  }, [safeSetState]);

  // Monitor connection state changes for error handling
  useEffect(() => {
    const updateError = () => {
      if (!mountedRef.current) return;

      const state = socketClient.getState();
      const connected = socketClient.isConnected();
      const isPostLogin = sessionStorage.getItem('just_logged_in') === 'true';

      let errorMessage: string | null = null;

      switch (state) {
        case "error":
          errorMessage = isPostLogin ? null : "Connection error occurred";
          break;
        case "auth_failed":
          errorMessage =
            "Authentication failed. Please refresh and log in again.";
          break;
        case "disconnected":
          if (!connected && !isPostLogin) {
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
    safeSetState(() => {
      setError(null);
    });

    socketClient.connect().catch((error) => {
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
