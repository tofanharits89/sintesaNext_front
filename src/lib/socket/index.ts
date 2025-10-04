/**
 * Socket Client Module - Enterprise-Grade Modular Architecture
 *
 * This module exports the fully refactored SocketClient and all its components
 * while maintaining 100% backward compatibility with the existing API.
 *
 * Architecture:
 * - Core Layer: SocketManager, StateManager, TokenRefreshManager, EventManager
 * - Feature Layer: ErrorHandler, Reconnection, Session, Notification, Persistence
 *
 * See ARCHITECTURE.md for detailed documentation.
 */

// Main exports (backward compatibility)
export {
  SocketClient,
  socketClient,
  type SocketState,
  type SocketClientConfig,
  type ConnectionStats
} from "./SocketClient";

// Core Manager exports (for advanced usage)
export { default as Logger } from "./utils/Logger";
export { default as SocketManager } from "./managers/SocketManager";
export { default as ConnectionStateManager } from "./managers/ConnectionStateManager";
export { default as TokenRefreshManager } from "./managers/TokenRefreshManager";
export { default as EventManager } from "./managers/EventManager";

// Feature Manager exports (for advanced usage)
export { default as ErrorHandlerManager } from "./managers/ErrorHandlerManager";
export { default as ReconnectionManager } from "./managers/ReconnectionManager";
export { default as SessionManager } from "./managers/SessionManager";
export { default as NotificationManager } from "./managers/NotificationManager";
export { default as StatePersistenceManager } from "./managers/StatePersistenceManager";

// Manager-specific type exports
export type {
  ErrorCategory,
  ErrorHandlerOptions
} from "./managers/ErrorHandlerManager";
export type {
  ReconnectionAttempt,
  ReconnectionStats
} from "./managers/ReconnectionManager";
export type {
  SessionExpiredPayload,
  SessionManagerOptions
} from "./managers/SessionManager";
export type {
  NotificationOptions,
  NotificationType
} from "./managers/NotificationManager";
export type {
  PersistenceOptions
} from "./managers/StatePersistenceManager";

// Core type exports
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
  ReconnectionConfig,
  PersistedConnectionState,
  EventAcknowledgment,
  ISocketManager,
  IConnectionStateManager,
  ITokenRefreshManager,
  IEventHandlerManager,
  IErrorHandlerManager,
  IReconnectionManager,
  ISessionManager,
  INotificationManager,
  IStatePersistenceManager,
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES,
  SocketClientErrorCode
} from "./types";

// Re-export utilities for backward compatibility
export * from "../socket";