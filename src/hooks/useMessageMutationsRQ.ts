"use client";

import { useCallback } from 'react';
import { useMessageDelivery } from './messaging/useMessageDelivery';
import { useMessageOptimisticUpdates } from './messaging/useMessageOptimisticUpdates';
import { useMessageRetry } from './messaging/useMessageRetry';
import { useAuth } from '@/lib/auth';
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
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotificationStore();

  const sendMessage = useCallback(async (args: SendMessageArgs) => {
    const { recipientId, conversationId, content, isRetry = false } = args;

    // Generate temporary message for optimistic updates
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const nowIso = new Date().toISOString();
    const tempMessage: FrontendMessage = {
      id: tempId,
      content,
      conversation_id: conversationId || '',
      sender_id: currentUser?.id || '',
      recipient_id: recipientId || '',
      type: 'text',
      is_read: false,
      is_deleted: false,
      created_at: nowIso,
      updated_at: nowIso,
      timestamp: nowIso,
      // Include sender object so UI renders as own message
      sender: currentUser
        ? { id: currentUser.id, username: currentUser.username || 'you', name: currentUser.name || 'You' }
        : { id: 'current-user', username: 'you', name: 'You' },
      // CamelCase aliases
      senderId: currentUser?.id || '',
      recipientId: recipientId || '',
      conversationId: conversationId || '',
      isRead: false,
      deliveryStatus: 'sending',
      isDelivered: false,
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
        const realConvId = (result.data as any).conversationId || (result.data.message as any)?.conversationId || (result.data.message as any)?.conversation_id || '';

        // Replace temp message with real message in the real conversation cache when available
        if (realConvId) {
          optimisticUpdates.replaceTempMessage(realConvId, tempId, result.data.message as any);
        } else if (conversationId) {
          // Fallback: if we were in a real conversation already
          optimisticUpdates.replaceTempMessage(conversationId, tempId, result.data.message as any);
        }

        // Notify listeners so pages can switch URL/state to the real conversation
        try {
          if (realConvId && (typeof window !== 'undefined')) {
            window.dispatchEvent(new CustomEvent('conversation:created', { detail: { conversationId: realConvId } }));
          }
        } catch { }

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
      const response = await fetch(`/api/v1/messaging/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: 'PUT',
        credentials: 'include',
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
    // TODO: Backend does not currently expose a DELETE endpoint for messages
    // When implemented, use: DELETE /api/v1/messaging/conversations/:conversationId/messages/:messageId
    addNotification({
      type: 'error',
      title: 'Not supported',
      message: 'Message deletion is not yet supported by the backend',
    });
    throw new Error('Message deletion is not yet supported');
  }, [addNotification]);

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
