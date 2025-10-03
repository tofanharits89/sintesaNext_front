"use client";

/**
 * Legacy SocketClient - Backward Compatibility Wrapper
 *
 * This file maintains backward compatibility with the original SocketClient API
 * while internally using the new modular enterprise-grade architecture.
 */

// Re-export everything from the new modular implementation
export {
  SocketClient,
  socketClient
} from "./socket/index";

export type { SocketState } from "./socket/index";
export type { SocketClientConfig } from "./socket/types";
export type { ConnectionStats } from "./socket/types";

// Re-export utilities for compatibility with existing imports
import { socketClient } from "./socket/index";

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
  socketClient.disconnect();
  return socketClient.connect().catch(() => {});
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
      return "connecting";
    default:
      return "disconnected";
  }
}

export function getSocketState() {
  return socketClient.getState();
}

export function resetSocketReconnection() {
  socketClient.connect().catch(() => {});
}

export function cleanupSocket() {
  socketClient.cleanup();
}

export function getSocketConnectionStats() {
  return socketClient.getConnectionStats();
}

// Export socket utilities that might be imported
export { getAuthTokenFromCookie, clearAuthToken } from "@/utils/auth-utils";