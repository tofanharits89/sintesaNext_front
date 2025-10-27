"use client";

import { useQueryClient } from '@tanstack/react-query';
import { messageKeys } from '../useMessagesRQ';
import { conversationKeys } from '../useConversationsRQ';
import { FrontendMessage } from '@/types/socket-events';
import { useMessageActions, useMessagingActions } from '@/stores';
import { useUnreadActions } from '@/stores/unread-badges-store';
import { queryKeyFactories } from '@/lib/config/query-configs';
import { useUnifiedAuth } from '@/lib/auth';

export function useMessageOptimisticUpdates() {
  const queryClient = useQueryClient();
  const messageActions = useMessageActions();
  const { unread } = useMessagingActions();
  const { incrementUnreadCount, markConversationAsRead } = useUnreadActions();
  const { user } = useUnifiedAuth();

  const addOptimisticMessage = (conversationId: string, message: FrontendMessage) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return [...old, message];
    });

    // Update conversation list
    // Use the same key as useConversationsRQ for consistency
    const conversationKey = ["conversations", user?.id || "anonymous", "list"];
    queryClient.setQueryData(conversationKey, (old: any[] = []) => {
      return old.map((conv: any) =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
          : conv
      );
    });
  };

  const removeOptimisticMessage = (conversationId: string, tempId: string) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return old.filter(msg => msg.id !== tempId);
    });
  };

  const updateMessageStatus = (conversationId: string, messageId: string, status: string) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return old.map(msg => 
        msg.id === messageId ? { ...msg, deliveryStatus: status as any } : msg
      );
    });

    // Update message in store if needed
    // Note: updateMessage method exists but may not be in the type definition
    try {
      (messageActions as any).updateMessage?.(messageId, { deliveryStatus: status });
    } catch (error) {
      console.warn('Failed to update message in store:', error);
    }
  };

  const replaceTempMessage = (
    conversationId: string, 
    tempId: string, 
    realMessage: FrontendMessage
  ) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return old.map(msg => 
        msg.id === tempId ? realMessage : msg
      );
    });

    // Update conversation list with real message
    const conversationKey = queryKeyFactories.messaging.conversations(user?.id);
    queryClient.setQueryData(conversationKey, (old: any[] = []) => {
      return old.map((conv: any) => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: realMessage, lastMessageAt: realMessage.createdAt }
          : conv
      );
    });

    // Update unread count if message is from other user
    if (realMessage.senderId !== user?.id && realMessage.id && realMessage.createdAt) {
      incrementUnreadCount(conversationId, realMessage.id, realMessage.createdAt);
    }
  };

  const markMessagesAsRead = (conversationId: string, messageIds: string[]) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return old.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      );
    });

    // Update unread count - mark as read
    const lastMessageId = messageIds[messageIds.length - 1];
    if (lastMessageId) {
      markConversationAsRead(conversationId, lastMessageId);
    }
  };

  return {
    addOptimisticMessage,
    removeOptimisticMessage,
    updateMessageStatus,
    replaceTempMessage,
    markMessagesAsRead,
  };
}
