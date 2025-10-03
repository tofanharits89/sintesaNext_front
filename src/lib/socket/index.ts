/**
 * Socket Client Module - Enterprise-Grade Architecture
 *
 * This module exports the refactored SocketClient and all its components
 * while maintaining full backward compatibility with the existing API.
 */

// Main exports (backward compatibility)
export {
  SocketClient,
  socketClient,
  type SocketState,
  type SocketClientConfig,
  type ConnectionStats
} from "./SocketClient";

// Component exports (for advanced usage)
export { default as Logger } from "./utils/Logger";
export { default as SocketManager } from "./managers/SocketManager";
export { default as ConnectionStateManager } from "./managers/ConnectionStateManager";
export { default as TokenRefreshManager } from "./managers/TokenRefreshManager";
export { default as EventManager } from "./managers/EventManager";

// Type exports
export type {
  RequiredSocketClientConfig,
  SocketManagerConfig,
  TokenRefreshOptions,
  EventListenerOptions,
  SocketEventHandler,
  SocketContext,
  ConnectionStateChangeEvent,
  TokenRefreshEvent,
  SocketErrorEvent,
  ISocketManager,
  IConnectionStateManager,
  ITokenRefreshManager,
  IEventHandlerManager,
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES,
  SocketClientErrorCode
} from "./types";

// Re-export utilities for backward compatibility
export * from "../socket";