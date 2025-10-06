"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";
import { conversationKeys } from "./useConversationsRQ";
import { messageKeys } from "./useMessagesRQ";
import {
  useTypingActions,
  useUnreadActions,
  useNotificationActions,
  useActiveConversationId,
} from "@/stores";
import {
  SOCKET_EVENTS,
  SocketMessageData,
} from "@/shared/socket-events";
import { useUnifiedAuth } from "@/lib/auth-state-unified";

/**
 * Simplified WebSocket integration for messaging
 * Handles real-time updates without complex race conditions
 */
export function useMessagingSocketRQ() {
  const queryClient = useQueryClient();
  const { socket, on, off, isConnected, emit } = useSocket();
  const { user: currentUser } = useUnifiedAuth();

  // Store actions
  const typingActions = useTypingActions();
  const unreadActions = useUnreadActions();
  const notificationActions = useNotificationActions();
  const activeConversationId = useActiveConversationId();

  // Track processed messages to prevent duplicates
  const processedMessages = useRef<Set<string>>(new Set());
  const joinedRooms = useRef<Set<string>>(new Set());

  // Handle new messages
  const handleNewMessage = useCallback((incoming: SocketMessageData | any) => {
    const message = normalizeMessage(incoming);
    if (!message?.id || !message.conversationId) return;

    // Skip duplicates
    if (processedMessages.current.has(message.id)) return;
    processedMessages.current.add(message.id);

    // Cleanup old entries (keep last 1000)
    if (processedMessages.current.size > 1000) {
      const entries = Array.from(processedMessages.current);
      processedMessages.current = new Set(entries.slice(-500));
    }

    updateMessagesCache(queryClient, message);
    updateConversationsCache(queryClient, message, currentUser);
    updateZustandStores(message, currentUser, unreadActions, notificationActions);
  }, [queryClient, currentUser, unreadActions, notificationActions]);

  // Handle message read events
  const handleMessageRead = useCallback((data: { conversationId: string; messageIds: string[] }) => {
    updateMessagesReadStatus(queryClient, data.conversationId, data.messageIds);
  }, [queryClient]);

  // Handle typing indicators
  const handleTypingStart = useCallback((data: { conversationId: string; user: any }) => {
    typingActions.addTypingUser(data.conversationId, {
      userId: data.user.id,
      username: data.user.username,
      name: data.user.name,
      startedAt: Date.now(),
    });
  }, [typingActions]);

  const handleTypingStop = useCallback((data: { conversationId: string; userId: string }) => {
    typingActions.removeTypingUser(data.conversationId, data.userId);
  }, [typingActions]);

  // Join conversation rooms
  const joinConversationRooms = useCallback(() => {
    if (!isConnected) return;

    try {
      const cached = queryClient.getQueryData<any>(conversationKeys.lists());
      const pages = cached?.pages || [];
      const conversationIds = pages.flatMap((pg: any) =>
        Array.isArray(pg?.conversations)
          ? pg.conversations.map((c: any) => c?.id).filter(Boolean)
          : []
      );

      conversationIds.forEach((id: string) => {
        if (!id.startsWith("temp-") && !joinedRooms.current.has(id)) {
          emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: id });
          joinedRooms.current.add(id);
        }
      });
    } catch (error) {
      console.error("Failed to join conversation rooms:", error);
    }
  }, [isConnected, queryClient, emit]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Join rooms periodically
    joinConversationRooms();
    const interval = setInterval(joinConversationRooms, 10000);

    // Message events
    on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);

    // Typing events
    on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

    return () => {
      clearInterval(interval);
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    };
  }, [
    isConnected, on, off,
    handleNewMessage, handleMessageRead,
    handleTypingStart, handleTypingStop,
    joinConversationRooms
  ]);

  // Join/leave active conversation room
  useEffect(() => {
    if (!isConnected || !activeConversationId) return;

    const conversationId = activeConversationId;
    if (!conversationId.startsWith("temp-")) {
      emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
    }

    return () => {
      if (!conversationId.startsWith("temp-")) {
        emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId });
        joinedRooms.current.delete(conversationId);
      }
    };
  }, [activeConversationId, isConnected, emit]);

  return {
    isConnected,
    invalidateConversations: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
    invalidateMessages: (id: string) => queryClient.invalidateQueries({ queryKey: messageKeys.messages(id) }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      queryClient.invalidateQueries({ queryKey: messageKeys.all() });
    },
  };
}

