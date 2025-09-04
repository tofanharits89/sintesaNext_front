"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { conversationKeys } from './useConversationsRQ';
import { messageKeys } from './useMessagesRQ';
import { useSocket } from './useSocket';
import { FrontendMessage } from '@/shared/socket-events';
import { useMessagingActions } from '@/stores';
import { useCurrentUser } from '@/lib/use-current-user';

// Types for mutation arguments
interface SendMessageArgs {
  recipientId?: string;
  conversationId?: string;
  content: string;
  tempId?: string;
}

interface ReadArgs {
  messageIds: string[];
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    message: any;
    conversationId: string;
  };
  error?: string;
}

// Send message mutation
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const { emit } = useSocket();
  const { ui, unread } = useMessagingActions();
  const { currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: async (args: SendMessageArgs): Promise<SendMessageResponse> => {
      const { recipientId, conversationId, content, tempId } = args;

      // First try WebSocket for real-time delivery
      try {
        const socketPayload = {
          // camelCase
          recipientId,
          conversationId,
          content: content.trim(),
          type: 'text',
          tempId,
          senderId: currentUser?.id,
          participant1Id: conversationId ? undefined : currentUser?.id,
          participant2Id: conversationId ? undefined : recipientId,
          // snake_case duplicates for compatibility
          recipient_id: recipientId,
          conversation_id: conversationId,
          message: content.trim(),
          message_type: 'text',
          temp_id: tempId,
          sender_id: currentUser?.id,
          participant1_id: conversationId ? undefined : currentUser?.id,
          participant2_id: conversationId ? undefined : recipientId,
        } as any;

        console.debug('[useSendMessage] Emitting message:send', {
          hasRecipient: !!recipientId,
          hasConversationId: !!conversationId,
          contentLen: content?.length ?? 0,
          tempId,
          hasSender: !!currentUser?.id,
        });

        const socketResponse: any = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket timeout'));
          }, 5000);

          emit("message:send", socketPayload, (response: any) => {
            clearTimeout(timeout);
            console.debug('[useSendMessage] ACK for message:send', response);
            resolve(response);
          });
        });

        if (socketResponse?.success) {
          return socketResponse;
        }

        const errMsg = socketResponse?.error || 'Socket send failed';
        console.error('[useSendMessage] Socket rejected message:send', { errMsg, response: socketResponse });
        throw new Error(errMsg);
      } catch (socketError) {
        console.warn('[useSendMessage] Socket failed, trying REST:', socketError);
        
        // Fallback to REST API
        const token = getAuthTokenFromCookie();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const resp = await fetch(backendPath("/messaging/send"), {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            // camelCase
            recipientId,
            conversationId,
            content: content.trim(),
            type: 'text',
            tempId,
            senderId: currentUser?.id,
            participant1Id: conversationId ? undefined : currentUser?.id,
            participant2Id: conversationId ? undefined : recipientId,
            // snake_case duplicates
            recipient_id: recipientId,
            conversation_id: conversationId,
            message: content.trim(),
            message_type: 'text',
            temp_id: tempId,
            sender_id: currentUser?.id,
            participant1_id: conversationId ? undefined : currentUser?.id,
            participant2_id: conversationId ? undefined : recipientId,
          }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const result = await resp.json();
        if (!result.success) {
          throw new Error(result.error || 'Send failed');
        }

        return result;
      }
    },
    onMutate: async (args) => {
      const { conversationId, content, tempId } = args;
      const convKeyId = conversationId != null ? String(conversationId) : undefined;
      
      // Set sending state
      ui.setSendingMessage(true);

      // Create optimistic message
      if (convKeyId && tempId) {
        const optimisticMessage: FrontendMessage = {
          id: tempId,
          conversationId: convKeyId,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          sender: currentUser
            ? { id: currentUser.id, username: currentUser.username || 'you', name: currentUser.name || 'You' }
            : { id: 'current-user', username: 'you', name: 'You' },
          senderType: 'user',
          isRead: true,
          isDelivered: false,
          isOpened: false,
        };

        // Update messages cache optimistically
        queryClient.setQueryData(messageKeys.list(convKeyId), (prev: any) => {
          if (!prev || !prev.pages || prev.pages.length === 0) {
            // Initialize with first page containing the temp message
            return {
              pages: [{
                data: {
                  messages: [{
                    id: tempId,
                    conversation_id: convKeyId,
                    content: content.trim(),
                    timestamp: optimisticMessage.timestamp,
                    created_at: optimisticMessage.timestamp,
                    sender: optimisticMessage.sender,
                    senderType: optimisticMessage.senderType,
                    is_read: true,
                  }],
                  pagination: { page: 1, limit: 50, total: 1, hasMore: false },
                },
              }],
              pageParams: [1],
            };
          }

          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({ ...p })),
          };
          const lastIdx = copy.pages.length - 1;
          const last = { ...copy.pages[lastIdx] };
          const list = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];
          // Guard: avoid duplicating the same temp message
          if (list.some((m: any) => m.id === tempId)) {
            return prev;
          }
          
          list.push({
            id: tempId,
            conversation_id: convKeyId,
            content: content.trim(),
            timestamp: optimisticMessage.timestamp,
            created_at: optimisticMessage.timestamp,
            sender: optimisticMessage.sender,
            senderType: optimisticMessage.senderType,
            is_read: true,
          });
          
          last.data = { ...(last.data || {}), messages: list };
          copy.pages[lastIdx] = last;
          return copy;
        });

        // Update conversations list optimistically
        queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
          if (!prev?.data?.conversations) return prev;
          
          const conversations = [...prev.data.conversations];
          const idx = conversations.findIndex((c: any) => String(c.id) === convKeyId);
          
          if (idx !== -1) {
            const conv = { ...conversations[idx] };
            conv.lastMessage = {
              id: tempId,
              content: content.trim(),
              timestamp: optimisticMessage.timestamp,
              sender: optimisticMessage.sender,
              senderType: optimisticMessage.senderType,
              isRead: true,
              is_read: true,
            };
            conv.updated_at = optimisticMessage.timestamp;
            
            // Move to top
            conversations.splice(idx, 1);
            conversations.unshift(conv);
          }
          
          return {
            ...prev,
            data: { ...prev.data, conversations },
          };
        });
      }

      return { tempId };
    },
    onSuccess: (data, args, context) => {
      const { conversationId, tempId, content } = args as any;
      const convKeyId = conversationId != null ? String(conversationId) : undefined;
      
      // Clear sending state
      ui.setSendingMessage(false);
      
      // Clear message input
      ui.clearMessageInput();

      // If we got a new conversation ID, update active conversation
      if (data.data?.conversationId && data.data.conversationId !== conversationId) {
        ui.setActiveConversation(data.data.conversationId);

        // Seed the new conversation's message cache so the chat window shows the just-sent message immediately
        const newConvId = String(data.data.conversationId);
        const nowIso = new Date().toISOString();
        queryClient.setQueryData(messageKeys.list(newConvId), (prev: any) => {
          const optimisticSender = currentUser
            ? { id: currentUser.id, username: currentUser.username || 'you', name: currentUser.name || 'You' }
            : { id: 'current-user', username: 'you', name: 'You' };

          const newMsg = {
            id: tempId || `temp-msg-${Date.now()}`,
            conversation_id: newConvId,
            content: (content || "").trim(),
            timestamp: nowIso,
            created_at: nowIso,
            sender: optimisticSender,
            senderType: 'user',
            is_read: true,
          };

          if (!prev || !prev.pages || prev.pages.length === 0) {
            return {
              pages: [
                {
                  data: {
                    messages: [newMsg],
                    pagination: { page: 1, limit: 50, total: 1, hasMore: false },
                  },
                },
              ],
              pageParams: [1],
            };
          }

          const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
          const lastIdx = copy.pages.length - 1;
          const last = { ...copy.pages[lastIdx] };
          const list = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];
          if (!list.some((m: any) => m.id === newMsg.id)) {
            list.push(newMsg);
            last.data = { ...(last.data || {}), messages: list };
            copy.pages[lastIdx] = last;
          }
          return copy;
        });
      }

      // Invalidate and refetch to get the real message data
      if (convKeyId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(convKeyId) });
      }
      if (data.data?.conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(String(data.data.conversationId)) });
      }
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
    onError: (error, args, context) => {
      console.error('[useSendMessage] Error:', error);
      
      // Clear sending state
      ui.setSendingMessage(false);
      
      // Revert optimistic updates
      const { conversationId, tempId } = args;
      const convKeyId = conversationId != null ? String(conversationId) : undefined;
      if (convKeyId && tempId) {
        // Remove optimistic message
        queryClient.setQueryData(messageKeys.list(convKeyId), (prev: any) => {
          if (!prev?.pages) return prev;
          
          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({
              ...p,
              data: {
                ...p.data,
                messages: (p.data?.messages || []).filter((m: any) => m.id !== tempId),
              },
            })),
          };
          return copy;
        });
        
        // Revert conversation list changes
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }
    },
  });
}

