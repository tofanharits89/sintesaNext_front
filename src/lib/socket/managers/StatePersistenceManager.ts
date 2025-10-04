/**
 * State Persistence Manager
 * Enterprise-grade state persistence for faster reconnection
 */

import { PersistedConnectionState, SocketState } from "../types";
import Logger from "../utils/Logger";

export interface PersistenceOptions {
  enabled?: boolean;
  storageKey?: string;
  maxStateAge?: number; // milliseconds
}

/**
 * Manages connection state persistence to sessionStorage
 * Enables faster reconnection after page refresh
 */
export class StatePersistenceManager {
  private logger: Logger;
  private options: Required<PersistenceOptions>;
  private readonly DEFAULT_STORAGE_KEY = "socket_connection_state";
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  constructor(logger: Logger, options: PersistenceOptions = {}) {
    this.logger = logger;
    this.options = {
      enabled: options.enabled ?? true,
      storageKey: options.storageKey || this.DEFAULT_STORAGE_KEY,
      maxStateAge: options.maxStateAge || this.DEFAULT_MAX_AGE,
    };

    this.logger.debug("StatePersistenceManager initialized", {
      options: this.options,
    });
  }

  /**
   * Persist connection state to sessionStorage
   */
  persistState(
    socketId: string | null,
    state: SocketState,
    reconnectAttempts: number
  ): boolean {
    if (!this.options.enabled) {
      this.logger.debug("State persistence disabled");
      return false;
    }

    if (!this.isStorageAvailable()) {
      this.logger.debug("sessionStorage not available");
      return false;
    }

    try {
      const persistedState: PersistedConnectionState = {
        lastConnected: Date.now(),
        socketId,
        reconnectAttempts,
        state,
      };

      sessionStorage.setItem(
        this.options.storageKey,
        JSON.stringify(persistedState)
      );

      this.logger.debug("Connection state persisted", {
        socketId,
        state,
        reconnectAttempts,
      });

      return true;
    } catch (error: unknown) {
      // Fail silently - persistence is optional optimization
      this.logger.debug("Failed to persist connection state", error);
      return false;
    }
  }

  /**
   * Restore persisted connection state from sessionStorage
   */
  restoreState(): PersistedConnectionState | null {
    if (!this.options.enabled) {
      this.logger.debug("State persistence disabled");
      return null;
    }

    if (!this.isStorageAvailable()) {
      this.logger.debug("sessionStorage not available");
      return null;
    }

    try {
      const stateStr = sessionStorage.getItem(this.options.storageKey);
      if (!stateStr) {
        this.logger.debug("No persisted state found");
        return null;
      }

      const state: PersistedConnectionState = JSON.parse(stateStr);
      const timeSinceLastConnection = Date.now() - state.lastConnected;

      // Check if state is too old
      if (timeSinceLastConnection >= this.options.maxStateAge) {
        this.logger.debug("Persisted state too old, clearing", {
          age: `${Math.round(timeSinceLastConnection / 1000)}s`,
          maxAge: `${this.options.maxStateAge / 1000}s`,
        });
        this.clearState();
        return null;
      }

      this.logger.info("Restored previous connection state", {
        socketId: state.socketId,
        state: state.state,
        age: `${Math.round(timeSinceLastConnection / 1000)}s ago`,
        reconnectAttempts: state.reconnectAttempts,
      });

      return state;
    } catch (error: unknown) {
      // Fail silently - restoration is optional optimization
      this.logger.debug("Failed to restore connection state", error);
      // Clear corrupted state
      this.clearState();
      return null;
    }
  }

  /**
   * Clear persisted state
   */
  clearState(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      sessionStorage.removeItem(this.options.storageKey);
      this.logger.debug("Persisted state cleared");
      return true;
    } catch (error: unknown) {
      this.logger.debug("Failed to clear persisted state", error);
      return false;
    }
  }

  /**
   * Check if state exists
   */
  hasPersistedState(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      return sessionStorage.getItem(this.options.storageKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get state age in milliseconds
   */
  getStateAge(): number | null {
    const state = this.restoreState();
    if (!state) {
      return null;
    }

    return Date.now() - state.lastConnected;
  }

  /**
   * Check if persisted state is valid (not too old)
   */
  isStateValid(): boolean {
    const age = this.getStateAge();
    if (age === null) {
      return false;
    }

    return age < this.options.maxStateAge;
  }

  /**
   * Update persistence options
   */
  updateOptions(options: Partial<PersistenceOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };

    this.logger.debug("Persistence options updated", { options: this.options });
  }

  /**
   * Check if sessionStorage is available
   */
  private isStorageAvailable(): boolean {
    return typeof sessionStorage !== "undefined";
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    enabled: boolean;
    hasState: boolean;
    stateAge: number | null;
    isValid: boolean;
  } {
    return {
      enabled: this.options.enabled,
      hasState: this.hasPersistedState(),
      stateAge: this.getStateAge(),
      isValid: this.isStateValid(),
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.clearState();
    this.logger.debug("StatePersistenceManager cleaned up");
  }
}

export default StatePersistenceManager;
