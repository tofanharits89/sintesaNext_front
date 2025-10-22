"use client";

import { useCallback } from 'react';
import { useMessageDelivery } from './messaging/useMessageDelivery';
import { useMessageOptimisticUpdates } from './messaging/useMessageOptimisticUpdates';
import { useMessageRetry } from './messaging/useMessageRetry';
import { useUnifiedAuth } from '@/lib/auth';
import { FrontendMessage } from '@/types/socket-events';
import { useNotificationStore } from '@/stores/notification-store';

interface SendMessageArgs {
  recipientId?: string | undefined;
  conversationId?: string | undefined;
  content: string;
  tempId?: string;
  isRetry?: boolean;
}

interface ReadArgs {
  messageIds: string[];
  conversationId: string;
}

export function useMessageMutationsRQ() {
  const messageDelivery = useMessageDelivery();
  const optimisticUpdates = useMessageOptimisticUpdates();
  const messageRetry = useMessageRetry();
  const { user: currentUser } = useUnifiedAuth();
  const { addNotification } = useNotificationStore();

  const sendMessage = useCallback(async (args: SendMessageArgs) => {
    const { recipientId, conversationId, content, isRetry = false } = args;
    
    // Generate temporary message for optimistic updates
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: FrontendMessage = {
      id: tempId,
      content,
      conversation_id: conversationId || '',
      sender_id: currentUser?.id || '',
      recipient_id: recipientId || '',
      type: 'text',
      is_read: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // CamelCase aliases
      senderId: currentUser?.id || '',
      recipientId: recipientId || '',
      conversationId: conversationId || '',
      isRead: false,
      deliveryStatus: 'sending',
      tempId,
    };

    // Add optimistic message
    if (conversationId) {
      optimisticUpdates.addOptimisticMessage(conversationId, tempMessage);
    }

    try {
      const result = await messageDelivery.mutateAsync({
        recipientId: recipientId || undefined,
        conversationId: conversationId || undefined,
        content,
        tempId,
      });

      if (result.success && result.data?.message) {
        // Replace temp message with real message
        optimisticUpdates.replaceTempMessage(
          conversationId || '',
          tempId,
          result.data.message
        );
        
        addNotification({
          type: 'success',
          title: 'Message sent',
          message: 'Your message was sent successfully',
        });
        
        return result.data;
      } else {
        // Handle failure
        optimisticUpdates.updateMessageStatus(
          conversationId || '',
          tempId,
          'failed'
        );

        // Add to retry queue if not a manual retry
        if (!isRetry) {
          messageRetry.addToRetryQueue(tempId, content, recipientId, conversationId);
        }

        addNotification({
          type: 'error',
          title: 'Message failed',
          message: result.error || 'Failed to send message',
        });

        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      // Handle network/offline errors
      optimisticUpdates.updateMessageStatus(
        conversationId || '',
        tempId,
        'failed'
      );

      if (!isRetry) {
        messageRetry.addToRetryQueue(tempId, content, recipientId, conversationId);
      }

      addNotification({
        type: 'error',
        title: 'Message failed',
        message: error instanceof Error ? error.message : 'Network error',
      });

      throw error;
    }
  }, [messageDelivery, optimisticUpdates, messageRetry, currentUser, addNotification]);

  const markAsRead = useCallback(async (args: ReadArgs) => {
    const { messageIds, conversationId } = args;

    try {
      const response = await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update optimistic cache
      optimisticUpdates.markMessagesAsRead(conversationId, messageIds);

      return await response.json();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }, [optimisticUpdates]);

  const retryMessage = useCallback(async (tempId: string) => {
    return await messageRetry.retryMessage(tempId);
  }, [messageRetry]);

  const deleteMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove from optimistic cache
      optimisticUpdates.removeOptimisticMessage(conversationId, messageId);

      addNotification({
        type: 'success',
        title: 'Message deleted',
        message: 'Message was deleted successfully',
      });

      return await response.json();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: 'Failed to delete message',
      });
      throw error;
    }
  }, [optimisticUpdates, addNotification]);

  return {
    sendMessage,
    markAsRead,
    retryMessage,
    deleteMessage,
    retryQueue: messageRetry.retryQueue,
    processRetryQueue: messageRetry.processRetryQueue,
  };
}

// Individual hooks for compatibility with existing imports
export function useSendMessageMutation() {
  const { sendMessage } = useMessageMutationsRQ();
  
  return {
    mutateAsync: sendMessage,
    isPending: false, // TODO: Add proper loading state tracking
    error: null, // TODO: Add proper error state tracking
  };
}

export function useMarkAsReadMutation(conversationId?: string) {
  const { markAsRead } = useMessageMutationsRQ();
  
  return {
    mutate: ({ messageIds }: { messageIds: string[] }) => {
      if (!conversationId) {
        throw new Error('Conversation ID is required for markAsRead');
      }
      return markAsRead({ messageIds, conversationId });
    },
    isPending: false, // TODO: Add proper loading state tracking
    error: null, // TODO: Add proper error state tracking
  };
}