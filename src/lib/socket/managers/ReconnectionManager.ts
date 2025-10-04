/**
 * Reconnection Manager
 * Enterprise-grade reconnection strategy with exponential backoff
 */

import { ReconnectionConfig, SocketState } from "../types";
import Logger from "../utils/Logger";

export interface ReconnectionAttempt {
  attemptNumber: number;
  timestamp: number;
  delay: number;
  reason: string;
}

export interface ReconnectionStats {
  totalAttempts: number;
  successfulReconnections: number;
  failedAttempts: number;
  averageDelay: number;
  lastAttempt: ReconnectionAttempt | null;
}

/**
 * Manages reconnection logic with configurable exponential backoff
 */
export class ReconnectionManager {
  private config: Required<ReconnectionConfig>;
  private logger: Logger;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private attemptHistory: ReconnectionAttempt[] = [];
  private stats: ReconnectionStats = {
    totalAttempts: 0,
    successfulReconnections: 0,
    failedAttempts: 0,
    averageDelay: 0,
    lastAttempt: null,
  };
  private readonly MAX_HISTORY = 20;

  constructor(config: Required<ReconnectionConfig>, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.logger.debug("ReconnectionManager initialized", { config });
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  scheduleReconnect(
    currentAttempt: number,
    onReconnect: () => Promise<void>,
    reason: string = "Connection lost"
  ): void {
    // Check if reconnection is enabled
    if (!this.config.enabled) {
      this.logger.info("Reconnection disabled by configuration");
      return;
    }

    // Check if max attempts reached
    if (currentAttempt >= this.config.maxAttempts) {
      this.logger.error(
        `Max reconnection attempts (${this.config.maxAttempts}) reached`
      );
      this.stats.failedAttempts++;
      return;
    }

    // Calculate delay using exponential backoff
    const delay = this.calculateDelay(currentAttempt);

    const attempt: ReconnectionAttempt = {
      attemptNumber: currentAttempt + 1,
      timestamp: Date.now(),
      delay,
      reason,
    };

    this.recordAttempt(attempt);

    this.logger.info(
      `Scheduling reconnect attempt ${attempt.attemptNumber}/${this.config.maxAttempts} in ${delay}ms`,
      {
        reason,
        exponentialDelay: this.calculateExponentialDelay(currentAttempt),
        cappedDelay: delay,
      }
    );

    // Clear any existing timeout
    this.cancelScheduledReconnect();

    // Schedule reconnection
    this.reconnectTimeout = setTimeout(async () => {
      this.logger.info(
        `Executing reconnection attempt ${attempt.attemptNumber}/${this.config.maxAttempts}`
      );

      try {
        await onReconnect();
        this.stats.successfulReconnections++;
        this.logger.info("Reconnection successful", {
          attemptNumber: attempt.attemptNumber,
          totalAttempts: this.stats.totalAttempts,
        });
      } catch (error: unknown) {
        this.stats.failedAttempts++;
        this.logger.error("Reconnection attempt failed", {
          attemptNumber: attempt.attemptNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, delay);
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attemptNumber: number): number {
    const exponentialDelay = this.calculateExponentialDelay(attemptNumber);
    return Math.min(exponentialDelay, this.config.maxDelay);
  }

  /**
   * Calculate exponential delay: initialDelay * (factor ^ attempts)
   */
  private calculateExponentialDelay(attemptNumber: number): number {
    return (
      this.config.initialDelay * Math.pow(this.config.factor, attemptNumber)
    );
  }

  /**
   * Cancel any scheduled reconnection
   */
  cancelScheduledReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      this.logger.debug("Scheduled reconnection cancelled");
    }
  }

  /**
   * Check if reconnection should be attempted
   */
  shouldReconnect(
    currentState: SocketState,
    disconnectReason: string,
    currentAttempt: number
  ): boolean {
    // Don't reconnect if disabled
    if (!this.config.enabled) {
      return false;
    }

    // Don't reconnect if max attempts reached
    if (currentAttempt >= this.config.maxAttempts) {
      return false;
    }

    // Don't reconnect for manual disconnections
    if (disconnectReason === "io client disconnect") {
      this.logger.debug("Manual disconnect, skipping reconnection");
      return false;
    }

    // Only reconnect from disconnected or error states
    if (currentState !== "disconnected" && currentState !== "error") {
      this.logger.debug(
        `Current state (${currentState}) not suitable for reconnection`
      );
      return false;
    }

    return true;
  }

  /**
   * Record reconnection attempt
   */
  private recordAttempt(attempt: ReconnectionAttempt): void {
    this.attemptHistory.push(attempt);
    this.stats.totalAttempts++;
    this.stats.lastAttempt = attempt;

    // Maintain history size
    if (this.attemptHistory.length > this.MAX_HISTORY) {
      this.attemptHistory.shift();
    }

    // Update average delay
    const totalDelay = this.attemptHistory.reduce(
      (sum, a) => sum + a.delay,
      0
    );
    this.stats.averageDelay = Math.round(
      totalDelay / this.attemptHistory.length
    );
  }

  /**
   * Reset reconnection state (called on successful connection)
   */
  reset(): void {
    this.cancelScheduledReconnect();
    this.logger.debug("Reconnection state reset");
  }

  /**
   * Get reconnection statistics
   */
  getStats(): ReconnectionStats {
    return { ...this.stats };
  }

  /**
   * Get attempt history
   */
  getAttemptHistory(): ReconnectionAttempt[] {
    return [...this.attemptHistory];
  }

  /**
   * Get configuration
   */
  getConfig(): Required<ReconnectionConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.logger.info("Reconnection configuration updated", { config: this.config });
  }

  /**
   * Check if currently scheduled for reconnection
   */
  isScheduled(): boolean {
    return this.reconnectTimeout !== null;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.cancelScheduledReconnect();
    this.attemptHistory = [];
    this.stats = {
      totalAttempts: 0,
      successfulReconnections: 0,
      failedAttempts: 0,
      averageDelay: 0,
      lastAttempt: null,
    };
    this.logger.debug("ReconnectionManager cleaned up");
  }
}

export default ReconnectionManager;
