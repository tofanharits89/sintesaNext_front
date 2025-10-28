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
    // Align message cache shape with useMessagesRQ (infinite query)
    const messageKey = messageKeys.messages(user?.id ?? null, conversationId);

    queryClient.setQueryData(messageKey, (prev: any) => {
      const page = {
        messages: [message],
        pagination: { page: 1, limit: 25, total: 1, hasMore: true },
      };
      if (!prev?.pages) {
        return { pages: [page], pageParams: [undefined] };
      }
      const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
      const lastIdx = copy.pages.length - 1;
      const last = { ...copy.pages[lastIdx] };
      const msgs = Array.isArray(last.messages) ? [...last.messages] : [];
      msgs.push(message);
      last.messages = msgs;
      copy.pages[lastIdx] = last;
      return copy;
    });

    // Update conversation list cache (cursor-based pages)
    const convKey = conversationKeys.lists(user?.id);
    queryClient.setQueryData(convKey, (prev: any) => {
      const empty = { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
      const curr = prev?.pages ? prev : empty;
      const pages = curr.pages.map((pg: any) => ({ ...pg, conversations: [...(pg.conversations || [])] }));

      // Try to locate and update the conversation in any page
      let updated = false;
      for (const pg of pages) {
        const idx = pg.conversations.findIndex((c: any) => c?.id === conversationId);
        if (idx !== -1) {
          const conv = { ...pg.conversations[idx] };
          const ts = (message as any).timestamp || (message as any).created_at || (message as any).createdAt || new Date().toISOString();
          conv.lastMessage = message;
          conv.lastMessageAt = ts;
          conv.updated_at = ts;
          pg.conversations[idx] = conv;
          updated = true;
          break;
        }
      }

      return updated ? { pages, pageParams: curr.pageParams } : curr;
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
    realMessage: FrontendMessage,
  ) => {
    const messageKey = messageKeys.messages(user?.id ?? null, conversationId);

    queryClient.setQueryData(messageKey, (prev: any) => {
      const page = {
        messages: [realMessage],
        pagination: { page: 1, limit: 25, total: 1, hasMore: true },
      };
      if (!prev?.pages) {
        return { pages: [page], pageParams: [undefined] };
      }
      const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
      // Walk all pages and replace the temp message by id
      for (let i = 0; i < copy.pages.length; i++) {
        const p = { ...copy.pages[i] };
        const msgs = Array.isArray(p.messages) ? [...p.messages] : [];
        let replaced = false;
        for (let j = 0; j < msgs.length; j++) {
          if (msgs[j]?.id === tempId) {
            msgs[j] = realMessage;
            replaced = true;
          }
        }
        if (replaced) {
          p.messages = msgs;
          copy.pages[i] = p;
          break;
        }
      }
      return copy;
    });

    // Update conversation list with real message
    const convKey = conversationKeys.lists(user?.id);
    queryClient.setQueryData(convKey, (prev: any) => {
      const empty = { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
      const curr = prev?.pages ? prev : empty;
      const pages = curr.pages.map((pg: any) => ({ ...pg, conversations: [...(pg.conversations || [])] }));

      for (const pg of pages) {
        const idx = pg.conversations.findIndex((c: any) => c?.id === conversationId);
        if (idx !== -1) {
          const conv = { ...pg.conversations[idx] };
          const ts = (realMessage as any).timestamp || (realMessage as any).created_at || (realMessage as any).createdAt || new Date().toISOString();
          conv.lastMessage = realMessage;
          conv.lastMessageAt = ts;
          conv.updated_at = ts;
          pg.conversations[idx] = conv;
          break;
        }
      }

      return { pages, pageParams: curr.pageParams };
    });

    // Update unread count if message is from other user
    if ((realMessage as any).senderId !== user?.id && (realMessage as any).id && ((realMessage as any).createdAt || (realMessage as any).timestamp)) {
      incrementUnreadCount(
        conversationId,
        (realMessage as any).id,
        ((realMessage as any).createdAt || (realMessage as any).timestamp) as string,
      );
    }
  };

  const markMessagesAsRead = (conversationId: string, messageIds: string[]) => {
    const messageKey = messageKeys.messages(user?.id ?? null, conversationId);

    queryClient.setQueryData(messageKey, (prev: any) => {
      if (!prev?.pages) return prev;
      const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
      for (let i = 0; i < copy.pages.length; i++) {
        const p = { ...copy.pages[i] };
        const msgs = Array.isArray(p.messages) ? [...p.messages] : [];
        let changed = false;
        for (let j = 0; j < msgs.length; j++) {
          if (messageIds.includes(msgs[j]?.id)) {
            msgs[j] = { ...msgs[j], is_read: true, isRead: true };
            changed = true;
          }
        }
        if (changed) {
          p.messages = msgs;
          copy.pages[i] = p;
        }
      }
      return copy;
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
