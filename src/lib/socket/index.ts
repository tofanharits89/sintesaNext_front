/**
 * Socket Client Module - Simplified Architecture
 *
 * This module exports the simplified SocketClient with only 3 essential managers:
 * - ConnectionManager: Handles connection, authentication, and reconnection
 * - EventManager: Handles event listeners and state management
 * - NotificationManager: Handles user notifications and error display
 *
 * Maintains 100% backward compatibility with the existing API.
 */

// Main exports from SimpleSocketClient
export {
  SocketClient,
  socketClient,
  type SocketState,
  type SimpleSocketClientConfig as SocketClientConfig,
  type ConnectionStats
} from "./SimpleSocketClient";