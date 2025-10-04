/**
 * Socket Managers - Centralized Export
 * Enterprise-grade modular socket management
 */

export { default as SocketManager } from "./SocketManager";
export { default as ConnectionStateManager } from "./ConnectionStateManager";
export { default as TokenRefreshManager } from "./TokenRefreshManager";
export { default as EventManager } from "./EventManager";
export { default as ErrorHandlerManager } from "./ErrorHandlerManager";
export { default as ReconnectionManager } from "./ReconnectionManager";
export { default as SessionManager } from "./SessionManager";
export { default as NotificationManager } from "./NotificationManager";
export { default as StatePersistenceManager } from "./StatePersistenceManager";

// Export manager-specific types
export type { ErrorCategory, ErrorHandlerOptions } from "./ErrorHandlerManager";
export type { ReconnectionAttempt, ReconnectionStats } from "./ReconnectionManager";
export type { SessionExpiredPayload, SessionManagerOptions } from "./SessionManager";
export type { NotificationOptions, NotificationType } from "./NotificationManager";
export type { PersistenceOptions } from "./StatePersistenceManager";
