/**
 * Authentication Event Coordinator
 * Coordinates auth events across the application to prevent race conditions
 * and ensure consistent state management
 */

import Logger from "./socket/utils/Logger";

interface AuthEvent {
  type: 'token_refresh_start' | 'token_refresh_success' | 'token_refresh_error' | 'auth_expired' | 'login_start' | 'login_success';
  timestamp: number;
  data?: any;
}

class AuthEventCoordinator {
  private eventQueue: AuthEvent[] = [];
  private isProcessing = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger({
      prefix: '[AuthEventCoordinator]',
      enabled: true,
      level: 'info',
      maxLogEntries: 500,
      includeTimestamp: true
    });
  }

  /**
   * Add event listener for auth events
   */
  addEventListener(eventType: string, callback: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an auth event
   */
  async emitEvent(event: AuthEvent): Promise<void> {
    this.eventQueue.push(event);

    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  /**
   * Process queued events with proper sequencing
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: AuthEvent): Promise<void> {
    this.logger.debug(`Processing auth event: ${event.type}`, {
      timestamp: event.timestamp,
      data: event.data
    });

    const listeners = this.eventListeners.get(event.type) || [];

    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error: any) {
        this.logger.error(`Error in auth event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * Check if auth operation is in progress
   */
  isAuthOperationInProgress(): boolean {
    return this.isProcessing || this.eventQueue.length > 0;
  }

  /**
   * Get current auth state
   */
  getAuthState(): {
    isProcessing: boolean;
    queueLength: number;
    recentEvents: AuthEvent[];
  } {
    const recentEvents = this.eventQueue.slice(-5);

    return {
      isProcessing: this.isProcessing,
      queueLength: this.eventQueue.length,
      recentEvents
    };
  }

  /**
   * Clear event queue (for emergency cleanup)
   */
  clearQueue(): void {
    this.eventQueue.length = 0;
    this.logger.info("Auth event queue cleared");
  }
}

// Global singleton instance
export const authEventCoordinator = new AuthEventCoordinator();

// Convenience functions for common events
export const emitTokenRefreshStart = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_start',
    timestamp: Date.now(),
    data
  });

export const emitTokenRefreshSuccess = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_success',
    timestamp: Date.now(),
    data
  });

export const emitTokenRefreshError = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'token_refresh_error',
    timestamp: Date.now(),
    data
  });

export const emitAuthExpired = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'auth_expired',
    timestamp: Date.now(),
    data
  });

export const emitLoginStart = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'login_start',
    timestamp: Date.now(),
    data
  });

export const emitLoginSuccess = (data?: any) =>
  authEventCoordinator.emitEvent({
    type: 'login_success',
    timestamp: Date.now(),
    data
  });

export default authEventCoordinator;