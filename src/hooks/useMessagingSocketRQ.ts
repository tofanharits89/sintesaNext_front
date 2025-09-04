"use client";

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { conversationKeys } from './useConversationsRQ';
import { messageKeys } from './useMessagesRQ';
import { 
  useMessagingActions, 
  useTypingActions, 
  useUnreadActions, 
  useNotificationActions,
  useActiveConversationId,
} from '@/stores';
import { 
  SOCKET_EVENTS, 
  SocketMessageData, 
  FrontendMessage 
} from '@/shared/socket-events';
import { useCurrentUser } from '@/lib/use-current-user';

/**
 * WebSocket integration hook for React Query + Zustand messaging system
 * 
 * This hook:
 * 1. Listens to WebSocket events
 * 2. Updates React Query cache for persistent data
 * 3. Updates Zustand stores for UI state
 * 4. Handles real-time updates seamlessly
 */
export function useMessagingSocketRQ() {
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useSocket();
  const { currentUser } = useCurrentUser();
  
  // Store actions
  const { ui } = useMessagingActions();
  const typingActions = useTypingActions();
  const unreadActions = useUnreadActions();
  const notificationActions = useNotificationActions();
  // Current active conversation id
  const activeConversationId = useActiveConversationId();

  // Handle new/received messages
  const handleNewMessage = useCallback((messageData: SocketMessageData) => {
    console.debug('[useMessagingSocketRQ] New message:', messageData);
    
    const conversationId = messageData.conversationId;
    if (!conversationId) return;

    // Update React Query cache for messages
    queryClient.setQueryData(messageKeys.list(conversationId), (prev: any) => {
      if (!prev?.pages) {
        // Initialize cache if empty
        return {
          pages: [{
            data: {
              messages: [{
                id: messageData.id,
                conversation_id: conversationId,
                content: messageData.content,
                timestamp: messageData.timestamp,
                created_at: messageData.timestamp,
                sender: messageData.sender,
                senderType: messageData.senderType,
                is_read: false,
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
      const messages = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];
      
      // Handle tempId reconciliation if present
      const tempId = (messageData as any).tempId;
      if (tempId) {
        // Remove optimistic message with tempId
        const filteredMessages = messages.filter((m: any) => m.id !== tempId);
        messages.splice(0, messages.length, ...filteredMessages);
      }
      
      // Add new message
      messages.push({
        id: messageData.id,
        conversation_id: conversationId,
        content: messageData.content,
        timestamp: messageData.timestamp,
        created_at: messageData.timestamp,
        sender: messageData.sender,
        senderType: messageData.senderType,
        is_read: false,
      });
      
      last.data = { ...(last.data || {}), messages };
      copy.pages[lastIdx] = last;
      return copy;
    });

    // Update React Query cache for conversations
    queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
      if (!prev?.data?.conversations) return prev;
      
      const conversations = [...prev.data.conversations];
      const idx = conversations.findIndex((c: any) => c.id === conversationId);
      
      if (idx !== -1) {
        const conv = { ...conversations[idx] };
        conv.lastMessage = {
          id: messageData.id,
          content: messageData.content,
          timestamp: messageData.timestamp,
          sender: messageData.sender,
          senderType: messageData.senderType,
          isRead: false,
          is_read: false,
        };
        conv.updated_at = messageData.timestamp;
        
        // Update unread count if message is not from current user
        const fromSelf = currentUser?.id && messageData.sender?.id === currentUser.id;
        if (!fromSelf) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
        
        // Move to top
        conversations.splice(idx, 1);
        conversations.unshift(conv);
      }
      
      return {
        ...prev,
        data: { ...prev.data, conversations },
      };
    });

    // Update Zustand stores
    const fromSelf = currentUser?.id && messageData.sender?.id === currentUser.id;
    if (!fromSelf) {
      // Update unread count
      unreadActions.incrementUnreadCount(
        conversationId,
        messageData.id,
        messageData.timestamp
      );
      
      // Add notification
      notificationActions.addNotification({
        type: 'message',
        title: 'New Message',
        message: `${messageData.sender?.name || 'Someone'}: ${messageData.content}`,
        conversationId,
        userId: messageData.sender?.id,
      });
    }
  }, [queryClient, currentUser, unreadActions, notificationActions]);

  // Handle message read events
  const handleMessageRead = useCallback((data: { conversationId: string; messageIds: string[] }) => {
    console.debug('[useMessagingSocketRQ] Messages read:', data);
    
    const { conversationId, messageIds } = data;
    
    // Update React Query cache for messages
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

    // Update React Query cache for conversations
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
    unreadActions.setUnreadCount(conversationId, 0, messageIds[messageIds.length - 1]);
  }, [queryClient, unreadActions]);

  // Handle typing indicators
  const handleTypingStart = useCallback((data: { 
    conversationId: string; 
    user: { id: string; username: string; name: string } 
  }) => {
    console.debug('[useMessagingSocketRQ] Typing start:', data);
    
    typingActions.addTypingUser(data.conversationId, {
      userId: data.user.id,
      username: data.user.username,
      name: data.user.name,
      startedAt: Date.now(),
    });
  }, [typingActions]);

  const handleTypingStop = useCallback((data: { 
    conversationId: string; 
    userId: string 
  }) => {
    console.debug('[useMessagingSocketRQ] Typing stop:', data);
    
    typingActions.removeTypingUser(data.conversationId, data.userId);
  }, [typingActions]);

  // Handle conversation creation (temp ID reconciliation)
  const handleConversationCreated = useCallback((data: { 
    tempId: string; 
    conversationId: string;
    otherParticipant?: { id: string; username?: string; name?: string; role?: string };
    participants?: Array<{ id: string; username?: string; name?: string; role?: string }>;
  }) => {
    console.debug('[useMessagingSocketRQ] Conversation created:', data);

    // If the currently active conversation is the temporary one, switch to the real ID
    if (activeConversationId && activeConversationId === data.tempId) {
      ui.setActiveConversation(data.conversationId);
    }

    // Merge participant data into cache immediately to avoid 'Unknown User'
    queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
      if (!prev?.data?.conversations) return prev;
      const conversations = [...prev.data.conversations];
      // Try to find by tempId first
      let idx = conversations.findIndex((c: any) => c.id === data.tempId);
      // Fallback: maybe server created and list has realId already
      if (idx === -1) idx = conversations.findIndex((c: any) => c.id === data.conversationId);
      if (idx === -1) return prev;

      const conv = { ...conversations[idx] };
      // Reconcile id
      conv.id = data.conversationId;
      // Apply participant data if provided
      if (data.otherParticipant && !conv.otherParticipant) {
        conv.otherParticipant = data.otherParticipant;
      }
      if (Array.isArray(data.participants) && data.participants.length >= 2) {
        // Assign participant1/2 based on current user
        const selfId = currentUser?.id;
        const p1 = data.participants[0];
        const p2 = data.participants[1];
        // Best effort mapping
        conv.participant1 = p1;
        conv.participant2 = p2;
        conv.participant1_id = p1?.id;
        conv.participant2_id = p2?.id;
        if (!conv.otherParticipant && selfId) {
          const other = [p1, p2].find((p) => p?.id !== selfId);
          if (other) conv.otherParticipant = other;
        }
      }

      // Replace temp entry positionally
      conversations[idx] = conv;
      // Also ensure any duplicate (old temp id) entries are removed
      const deduped = conversations.filter((c: any, i: number) => i === idx || c.id !== data.tempId);
      return { ...prev, data: { ...prev.data, conversations: deduped } };
    });

    // Invalidate conversations list to pick up any server-calculated fields
    queryClient.invalidateQueries({ queryKey: conversationKeys.all });

    // Invalidate messages for both temp and real IDs to refresh caches
    if (data.tempId) {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(data.tempId) });
      // Optionally remove the temp messages cache altogether
      // queryClient.removeQueries({ queryKey: messageKeys.list(data.tempId) });
    }
    queryClient.invalidateQueries({ queryKey: messageKeys.list(data.conversationId) });
  }, [queryClient, ui, activeConversationId, currentUser]);

  // Set up WebSocket event listeners
  useEffect(() => {
    console.debug('[useMessagingSocketRQ] mount/useEffect', { isConnected });
    if (!isConnected) return;

    // Message events
    on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    on(SOCKET_EVENTS.MESSAGE_OPENED, handleMessageRead); // Same handler for now

    // Typing events
    on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

    // Conversation events via socket
    on('conversation:created', handleConversationCreated);

    // Also listen via browser CustomEvent dispatched by temp-message flow
    const windowListener = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as {
          tempId: string;
          conversationId: string;
          otherParticipant?: { id: string; username?: string; name?: string; role?: string };
          participants?: Array<{ id: string; username?: string; name?: string; role?: string }>;
        };
        if (detail && detail.tempId && detail.conversationId) {
          handleConversationCreated(detail);
        }
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('conversation:created', windowListener as EventListener);
    }

    return () => {
      // Clean up listeners
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      off(SOCKET_EVENTS.MESSAGE_OPENED, handleMessageRead);
      off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      off('conversation:created', handleConversationCreated);
      if (typeof window !== 'undefined') {
        window.removeEventListener('conversation:created', windowListener as EventListener);
      }
    };
  }, [
    isConnected,
    on,
    off,
    handleNewMessage,
    handleMessageRead,
    handleTypingStart,
    handleTypingStop,
    handleConversationCreated,
  ]);

  // Provide methods for manual cache invalidation
  const invalidateConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  }, [queryClient]);

  const invalidateMessages = useCallback((conversationId: string) => {
    queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    queryClient.invalidateQueries({ queryKey: messageKeys.all });
  }, [queryClient]);

  return {
    isConnected,
    invalidateConversations,
    invalidateMessages,
    invalidateAll,
  };
}
