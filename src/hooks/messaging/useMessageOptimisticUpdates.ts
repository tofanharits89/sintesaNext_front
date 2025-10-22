"use client";

import { useQueryClient } from '@tanstack/react-query';
import { messageKeys } from '../useMessagesRQ';
import { conversationKeys } from '../useConversationsRQ';
import { FrontendMessage } from '@/types/socket-events';
import { useMessageActions, useMessagingActions } from '@/stores';

export function useMessageOptimisticUpdates() {
  const queryClient = useQueryClient();
  const messageActions = useMessageActions();
  const { unread } = useMessagingActions();

  const addOptimisticMessage = (conversationId: string, message: FrontendMessage) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return [...old, message];
    });

    // Update conversation list
    const conversationKey = conversationKeys.conversations('');
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
    if (messageActions.updateMessage) {
      messageActions.updateMessage(messageId, { deliveryStatus: status });
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
    const conversationKey = conversationKeys.conversations('');
    queryClient.setQueryData(conversationKey, (old: any[] = []) => {
      return old.map((conv: any) => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: realMessage, lastMessageAt: realMessage.createdAt }
          : conv
      );
    });

    // Update unread count if message is from other user
    if (realMessage.senderId !== realMessage.recipientId) {
      unread.increment(conversationId);
    }
  };

  const markMessagesAsRead = (conversationId: string, messageIds: string[]) => {
    const messageKey = messageKeys.messages('', conversationId);
    
    queryClient.setQueryData(messageKey, (old: FrontendMessage[] = []) => {
      return old.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      );
    });

    // Update unread count
    unread.decrement(conversationId, messageIds.length);
  };

  return {
    addOptimisticMessage,
    removeOptimisticMessage,
    updateMessageStatus,
    replaceTempMessage,
    markMessagesAsRead,
  };
}