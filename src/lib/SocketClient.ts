"use client";

/**
 * Simplified SocketClient - Backward Compatibility Wrapper
 *
 * This file maintains backward compatibility with the original SocketClient API
 * while internally using the simplified architecture with only 3 essential managers.
 */

// Re-export from the simplified implementation
export {
  SocketClient,
  socketClient,
  type SocketState,
  type SimpleSocketClientConfig as SocketClientConfig,
  type ConnectionStats
} from "./socket/SimpleSocketClient";

// Re-export utilities for compatibility with existing imports
import { socketClient } from "./socket/SimpleSocketClient";

// Backward compatibility exports
export { socketClient as default };

// Utility functions for backward compatibility
export function getSocket() {
  return socketClient.getSocket();
}

export function connectSocket() {
  return socketClient.connect();
}

export function disconnectSocket() {
  socketClient.disconnect();
}

export function reconnectSocket() {
  return socketClient.reconnect().catch(() => {});
}

export function isSocketConnected() {
  return socketClient.isConnected();
}

export function getSocketConnectionState() {
  const state = socketClient.getState();
  switch (state) {
    case "connected":
      return "connected";
    case "connecting":
    case "reconnecting":
      return "connecting";
    default:
      return "disconnected";
  }
}

export function getSocketState() {
  return socketClient.getState();
}

export function resetSocketReconnection() {
  return socketClient.reconnect().catch(() => {});
}

export function cleanupSocket() {
  socketClient.cleanup();
}

export function getSocketConnectionStats() {
  return socketClient.getConnectionStats();
}

// Export socket utilities that might be imported
export { getAuthTokenFromCookie, clearAuthToken } from "@/lib/cookieManager";