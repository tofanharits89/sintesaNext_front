/**
 * Persistent Message Queue using IndexedDB
 * Implements outbox pattern for reliable message delivery
 */

import { backendPath } from '@/lib/backend';
import { getCookie } from '@/lib/httpClient';

export interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  recipientId?: string;
  tempId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  retryCount: number;
  createdAt: Date;
  lastRetryAt?: Date;
  clientTimestamp: Date;
  messageHash: string;
}

export class PersistentMessageQueue {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'MessageQueue';
  private readonly dbVersion = 1;
  private readonly storeName = 'messages';
  private retryInterval: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create messages store
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('conversationId', 'conversationId');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('messageHash', 'messageHash', { unique: true });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Auto-retry loop disabled: retries are manual via retryFailedMessages()
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async queueMessage(message: Omit<QueuedMessage, 'status' | 'retryCount' | 'createdAt' | 'messageHash'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const messageHash = this.generateMessageHash(message.content, message.conversationId, message.clientTimestamp);
    
    const queuedMessage: QueuedMessage = {
      ...message,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      messageHash
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add(queuedMessage);
      
      request.onsuccess = () => resolve(queuedMessage.id);
      request.onerror = () => {
        // Check if it's a duplicate hash error
        if (request.error?.name === 'ConstraintError') {
          // Message already exists, return existing ID
          this.getMessageByHash(messageHash).then(existing => {
            if (existing) {
              resolve(existing.id);
            } else {
              reject(new Error('Duplicate message hash but message not found'));
            }
          }).catch(reject);
        } else {
          reject(request.error);
        }
      };
    });
  }

  async updateMessageStatus(messageId: string, status: QueuedMessage['status'], serverMessageId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(messageId);
      
      getRequest.onsuccess = () => {
        const message = getRequest.result as QueuedMessage;
        if (!message) {
          reject(new Error('Message not found'));
          return;
        }

        message.status = status;
        if (serverMessageId) {
          (message as any).serverMessageId = serverMessageId;
        }

        const putRequest = store.put(message);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getPendingMessages(): Promise<QueuedMessage[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      
      const request = index.getAll('pending');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFailedMessages(): Promise<QueuedMessage[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('status');
      
      const request = index.getAll('failed');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async retryFailedMessages(): Promise<void> {
    const failedMessages = await this.getFailedMessages();
    const pendingMessages = await this.getPendingMessages();
    
    const messagesToRetry = [...failedMessages, ...pendingMessages];

    for (const message of messagesToRetry) {
      if (message.retryCount >= 3) continue; // Max 3 retries

      const baseBackoffDelay = Math.pow(2, message.retryCount) * 1000; // Exponential backoff
      const timeSinceLastRetry = Date.now() - (message.lastRetryAt?.getTime() || message.createdAt.getTime());

      // Use the longer of: exponential backoff or time since last retry
      // This handles cases where lastRetryAt was set to a future time (like for rate limits)
      const effectiveBackoffDelay = Math.max(baseBackoffDelay, 0);

      if (timeSinceLastRetry >= effectiveBackoffDelay) {
        await this.attemptSend(message);
      }
    }
  }

  private async attemptSend(message: QueuedMessage): Promise<void> {
    try {
      // Update retry info
      message.retryCount++;
      message.lastRetryAt = new Date();
      await this.updateMessageInStore(message);

      // Attempt to send via your messaging system
      const result = await this.sendMessage(message);
      
      if (result.success) {
        message.status = 'sent';
        await this.updateMessageInStore(message);
        
        // Emit success event
        this.emitMessageEvent('message:sent', { 
          tempId: message.id, 
          serverMessageId: result.messageId,
          conversationId: message.conversationId 
        });
      } else {
        // Handle rate limit errors with longer backoff
        if (result.isRateLimit) {
          // For rate limit errors, don't increment retry count as aggressively
          // and set a longer backoff time
          message.retryCount = Math.max(1, message.retryCount - 1); // Don't penalize as much for rate limits
          message.lastRetryAt = new Date(Date.now() + 5 * 60 * 1000); // Wait 5 minutes before next retry
          await this.updateMessageInStore(message);
          
          console.warn('Message rate limited, will retry in 5 minutes:', result.error);
          return; // Don't throw error, just wait for next retry cycle
        }
        
        throw new Error(result.error || 'Send failed');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (message.retryCount >= 3) {
        message.status = 'failed';
        this.emitMessageEvent('message:failed', { 
          tempId: message.id, 
          error: error instanceof Error ? error.message : 'Unknown error',
          conversationId: message.conversationId 
        });
      }
      
      await this.updateMessageInStore(message);
    }
  }

  private async sendMessage(message: QueuedMessage): Promise<{ success: boolean; messageId?: string; error?: string; isRateLimit?: boolean }> {
    try {
      const csrfToken = getCookie('XSRF-TOKEN');
      const response = await fetch(backendPath('/messaging/send'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        body: JSON.stringify({
          conversationId: message.conversationId,
          recipientId: message.recipientId,
          content: message.content,
          clientTimestamp: message.clientTimestamp.toISOString(),
          messageHash: message.messageHash,
          tempId: message.id
        })
      });

      // Handle rate limiting specifically
      if (response.status === 429) {
        const data = await response.json().catch(() => ({ error: 'Rate limit exceeded' }));
        return { 
          success: false, 
          error: data.error || 'Rate limit exceeded',
          isRateLimit: true
        };
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        return { 
          success: false, 
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      if (data.success) {
        return { success: true, messageId: data.data?.message?.id };
      } else {
        return { success: false, error: data.error || 'Unknown error' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async updateMessageInStore(message: QueuedMessage): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getMessageByHash(hash: string): Promise<QueuedMessage | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('messageHash');
      
      const request = index.get(hash);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private generateMessageHash(content: string, conversationId: string, timestamp: Date): string {
    const data = `${content}:${conversationId}:${timestamp.getTime()}`;
    return btoa(data).replace(/[+/=]/g, '').substring(0, 32);
  }

  private getAuthToken(): string {
    // Get token from your auth system
    return localStorage.getItem('accessToken') || '';
  }

  private emitMessageEvent(event: string, data: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
  }

  private startRetryLoop(): void {
    // No-op: background auto-retry has been disabled to avoid confusing UX
  }

  async cleanup(): Promise<void> {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    // Clean up old sent/delivered messages (older than 24 hours)
    if (!this.db) return;

    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('createdAt');
      
      const range = IDBKeyRange.upperBound(cutoffDate);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const message = cursor.value as QueuedMessage;
          if (message.status === 'sent' || message.status === 'delivered') {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllMessages(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async destroy(): Promise<void> {
    await this.cleanup();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const messageQueue = new PersistentMessageQueue();