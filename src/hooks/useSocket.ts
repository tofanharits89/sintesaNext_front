"use client";

import { useEffect, useState, useCallback } from "react";
import { socketClient, SocketState } from "@/lib/SocketClient";
import type { Socket } from "socket.io-client";

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

  // Handle authentication events
  useEffect(() => {
    if (!isClient) return;

    const handleLogin = () => {
      try {
        // Let SocketClient handle post-login connection automatically
        const timeoutId = setTimeout(syncState, 1000);
        // Store timeout ID for cleanup
        (handleLogin as any)._timeoutId = timeoutId;
      } catch (error) {
        console.error('Error in handleLogin:', error);
      }
    };

    const handleLogout = () => {
      try {
        socketClient.disconnect();
        syncState();
      } catch (error) {
        console.error('Error in handleLogout:', error);
      }
    };

    // Add additional auth event listeners for comprehensive coverage
    const handleAuthExpired = (event: any) => {
      try {
        console.log('Auth expired event received:', event);
        setState(prev => ({ ...prev, error: 'Session expired', connectionState: 'disconnected' }));
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
