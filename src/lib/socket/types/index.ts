/**
 * Socket Client Type Definitions
 * Enterprise-grade type definitions for modular socket architecture
 */

import { Socket } from "socket.io-client";

export type SocketState = "disconnected" | "connecting" | "connected" | "error";

/**
 * Reconnection configuration for exponential backoff
 * Enterprise-grade reconnection strategy with configurable parameters
 */
export interface ReconnectionConfig {
  /** Enable automatic reconnection (default: true) */
  enabled?: boolean;
  /** Maximum number of reconnection attempts (default: 5) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  factor?: number;
}

export interface SocketClientConfig {
  url?: string;
  path?: string;
  autoConnect?: boolean;
  debug?: boolean;
  /** Reconnection configuration for exponential backoff */
  reconnection?: ReconnectionConfig;
}

export interface RequiredSocketClientConfig {
  url: string;
  path: string;
  autoConnect: boolean;
  debug: boolean;
  reconnection: Required<ReconnectionConfig>;
}

export interface ConnectionStats {
  state: SocketState;
  connected: boolean;
  socketId: string | null;
  reconnectAttempts: number;
}

/**
 * Persisted connection state for session recovery
 * Stored in sessionStorage for faster reconnection after page refresh
 */
export interface PersistedConnectionState {
  /** Last successful connection timestamp */
  lastConnected: number;
  /** Last known socket ID */
  socketId: string | null;
  /** Number of reconnection attempts before last success */
  reconnectAttempts: number;
  /** Connection state at time of persistence */
  state: SocketState;
}

/**
 * Event acknowledgment response structure
 * Used for critical events that require confirmation
 */
export interface EventAcknowledgment<T = any> {
  /** Whether the event was processed successfully */
  success: boolean;
  /** Response data from server */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Server timestamp */
  timestamp?: number;
}

export interface TokenRefreshOptions {
  checkInterval?: number;
  refreshThreshold?: number;
  maxRetries?: number;
}

export interface EventListenerOptions {
  once?: boolean;
  priority?: number;
}

export interface SocketEventListeners {
  [event: string]: Set<(...args: any[]) => void>;
}

export interface SocketManagerConfig {
  transports: ("websocket" | "polling")[];
  timeout: number;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  maxReconnectionDelay: number;
}

export interface ConnectionStateChangeEvent {
  oldState: SocketState;
  newState: SocketState;
  socketId: string;
  timestamp: number;
}

export interface TokenRefreshEvent {
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface SocketErrorEvent {
  type: "connection" | "authentication" | "token_refresh" | "handshake";
  error: Error;
  socketId: string;
  timestamp: number;
  retryable: boolean;
}

// Event handler interfaces
export interface SocketEventHandler {
  setup: (socket: Socket, context: SocketContext) => void;
  cleanup?: () => void;
  priority?: number;
}

export interface SocketContext {
  config: RequiredSocketClientConfig;
  managers: {
    connection: any;
    state: any;
    tokenRefresh: any;
    events: any;
  };
  logger: any;
}

// Manager interfaces
export interface ISocketManager {
  createSocket(): Promise<Socket>;
  connect(): Promise<void>;
  disconnect(): void;
  getSocket(): Socket | null;
  isConnected(): boolean;
  cleanup(): void;
}

export interface IConnectionStateManager {
  getState(): SocketState;
  setState(state: SocketState, reason?: string): void;
  onStateChange(callback: (event: ConnectionStateChangeEvent) => void): void;
  getConnectionStats(): ConnectionStats;
  reset(): void;
}

export interface ITokenRefreshManager {
  start(): void;
  stop(): void;
  checkAndRefresh(): Promise<boolean>;
  isTokenExpiringSoon(token: string): boolean;
  onRefresh(callback: (event: TokenRefreshEvent) => void): void;
  cleanup(): void;
}

export interface IEventHandlerManager {
  addListener(event: string, listener: (...args: any[]) => void, options?: EventListenerOptions): void;
  removeListener(event: string, listener?: (...args: any[]) => void): void;
  removeAllListeners(event?: string): void;
  emit(event: string, ...args: any[]): void;
  cleanup(): void;
}

// Error types
export class SocketClientError extends Error {
  public readonly type: string;
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(type: string, code: string, message: string, retryable = false) {
    super(message);
    this.name = "SocketClientError";
    this.type = type;
    this.code = code;
    this.retryable = retryable;
    this.timestamp = Date.now();
  }
}

export const SOCKET_CLIENT_ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  HANDSHAKE_TIMEOUT: "HANDSHAKE_TIMEOUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type SocketClientErrorCode = keyof typeof SOCKET_CLIENT_ERROR_CODES;

// Export manager interfaces for external use
export interface IErrorHandlerManager {
  handleConnectionError(error: any): any;
  handleSocketError(error: Error): any;
  handleTokenRefreshError(error?: string): any;
  getErrorStats(): any;
  cleanup(): void;
}

export interface IReconnectionManager {
  scheduleReconnect(
    currentAttempt: number,
    onReconnect: () => Promise<void>,
    reason?: string
  ): void;
  cancelScheduledReconnect(): void;
  shouldReconnect(
    currentState: SocketState,
    disconnectReason: string,
    currentAttempt: number
  ): boolean;
  reset(): void;
  getStats(): any;
  cleanup(): void;
}

export interface ISessionManager {
  handleSessionExpired(payload: any): Promise<void>;
  performLogout(reason: string, payload: any): Promise<void>;
  isOnLoginPage(): boolean;
  validateSession(): Promise<boolean>;
  cleanup(): void;
}

export interface INotificationManager {
  showConnectionError(title: string, description: string): void;
  showConnectionSuccess(title: string, description?: string): void;
  showConnectionInfo(title: string, description?: string): void;
  showReconnecting(attemptNumber: number, maxAttempts: number): void;
  showSessionExpired(reason: string, displayMessage?: string): void;
  showTokenRefreshError(error?: string): void;
  dismissConnectionToast(): void;
  dismissAll(): void;
  cleanup(): void;
}

export interface IStatePersistenceManager {
  persistState(
    socketId: string | null,
    state: SocketState,
    reconnectAttempts: number
  ): boolean;
  restoreState(): PersistedConnectionState | null;
  clearState(): boolean;
  hasPersistedState(): boolean;
  isStateValid(): boolean;
  cleanup(): void;
}