// Mark messages as read mutation
export function useMarkAsReadMutation(conversationId?: string) {
  const queryClient = useQueryClient();
  const { unread } = useMessagingActions();

  return useMutation({
    mutationFn: async (args: ReadArgs) => {
      if (!conversationId) throw new Error('Conversation ID required');
      
      const { messageIds } = args;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error('Message IDs required');
      }

      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch(backendPath(`/messaging/conversations/${conversationId}/read`), {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ messageIds }),
      });

      const rawText = await resp.text();
      if (!resp.ok) {
        const snippet = rawText?.slice(0, 500) || "";
        throw new Error(`HTTP ${resp.status}${snippet ? ": " + snippet : ""}`);
      }
      try {
        return rawText ? JSON.parse(rawText) : {};
      } catch {
        return {} as any;
      }
    },
    onMutate: async (args) => {
      if (!conversationId) return;
      
      const { messageIds } = args;
      
      // Optimistically mark messages as read in cache
      queryClient.setQueryData(messageKeys.list(conversationId), (prev: any) => {
        if (!prev?.pages) return prev;
        
        const copy = {
          ...prev,
          pages: prev.pages.map((p: any) => ({
            ...p,
            data: {
              ...p.data,
              messages: (p.data?.messages || []).map((msg: any) =>
                messageIds.includes(msg.id)
                  ? { ...msg, is_read: true, isRead: true }
                  : msg
              ),
            },
          })),
        };
        return copy;
      });

      // Update conversation unread count
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        if (!prev?.data?.conversations) return prev;
        
        const conversations = prev.data.conversations.map((c: any) =>
          c.id === conversationId
            ? {
                ...c,
                unread_count: Math.max(0, (c.unread_count || 0) - messageIds.length),
                lastMessage: c.lastMessage && messageIds.includes(c.lastMessage.id)
                  ? { ...c.lastMessage, isRead: true, is_read: true }
                  : c.lastMessage,
              }
            : c
        );
        
        return {
          ...prev,
          data: { ...prev.data, conversations },
        };
      });

      // Update Zustand unread store
      unread.markConversationAsRead(conversationId, messageIds[messageIds.length - 1]);
    },
    onError: (error, args) => {
      console.error('[useMarkAsRead] Error:', error);
      
      // Invalidate to revert optimistic updates
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }
    },
  });
}

