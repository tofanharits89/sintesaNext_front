/**
 * Message Retry Service
 * Handles automatic retry of failed messages with exponential backoff
 * Works with MessageQueueService to persist and recover messages
 */

import { getMessageQueueService, type QueuedMessage } from './messageQueueService';
import { useSyncActions } from '@/stores/messaging-store';
import { socketClient } from '@/lib/socket-client';
import { SOCKET_EVENTS } from '@/types/socket-events';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 5 * 60 * 1000, // 5 minutes
  backoffMultiplier: 2,
};

export class MessageRetryService {
  private config: RetryConfig;
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private queue = getMessageQueueService();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate delay for retry attempt
   */
  calculateDelay(retryCount: number): number {
    const delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, retryCount);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, this.config.maxDelayMs);
  }

  /**
   * Retry a single failed message
   */
  async retryMessage(messageId: string): Promise<boolean> {
    try {
      const socket = socketClient.getSocket();
      if (!socket?.connected) {
        console.log('[MessageRetry] Socket not connected, scheduling retry');
        return false;
      }

      // Get message from queue
      // Note: We'll need to add a get() method to MessageQueueService
      const queueService = getMessageQueueService();
      
      // For now, this is called after we know the message exists
      console.log('[MessageRetry] Retrying message:', messageId);

      // Emit send event via socket
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 10000);

        socket.emit(SOCKET_EVENTS.MESSAGE_SEND, { messageId }, (response: any) => {
          clearTimeout(timeout);
          if (response?.success) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('[MessageRetry] Error retrying message:', error);
      return false;
    }
  }

  /**
   * Schedule retry for a message
   */
  scheduleRetry(message: QueuedMessage): void {
    // Cancel existing timer if any
    if (this.retryTimers.has(message.id)) {
      clearTimeout(this.retryTimers.get(message.id)!);
    }

    // Don't retry if max retries exceeded
    if (message.retryCount >= message.maxRetries) {
      console.log('[MessageRetry] Max retries exceeded for:', message.id);
      return;
    }

    const delayMs = this.calculateDelay(message.retryCount);
    console.log(
      `[MessageRetry] Scheduling retry for ${message.id} in ${delayMs}ms (attempt ${message.retryCount + 1}/${message.maxRetries})`,
    );

    const timer = setTimeout(async () => {
      this.retryTimers.delete(message.id);
      
      // Increment retry count in queue
      await this.queue.incrementRetry(message.id);

      // Attempt retry
      const success = await this.retryMessage(message.id);

      if (success) {
        console.log('[MessageRetry] Retry succeeded:', message.id);
        // Success - message will be marked sent by success handler
      } else {
        // Retry failed, schedule next attempt
        const updated = await this.queue.incrementRetry(message.id);
        if (updated && updated.retryCount < updated.maxRetries) {
          this.scheduleRetry(updated);
        } else {
          // Mark as permanently failed
          await this.queue.markFailed(
            message.id,
            `Failed after ${message.maxRetries} retry attempts`,
          );
        }
      }
    }, delayMs);

    this.retryTimers.set(message.id, timer);
  }

  /**
   * Retry all failed messages
   */
  async retryAllFailed(): Promise<number> {
    try {
      const failed = await this.queue.getFailedForRetry(this.config.maxRetries);
      
      console.log(`[MessageRetry] Retrying ${failed.length} failed messages`);

      let scheduled = 0;
      for (const message of failed) {
        this.scheduleRetry(message);
        scheduled++;
      }

      return scheduled;
    } catch (error) {
      console.error('[MessageRetry] Error retrying all failed:', error);
      return 0;
    }
  }

  /**
   * Cancel retry for a message
   */
  cancelRetry(messageId: string): void {
    const timer = this.retryTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(messageId);
      console.log('[MessageRetry] Cancelled retry for:', messageId);
    }
  }

  /**
   * Cancel all retries
   */
  cancelAllRetries(): void {
    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();
    console.log('[MessageRetry] Cancelled all retries');
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    pendingRetries: number;
    backoffConfig: RetryConfig;
  } {
    return {
      pendingRetries: this.retryTimers.size,
      backoffConfig: this.config,
    };
  }
}

// Singleton instance
let instance: MessageRetryService | null = null;

export function getMessageRetryService(
  config?: Partial<RetryConfig>,
): MessageRetryService {
  if (!instance) {
    instance = new MessageRetryService(config);
  }
  return instance;
}

export function resetMessageRetryService(): void {
  if (instance) {
    instance.cancelAllRetries();
  }
  instance = null;
}

export default {
  MessageRetryService,
  getMessageRetryService,
  resetMessageRetryService,
};
