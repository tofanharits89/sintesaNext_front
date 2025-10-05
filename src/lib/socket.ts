"use client";

import { Socket } from "socket.io-client";
import { socketClient, SocketClient, type SocketState } from "./socket/SimpleSocketClient";
import { getAuthTokenFromCookie, clearAuthToken } from "@/utils/auth-utils";

// Re-export types and utilities for backward compatibility
export type { SocketState };
export { getAuthTokenFromCookie, clearAuthToken };



/**
 * Connect to the socket server
 * Backward compatibility wrapper for SocketClient.connect()
 */
export async function connectSocket(): Promise<Socket> {
  await socketClient.connect();
  const socket = socketClient.getSocket();
  if (!socket) {
    throw new Error("Failed to establish socket connection");
  }
  return socket;
}

/**
 * Get the current socket instance
 * Backward compatibility wrapper for SocketClient.getSocket()
 */
export function getSocket(): Socket | null {
  return socketClient.getSocket();
}

/**
 * Disconnect from the socket server
 * Backward compatibility wrapper for SocketClient.disconnect()
 */
export function disconnectSocket(): void {
  socketClient.disconnect();
}

/**
 * Reconnect to the socket server
 * Backward compatibility wrapper for SocketClient.connect()
 */
export function reconnectSocket(): Socket | null {
  // Trigger reconnection by disconnecting and connecting again
  socketClient.disconnect();
  socketClient.connect().catch((error: unknown) => {
    console.error("[Socket] Reconnection failed:", error);
  });
  return socketClient.getSocket();
}

/**
 * Check if socket is connected
 * Backward compatibility wrapper for SocketClient.isConnected()
 */
export function isSocketConnected(): boolean {
  return socketClient.isConnected();
}

/**
 * Get socket connection state
 * Backward compatibility wrapper for SocketClient.getState()
 */
export function getSocketConnectionState():
  | "connected"
  | "disconnected"
  | "connecting" {
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

/**
 * Get current socket state
 * Backward compatibility wrapper for SocketClient.getState()
 */
export function getSocketState(): SocketState {
  return socketClient.getState();
}

/**
 * Reset reconnection attempts - simplified version just reconnects
 */
export function resetSocketReconnection(): void {
  socketClient.connect().catch(() => {
    // Silently ignore connection errors during reset
  });
}

/**
 * Cleanup socket resources
 * Backward compatibility wrapper for SocketClient.cleanup()
 */
export function cleanupSocket(): void {
  socketClient.cleanup();
}

/**
 * Get socket connection statistics
 * Backward compatibility wrapper for SocketClient.getConnectionStats()
 */
export function getSocketConnectionStats() {
  return socketClient.getConnectionStats();
}



// Note: socketClient singleton available through default export

// Export SocketClient class for advanced usage
export { SocketClient };

// Default export for backward compatibility
export default socketClient;
