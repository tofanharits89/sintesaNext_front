"use client";

import { addCsrfToHeaders } from "@/utils/csrf-utils";

interface SendMessageArgs {
  conversationId: string;
  content: string;
  tempId: string;
  senderId: string;
  retryCount?: number;
}

interface SendMessageResult {
  success: boolean;
  message?: any;
  error?: Error;
}

/**
 * Service for handling message operations
 * Extracted from useMessageMutationsRQ.ts to separate concerns
 */
export class MessageService {
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  /**
   * Send a message with retry logic
   */
  async sendMessage(args: SendMessageArgs): Promise<SendMessageResult> {
    const { conversationId, content, tempId, senderId, retryCount = 0 } = args;

    try {
      // Validate input
      this.validateMessageInput(content, conversationId);

      // Perform the actual API call
      const response = await this.performSendRequest({
        conversationId,
        content,
        senderId,
      });

      return {
        success: true,
        message: response,
      };
    } catch (error) {
      // Handle retry logic
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.calculateRetryDelay(retryCount));

        return this.sendMessage({
          ...args,
          retryCount: retryCount + 1,
        });
      }

      // Max retries exceeded or non-retryable error
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Retry a failed message
   */
  async retryMessage(tempId: string): Promise<SendMessageResult> {
    // Implementation for retrying a specific message
    // This would use the stored temp message data
    return {
      success: false,
      error: new Error("Retry not implemented yet"),
    };
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    // Implementation for marking message as read
    await fetch(`/api/messages/${messageId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  /**
   * Validate message input
   */
  private validateMessageInput(content: string, conversationId: string) {
    if (!content || content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    if (content.length > 4000) {
      throw new Error("Message content too long (max 4000 characters)");
    }
  }

  /**
   * Perform the actual API request
   */
  private async performSendRequest(args: {
    conversationId: string;
    content: string;
    senderId: string;
  }): Promise<any> {
    const response = await fetch("/api/v1/messaging/send", {
      method: "POST",
      headers: addCsrfToHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx errors, or timeout
    if (error.name === "NetworkError" || error.name === "TimeoutError") {
      return true;
    }

    if (error.message?.includes("HTTP 5")) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay for retry (exponential backoff)
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.retryDelay * Math.pow(2, retryCount);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const messageService = new MessageService();
