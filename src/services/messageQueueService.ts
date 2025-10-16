/**
 * Message Queue Service
 * Persistent message queue with offline support using IndexedDB
 * Handles: offline persistence, automatic retry, delivery status tracking
 */

export interface QueuedMessage {
  id: string;
  tempId: string;
  conversationId: string;
  recipientId: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastRetryAt: number;
  createdAt: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  error?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  queueSize: number; // bytes estimate
}

const DB_NAME = 'SintesaNEx_Messaging';
const STORE_NAME = 'messageQueue';
const DB_VERSION = 1;

export class MessageQueueService {
  private db: IDBDatabase | null = null;
  private initialized = false;
  private listeners: Set<(msg: QueuedMessage) => void> = new Set();

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[MessageQueue] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('[MessageQueue] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('conversationId', 'conversationId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Enqueue a message for sending
   */
  async enqueue(
    conversationId: string,
    recipientId: string,
    content: string,
    maxRetries: number = 3,
  ): Promise<QueuedMessage> {
    if (!this.db) await this.initialize();

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: QueuedMessage = {
      id: tempId,
      tempId,
      conversationId,
      recipientId,
      content,
      status: 'pending',
      retryCount: 0,
      maxRetries,
      lastRetryAt: 0,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(message);

      request.onerror = () => {
        console.error('[MessageQueue] Failed to enqueue message:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('[MessageQueue] Message enqueued:', tempId);
        this.notifyListeners(message);
        resolve(message);
      };
    });
  }

  /**
   * Mark message as sent (got server ID)
   */
  async markSent(
    tempId: string,
    serverId: string,
    sentAt: number = Date.now(),
  ): Promise<QueuedMessage | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(tempId);

      getRequest.onsuccess = () => {
        const msg = getRequest.result as QueuedMessage | undefined;
        if (!msg) {
          resolve(null);
          return;
        }

        msg.id = serverId;
        msg.status = 'sent';
        msg.sentAt = sentAt;
        msg.retryCount = 0; // Reset retries on success

        const putRequest = store.put(msg);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log('[MessageQueue] Message marked sent:', serverId);
          this.notifyListeners(msg);
          resolve(msg);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark message as delivered
   */
  async markDelivered(
    messageId: string,
    deliveredAt: number = Date.now(),
  ): Promise<QueuedMessage | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const msg = getRequest.result as QueuedMessage | undefined;
        if (!msg) {
          resolve(null);
          return;
        }

        msg.status = 'delivered';
        msg.deliveredAt = deliveredAt;

        const putRequest = store.put(msg);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log('[MessageQueue] Message marked delivered:', messageId);
          this.notifyListeners(msg);
          resolve(msg);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark message as read
   */
  async markRead(
    messageId: string,
    readAt: number = Date.now(),
  ): Promise<QueuedMessage | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const msg = getRequest.result as QueuedMessage | undefined;
        if (!msg) {
          resolve(null);
          return;
        }

        msg.status = 'read';
        msg.readAt = readAt;

        const putRequest = store.put(msg);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log('[MessageQueue] Message marked read:', messageId);
          this.notifyListeners(msg);
          resolve(msg);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark message as failed
   */
  async markFailed(
    messageId: string,
    error: string,
  ): Promise<QueuedMessage | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const msg = getRequest.result as QueuedMessage | undefined;
        if (!msg) {
          resolve(null);
          return;
        }

        msg.status = 'failed';
        msg.error = error;

        const putRequest = store.put(msg);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log('[MessageQueue] Message marked failed:', messageId, error);
          this.notifyListeners(msg);
          resolve(msg);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Get all pending messages
   */
  async getPending(): Promise<QueuedMessage[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve((request.result || []) as QueuedMessage[]);
      };
    });
  }

  /**
   * Get failed messages ready for retry
   */
  async getFailedForRetry(maxRetries: number = 3): Promise<QueuedMessage[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('failed');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = (request.result || []) as QueuedMessage[];
        // Filter to only those that haven't exceeded max retries
        resolve(results.filter((m) => m.retryCount < maxRetries));
      };
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetry(messageId: string): Promise<QueuedMessage | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const msg = getRequest.result as QueuedMessage | undefined;
        if (!msg) {
          resolve(null);
          return;
        }

        msg.retryCount++;
        msg.lastRetryAt = Date.now();
        msg.status = 'pending'; // Reset to pending for retry

        const putRequest = store.put(msg);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log(
            `[MessageQueue] Retry count incremented: ${messageId} (${msg.retryCount}/${msg.maxRetries})`,
          );
          resolve(msg);
        };
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove message from queue (after successful delivery)
   */
  async remove(messageId: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(messageId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[MessageQueue] Message removed from queue:', messageId);
        resolve();
      };
    });
  }

  /**
   * Clear all messages from queue
   */
  async clear(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[MessageQueue] Queue cleared');
        resolve();
      };
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = (request.result || []) as QueuedMessage[];
        const stats: QueueStats = {
          total: messages.length,
          pending: messages.filter((m) => m.status === 'pending').length,
          sent: messages.filter((m) => m.status === 'sent').length,
          delivered: messages.filter((m) => m.status === 'delivered').length,
          failed: messages.filter((m) => m.status === 'failed').length,
          queueSize: JSON.stringify(messages).length, // Rough estimate
        };
        resolve(stats);
      };
    });
  }

  /**
   * Subscribe to message changes
   */
  subscribe(listener: (msg: QueuedMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(msg: QueuedMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('[MessageQueue] Listener error:', e);
      }
    });
  }

  /**
   * Calculate backoff delay for retry
   */
  static getBackoffDelayMs(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
    // Max: 5 minutes
    const baseDelay = 1000;
    const delay = baseDelay * Math.pow(2, Math.min(retryCount, 8));
    return Math.min(delay, 5 * 60 * 1000);
  }
}

// Singleton instance
let instance: MessageQueueService | null = null;

export function getMessageQueueService(): MessageQueueService {
  if (!instance) {
    instance = new MessageQueueService();
  }
  return instance;
}

export default {
  MessageQueueService,
  getMessageQueueService,
};
