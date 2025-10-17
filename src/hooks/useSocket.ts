"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { socketClient, SocketState } from "@/lib/socket-client";
import type { Socket } from "socket.io-client";
import { useAuthSessionStore } from "@/stores/session-store";

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
  getConnectionStats: () => any;
}

/**
 * Simplified Socket Hook
 * Provides a clean React interface to the SocketClient with reliable state management
 */
export const useSocket = (): UseSocketReturn => {
  const [isClient, setIsClient] = useState(false);
  const [state, setState] = useState(() => ({
    socket: socketClient.getSocket(),
    isConnected: socketClient.isConnected(),
    connectionState: socketClient.getState(),
    error: null as string | null,
  }));
  
  // Track if we've attempted initial connection
  const hasAttemptedConnection = useRef(false);
  
  // Get authentication state
  const isAuthenticated = useAuthSessionStore((state) => state.isAuthenticated);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync state with socket client
  const syncState = useCallback(() => {
    setState({
      socket: socketClient.getSocket(),
      isConnected: socketClient.isConnected(),
      connectionState: socketClient.getState(),
      error: socketClient.getState() === "error" ? "Connection error" : null,
    });
  }, []);

  // Listen to socket state changes
  useEffect(() => {
    if (!isClient) return;

    const handleStateChange = () => {
      try {
        syncState();
      } catch (error) {
        console.error('Error in handleStateChange:', error);
      }
    };
    
    const handleConnect = () => {
      try {
        setState(prev => ({ ...prev, isConnected: true, connectionState: "connected", error: null }));
      } catch (error) {
        console.error('Error in handleConnect:', error);
      }
    };
    
    const handleDisconnect = () => {
      try {
        setState(prev => ({ ...prev, isConnected: false, connectionState: "disconnected" }));
      } catch (error) {
        console.error('Error in handleDisconnect:', error);
      }
    };

    // Listen to custom events from SocketClient
    window.addEventListener('socket:state', handleStateChange);
    window.addEventListener('socket:connected', handleConnect);

    // Initial sync
    syncState();

    return () => {
      // Comprehensive cleanup with error handling
      try {
        window.removeEventListener('socket:state', handleStateChange);
        window.removeEventListener('socket:connected', handleConnect);
      } catch (error) {
        console.error('Error removing socket event listeners:', error);
      }
    };
  }, [isClient, syncState]);

  // Auto-connect on mount if already authenticated (handles page refresh)
  useEffect(() => {
    if (!isClient || hasAttemptedConnection.current) return;
    
    // Check if user is authenticated and socket is not connected/connecting
    const currentState = socketClient.getState();
    if (isAuthenticated && currentState !== "connected" && currentState !== "connecting") {
      hasAttemptedConnection.current = true;
      
      console.log('[useSocket] User authenticated on mount, connecting socket...');
      
      socketClient.connect()
        .then(() => {
          console.log('[useSocket] Socket connected successfully on mount');
          syncState();
        })
        .catch((error) => {
          console.error('[useSocket] Failed to connect socket on mount:', error);
          // Reset flag on error so it can retry
          hasAttemptedConnection.current = false;
          syncState();
        });
    } else if (currentState === "connected") {
      console.log('[useSocket] Socket already connected on mount');
      hasAttemptedConnection.current = true;
      syncState();
    } else if (currentState === "connecting") {
      console.log('[useSocket] Socket connection already in progress');
      hasAttemptedConnection.current = true;
    }
  }, [isClient, isAuthenticated, syncState]);

  // Handle authentication events
  useEffect(() => {
    if (!isClient) return;

    const handleLogin = async () => {
      try {
        console.log('[useSocket] Login detected, connecting socket...');
        
        // Mark that we've attempted connection
        hasAttemptedConnection.current = true;
        
        // Connect socket after successful login
        try {
          await socketClient.connect();
          console.log('[useSocket] Socket connected successfully after login');
        } catch (error) {
          console.error('[useSocket] Failed to connect socket after login:', error);
        }
        
        // Sync state after connection attempt
        syncState();
      } catch (error) {
        console.error('Error in handleLogin:', error);
      }
    };

    const handleLogout = () => {
      try {
        console.log('[useSocket] Logout detected, disconnecting socket...');
        
        // Reset connection attempt flag
        hasAttemptedConnection.current = false;
        
        socketClient.disconnect();
        syncState();
      } catch (error) {
        console.error('Error in handleLogout:', error);
      }
    };

    const handleAuthExpired = (event: any) => {
      try {
        console.log('Auth expired event received:', event);
        
        // Prevent multiple simultaneous handlers
        if (typeof window !== 'undefined' && 
            ((window as any).__handlingSessionExpired || (window as any).__isLoggingOut)) {
          console.log('[useSocket] Already handling session expiration, skipping...');
          return;
        }

        const { reason, displayMessage } = event.detail || {};

        // Show user-friendly message about being logged out from another device
        const message = displayMessage || 'Your session has expired. Please log in again.';
        const isFromOtherDevice = reason === 'LOGGED_IN_ELSEWHERE';

        // Show toast notification
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error(message, {
            duration: 5000,
            position: 'top-center'
          });
        } else {
          // Fallback to alert if toast not available
          alert(message);
        }

        // Disconnect socket immediately
        socketClient.disconnect();

        // Note: Cookie clearing and redirect are handled by SimpleSocketClient.showSessionExpired
        // This handler just shows the notification and disconnects the socket
        // to avoid duplicate cleanup

      } catch (error) {
        console.error('Error in handleAuthExpired:', error);
      }
    };

    const handleTokenRefresh = (event: any) => {
      try {
        console.log('Token refresh event received:', event);
        // Sync state after token refresh
        syncState();
      } catch (error) {
        console.error('Error in handleTokenRefresh:', error);
      }
    };

    // Register all event listeners
    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('token:refresh', handleTokenRefresh);

    return () => {
      // Comprehensive cleanup with error handling
      try {
        window.removeEventListener('auth:login', handleLogin);
        window.removeEventListener('auth:logout', handleLogout);
        window.removeEventListener('auth:expired', handleAuthExpired);
        window.removeEventListener('token:refresh', handleTokenRefresh);
        
        // Clear any pending timeouts
        const timeoutId = (handleLogin as any)._timeoutId;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error removing auth event listeners:', error);
      }
    };
  }, [isClient, syncState]);

  // Public API methods
  const reconnect = useCallback(() => {
    socketClient.connect().catch(() => {});
    syncState();
  }, [syncState]);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketClient.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, listener: (...args: any[]) => void) => {
    socketClient.on(event, listener);
  }, []);

  const off = useCallback((event: string, listener?: (...args: any[]) => void) => {
    socketClient.off(event, listener);
  }, []);

  const getConnectionStats = useCallback(() => {
    return socketClient.getConnectionStats();
  }, []);

  const isReady = state.isConnected && state.connectionState === "connected";

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cleanup any socket references when component unmounts
      try {
        // Note: We don't disconnect the socket here as it might be used by other components
        // Just cleanup any component-specific resources
        setState(prev => ({ ...prev, socket: null }));
      } catch (error) {
        console.error('Error during component cleanup:', error);
      }
    };
  }, []);

  return {
    ...state,
    isReady,
    reconnect,
    emit,
    on,
    off,
    getConnectionStats,
  };
};

export default useSocket;