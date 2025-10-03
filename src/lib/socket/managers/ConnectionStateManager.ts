/**
 * Connection State Manager
 * Enterprise-grade state management for socket connections
 */

import {
  SocketState,
  IConnectionStateManager,
  ConnectionStateChangeEvent,
  ConnectionStats
} from "../types";
import Logger from "../utils/Logger";

export class ConnectionStateManager implements IConnectionStateManager {
  private state: SocketState = "disconnected";
  private stateHistory: ConnectionStateChangeEvent[] = [];
  private stateChangeListeners: Set<(event: ConnectionStateChangeEvent) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private socketId: string | null = null;
  private lastStateChange = 0;
  private logger: Logger;

  constructor(logger: Logger, maxReconnectAttempts = 5) {
    this.logger = logger;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.logger.debug("ConnectionStateManager initialized", { maxReconnectAttempts });
  }

  getState(): SocketState {
    return this.state;
  }

  setState(newState: SocketState, reason?: string): void {
    const oldState = this.state;

    if (oldState === newState) {
      this.logger.debug("State unchanged", { state: newState, reason });
      return;
    }

    const event: ConnectionStateChangeEvent = {
      oldState,
      newState,
      socketId: this.socketId || "unknown",
      timestamp: Date.now(),
    };

    this.state = newState;
    this.lastStateChange = event.timestamp;

    // Track state changes
    this.stateHistory.push(event);
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    // Update reconnect attempts on specific transitions
    if (newState === "connected") {
      this.reconnectAttempts = 0;
    } else if (newState === "connecting") {
      this.reconnectAttempts++;
    }

    this.logger.info("State changed", {
      from: oldState,
      to: newState,
      reason,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socketId,
    });

    // Notify listeners
    this.notifyStateChange(event);
  }

  setSocketId(socketId: string): void {
    this.socketId = socketId;
    this.logger.debug("Socket ID updated", { socketId });
  }

  clearSocketId(): void {
    this.socketId = null;
    this.logger.debug("Socket ID cleared");
  }

  onStateChange(callback: (event: ConnectionStateChangeEvent) => void): () => void {
    this.stateChangeListeners.add(callback);

    // Return cleanup function
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  getConnectionStats(): ConnectionStats {
    return {
      state: this.state,
      connected: this.state === "connected",
      socketId: this.socketId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }

  canReconnect(): boolean {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }

  reset(): void {
    const previousState = this.state;
    this.state = "disconnected";
    this.reconnectAttempts = 0;
    this.socketId = null;
    this.lastStateChange = Date.now();

    this.logger.info("Connection state reset", { previousState });

    const event: ConnectionStateChangeEvent = {
      oldState: previousState,
      newState: "disconnected",
      socketId: "reset",
      timestamp: this.lastStateChange,
    };

    this.notifyStateChange(event);
  }

  getStateHistory(): ConnectionStateChangeEvent[] {
    return [...this.stateHistory];
  }

  getTimeInCurrentState(): number {
    return Date.now() - this.lastStateChange;
  }

  getPreviousState(): SocketState | null {
    if (this.stateHistory.length === 0) return null;
    return this.stateHistory[this.stateHistory.length - 1]?.oldState || null;
  }

  // Advanced state queries
  hasBeenInState(state: SocketState, withinMs?: number): boolean {
    const now = Date.now();
    return this.stateHistory.some(event =>
      event.newState === state &&
      (!withinMs || (now - event.timestamp) <= withinMs)
    );
  }

  getStateDurations(): Record<SocketState, number> {
    const durations: Record<SocketState, number> = {
      disconnected: 0,
      connecting: 0,
      connected: 0,
      error: 0,
    };

    let lastTimestamp = this.stateHistory[0]?.timestamp || Date.now();
    let lastState = "disconnected" as SocketState;

    for (const event of this.stateHistory) {
      durations[lastState] += event.timestamp - lastTimestamp;
      lastTimestamp = event.timestamp;
      lastState = event.newState;
    }

    // Add current state duration
    if (lastState === this.state) {
      durations[lastState] += Date.now() - lastTimestamp;
    }

    return durations;
  }

  private notifyStateChange(event: ConnectionStateChangeEvent): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error("State change listener error", { error, event });
      }
    });

    // Emit custom DOM event for broader integration
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("socket:state", {
          detail: { ...event, connected: event.newState === "connected" }
        }));

        if (event.newState === "connected") {
          window.dispatchEvent(new CustomEvent("socket:connected"));
        } else if (event.newState === "disconnected") {
          window.dispatchEvent(new CustomEvent("socket:disconnected"));
        }
      } catch (error) {
        this.logger.error("DOM event dispatch error", { error });
      }
    }
  }

  cleanup(): void {
    this.stateChangeListeners.clear();
    this.stateHistory = [];
    this.reset();
    this.logger.debug("ConnectionStateManager cleaned up");
  }
}

export default ConnectionStateManager;