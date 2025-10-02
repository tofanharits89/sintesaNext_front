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
    const instance = socketClient.getInstance();
    setState({
      socket: instance.getSocket(),
      isConnected: instance.isConnected(),
      connectionState: instance.getState(),
      error: instance.getState() === "error" ? "Connection error" : null,
    });
  }, []);

  // Listen to socket state changes
  useEffect(() => {
    if (!isClient) return;

    const handleStateChange = () => syncState();
    const handleConnect = () => {
      setState(prev => ({ ...prev, isConnected: true, connectionState: "connected", error: null }));
    };
    const handleDisconnect = () => {
      setState(prev => ({ ...prev, isConnected: false, connectionState: "disconnected" }));
    };

    // Listen to custom events from SocketClient
    window.addEventListener('socket:state', handleStateChange);
    window.addEventListener('socket:connected', handleConnect);

    // Initial sync
    syncState();

    return () => {
      window.removeEventListener('socket:state', handleStateChange);
      window.removeEventListener('socket:connected', handleConnect);
    };
  }, [isClient, syncState]);

  // Handle authentication events
  useEffect(() => {
    if (!isClient) return;

    const handleLogin = () => {
      // Let SocketClient handle post-login connection automatically
      setTimeout(syncState, 1000);
    };

    const handleLogout = () => {
      socketClient.disconnect();
      syncState();
    };

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
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