// Mark messages as opened mutation
export function useMarkAsOpenedMutation(conversationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: ReadArgs) => {
      if (!conversationId) throw new Error('Conversation ID required');
      
      const { messageIds } = args;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error('Message IDs required');
      }

      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch(backendPath(`/messaging/conversations/${conversationId}/opened`), {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ messageIds }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json().catch(() => ({}));
    },
    onMutate: async (args) => {
      if (!conversationId) return;
      
      const { messageIds } = args;
      
      // Optimistically mark messages as opened in cache
      queryClient.setQueryData(messageKeys.list(conversationId), (prev: any) => {
        if (!prev?.pages) return prev;
        
        const copy = {
          ...prev,
          pages: prev.pages.map((p: any) => ({
            ...p,
            data: {
              ...p.data,
              messages: (p.data?.messages || []).map((msg: any) =>
                messageIds.includes(msg.id)
                  ? { ...msg, isOpened: true }
                  : msg
              ),
            },
          })),
        };
        return copy;
      });

      // Update conversation last message if it's in the opened list
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        if (!prev?.data?.conversations) return prev;
        
        const conversations = prev.data.conversations.map((c: any) =>
          c.id === conversationId && c.lastMessage && messageIds.includes(c.lastMessage.id)
            ? {
                ...c,
                lastMessage: { ...c.lastMessage, isOpened: true },
              }
            : c
        );
        
        return {
          ...prev,
          data: { ...prev.data, conversations },
        };
      });
    },
    onError: (error, args) => {
      console.error('[useMarkAsOpened] Error:', error);
      
      // Invalidate to revert optimistic updates
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }
    },
  });
}