// Helper functions

function normalizeMessage(incoming: any): SocketMessageData | null {
  if (!incoming) return null;

  const msg = incoming.message || incoming;
  return {
    id: msg.id,
    content: msg.content,
    timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
    sender: msg.sender,
    senderType: msg.senderType || msg.sender_type || "user",
    conversationId: incoming.conversationId || msg.conversation_id,
  };
}

function updateMessagesCache(queryClient: any, message: SocketMessageData) {
  queryClient.setQueryData(
    messageKeys.messages(message.conversationId),
    (prev: any) => {
      if (!prev?.pages) {
        return {
          pages: [{
            data: {
              messages: [{
                id: message.id,
                conversation_id: message.conversationId,
                content: message.content,
                timestamp: message.timestamp,
                created_at: message.timestamp,
                sender: message.sender,
                senderType: message.senderType,
                is_read: false,
              }],
              pagination: { page: 1, limit: 50, total: 1, hasMore: true },
            },
          }],
          pageParams: [undefined],
        };
      }

      const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
      const lastIdx = copy.pages.length - 1;
      const last = { ...copy.pages[lastIdx] };
      const messages = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];

      // Avoid duplicates
      if (messages.some((m: any) => m.id === message.id)) return prev;

      messages.push({
        id: message.id,
        conversation_id: message.conversationId,
        content: message.content,
        timestamp: message.timestamp,
        created_at: message.timestamp,
        sender: message.sender,
        senderType: message.senderType,
        is_read: false,
      });

      last.data = { ...(last.data || {}), messages };
      copy.pages[lastIdx] = last;
      return copy;
    }
  );
}

function updateConversationsCache(queryClient: any, message: SocketMessageData, currentUser: any) {
  queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
    const empty = { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
    const curr = prev?.pages ? prev : empty;

    const pages = curr.pages.map((pg: any) => ({
      ...pg,
      conversations: Array.isArray(pg.conversations) ? [...pg.conversations] : [],
    }));

    // Find and update conversation
    let found = false;
    pages.forEach((pg: any) => {
      const conv = pg.conversations.find((c: any) => c.id === message.conversationId);
      if (conv) {
        found = true;
        conv.lastMessage = {
          id: message.id,
          content: message.content,
          timestamp: message.timestamp,
          sender: message.sender,
          isRead: false,
        };
        conv.updated_at = message.timestamp;

        // Update unread count for messages from others
        const fromSelf = currentUser?.id && message.sender?.id === currentUser.id;
        if (!fromSelf) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
      }
    });

    // Move conversation to top if found
    if (found) {
      for (const pg of pages) {
        const idx = pg.conversations.findIndex((c: any) => c.id === message.conversationId);
        if (idx !== -1) {
          const [conv] = pg.conversations.splice(idx, 1);
          pages[0].conversations.unshift(conv);
          break;
        }
      }
    }

    return { pages, pageParams: curr.pageParams };
  });
}

function updateMessagesReadStatus(queryClient: any, conversationId: string, messageIds: string[]) {
  queryClient.setQueryData(messageKeys.messages(conversationId), (prev: any) => {
    if (!prev?.pages) return prev;
    return {
      ...prev,
      pages: prev.pages.map((p: any) => ({
        ...p,
        data: {
          ...p.data,
          messages: (p.data?.messages || []).map((msg: any) =>
            messageIds.includes(msg.id) ? { ...msg, is_read: true, isRead: true } : msg
          ),
        },
      })),
    };
  });
}

function updateZustandStores(
  message: SocketMessageData,
  currentUser: any,
  unreadActions: any,
  notificationActions: any
) {
  const fromSelf = currentUser?.id && message.sender?.id === currentUser.id;

  if (!fromSelf) {
    unreadActions.incrementUnreadCount(message.conversationId, message.id, message.timestamp);
    notificationActions.addNotification({
      type: "message",
      title: "New Message",
      message: `${message.sender?.name || "Someone"}: ${message.content}`,
      conversationId: message.conversationId,
      userId: message.sender?.id,
    });
  }

  // Notify UI components
  try {
    window.dispatchEvent(new CustomEvent("messages:appended", {
      detail: { conversationId: message.conversationId }
    }));
  } catch {}
}
