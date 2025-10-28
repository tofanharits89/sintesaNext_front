/**
 * Unified Messaging Hook
 * 
 * Replaces useMessagingSocket, useSocket, and multiple messaging hooks
 * Single hook for all messaging functionality
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { useMessagingStore, useMessagingConnection } from "@/stores/messaging-store";
import { SOCKET_EVENTS, SocketMessageData } from "@/types/socket-events";
import { socketClient } from "@/lib/api/socket-client";

// React Query keys
const conversationKeys = {
  all: ["conversations"],
  lists: () => [...conversationKeys.all, "list"],
  messages: (id: string) => [...conversationKeys.all, "messages", id],
} as const;

const messageKeys = {
  all: ["messages"],
  lists: () => [...messageKeys.all, "list"],
  messages: (id: string) => [...messageKeys.all, id],
};

export function useMessaging() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUnifiedAuth();
  const { isConnected, setActiveConversation, setConnectionStatus } = useMessagingConnection();
  
  // Get socket connection
  const socket = socketClient.getSocket();
  
  // Manual event listeners tracking
  const listeners = useRef<Map<string, ((...args: any[]) => void)[]>>(new Map());
  
  // Track processed messages
  const processedMessages = useRef<Set<string>>(new Set());
  const joinedRooms = useRef<Set<string>>(new Set());
  
  // Core event handlers
  const handleNewMessage = useCallback((incoming: SocketMessageData | any) => {
    const message = normalizeMessage(incoming);
    if (!message?.id) return;
    
    // Skip duplicates
    if (processedMessages.current.has(message.id)) return;
    processedMessages.current.add(message.id);
    
    // Cleanup old entries
    if (processedMessages.current.size > 1000) {
      const entries = Array.from(processedMessages.current);
      processedMessages.current = new Set(entries.slice(-500));
    }
    
    updateMessagesCache(queryClient, message);
    updateConversationsCache(queryClient, message, currentUser);
  }, [queryClient, currentUser]);
  
  const handleConnectionChange = useCallback(() => {
    setConnectionStatus(socketClient.isConnected());
  }, [setConnectionStatus]);
  
  const handleTypingUser = useCallback((data: any) => {
    const { addTypingUser, removeTypingUser } = useMessagingStore.getState();
    if (data.isTyping) {
      addTypingUser(data.conversationId, {
        userId: data.userId,
        username: data.username,
        startedAt: Date.now(),
      });
    } else {
      removeTypingUser(data.conversationId, data.userId);
    }
  }, []);
  
  // Setup event listeners with proper cleanup to prevent memory leaks
  useEffect(() => {
    if (!socket?.connected) return;
    
    try {
      // Connection events
      socket.on('connect', handleConnectionChange);
      socket.on('disconnect', handleConnectionChange);
      
      // Messaging events
      socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
      socket.on(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
      
      return () => {
        try {
          socket.off('connect', handleConnectionChange);
          socket.off('disconnect', handleConnectionChange);
          socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
          socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
          socket.off(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
        } catch (e) {
          // Silently handle cleanup errors (socket may be destroyed)
        }
      };
    } catch (e) {
      console.warn('[useMessaging] Error setting up socket listeners:', e);
      return undefined;
    }
  }, [socket, handleConnectionChange, handleNewMessage, handleTypingUser]);
  
  // Join conversation rooms automatically
  const joinConversationRooms = useCallback(() => {
    if (!socket?.connected) return;
    
    const cached = queryClient.getQueryData<any>(conversationKeys.lists());
    const pages = cached?.pages || [];
    const conversationIds = pages.flatMap((pg: any) =>
      Array.isArray(pg?.conversations)
        ? pg.conversations.map((c: any) => c?.id).filter(Boolean)
        : []
    );
    
    conversationIds.forEach((id: string) => {
      if (!id.startsWith("temp-") && !joinedRooms.current.has(id)) {
        socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: id });
        joinedRooms.current.add(id);
      }
    });
  }, [socket, queryClient]);
  
  useEffect(() => {
    joinConversationRooms();
    const interval = setInterval(joinConversationRooms, 10000);
    return () => clearInterval(interval);
  }, [joinConversationRooms]);
  
  // Public API
  const sendMessage = useCallback((data: {
    recipientId: string;
    content: string;
    conversationId?: string;
  }) => {
    if (!socket?.connected) {
      throw new Error("Not connected to socket server");
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Message send timeout"));
      }, 10000);
      
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        recipientId: data.recipientId,
        content: data.content,
        conversationId: data.conversationId,
        tempId,
      };

      // Optimistic update for existing conversations
      if (data.conversationId) {
        const optimisticMessage = {
          id: tempId,
          content: data.content,
          conversation_id: data.conversationId,
          conversationId: data.conversationId,
          sender: currentUser ? { id: currentUser.id, username: currentUser.username, name: currentUser.name, role: currentUser.role } : undefined,
          sender_id: currentUser?.id,
          recipient_id: data.recipientId,
          type: "text",
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          is_read: true,
          senderType: undefined,
        } as any;
        updateMessagesCache(queryClient, optimisticMessage);
        updateConversationsCache(queryClient, optimisticMessage, currentUser);
      }
      
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, messageData, (response: any) => {
        clearTimeout(timeout);
        if (response?.success) {
          try {
            const norm = normalizeMessage({ message: response.data?.message, conversationId: response.data?.conversationId });
            if (norm) {
              updateMessagesCache(queryClient, norm);
              updateConversationsCache(queryClient, norm, currentUser);
              if (norm.conversationId) {
                queryClient.invalidateQueries({ queryKey: messageKeys.messages(norm.conversationId) });
              }
            }
          } catch {}
          resolve(response.data);
        } else {
          // Mark optimistic message as failed if we added one
          if (data.conversationId) {
            queryClient.invalidateQueries({ queryKey: messageKeys.messages(data.conversationId) });
          }
          reject(new Error(response?.error || "Failed to send message"));
        }
      });
    });
  }, [socket, queryClient, currentUser]);
  
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket?.connected) return;

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });

    // Track joined conversations
    joinedRooms.current.add(conversationId);
  }, [socket]);
  
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket?.connected) return;

    socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId });
    joinedRooms.current.delete(conversationId);
  }, [socket]);
  
  const markAsRead = useCallback((messageIds: string[], conversationId: string) => {
    if (!socket?.connected) return;
    
    socket.emit(SOCKET_EVENTS.MESSAGE_READ, { messageIds, conversationId });
    
    // Update local cache immediately for better UX
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
  }, [socket, queryClient]);
  
  return {
    // Connection status
    isConnected,
    
    // Actions
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    setActiveConversation,
    
    // Cache management for React Query
    invalidateConversations: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
    invalidateMessages: (id: string) => queryClient.invalidateQueries({ queryKey: messageKeys.messages(id) }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
    
    // Raw socket access for advanced usage
    socket,
    emit: (event: string, ...args: any[]) => socket?.emit(event, ...args),
    on: (event: string, listener: (...args: any[]) => void) => {
      socket?.on(event, listener);
      // Track for cleanup
      if (!listeners.current.has(event)) {
        listeners.current.set(event, []);
      }
      listeners.current.get(event)!.push(listener);
    },
    off: (event: string, listener?: (...args: any[]) => void) => {
      socket?.off(event, listener);
      if (listener && listeners.current.has(event)) {
        const listenersList = listeners.current.get(event)!;
        const index = listenersList.indexOf(listener);
        if (index > -1) {
          listenersList.splice(index, 1);
        }
      }
    },
  };
}

// Helper functions (simplified from original)
function normalizeMessage(incoming: any): any {
  if (!incoming) return null;
  
  const msg = incoming.message || incoming;
  const conversationId = incoming.conversationId || msg.conversation_id;
  
  if (!conversationId) return null;
  
  return {
    id: msg.id,
    content: msg.content,
    conversation_id: conversationId,
    conversationId,
    sender: msg.sender,
    sender_id: msg.sender?.id || msg.sender_id,
    recipient_id: msg.recipient_id,
    type: msg.type || "text",
    created_at: msg.created_at || msg.timestamp,
    is_read: msg.is_read || false,
    timestamp: msg.timestamp || msg.created_at,
    senderType: msg.senderType || msg.sender_type || "user",
    isRead: msg.is_read || false,
  };
}

function updateMessagesCache(queryClient: any, message: any) {
  const conversationId = message.conversationId || message.conversation_id;
  if (!conversationId) return;
  
  queryClient.setQueryData(messageKeys.messages(conversationId), (prev: any) => {
    if (!prev?.pages) {
      return {
        pages: [{
          data: {
            messages: [message],
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
    
    messages.push(message);
    last.data = { ...(last.data || {}), messages };
    copy.pages[lastIdx] = last;
    return copy;
  });
}

function updateConversationsCache(queryClient: any, message: any, currentUser: any) {
  const conversationId = message.conversationId || message.conversation_id;
  if (!conversationId) return;
  
  queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
    const empty = { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
    const curr = prev?.pages ? prev : empty;
    
    const pages = curr.pages.map((pg: any) => ({
      ...pg,
      conversations: Array.isArray(pg.conversations) ? [...pg.conversations] : [],
    }));
    
    let found = false;
    pages.forEach((pg: any) => {
      const conv = pg.conversations.find((c: any) => c.id === conversationId);
      if (conv) {
        found = true;
        conv.lastMessage = message;
        conv.updated_at = message.timestamp;
        
        const fromSelf = currentUser?.id && message.sender?.id === currentUser.id;
        if (!fromSelf) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
      }
    });
    
    // Move to top
    if (found) {
      for (const pg of pages) {
        const idx = pg.conversations.findIndex((c: any) => c.id === conversationId);
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

export default useMessaging;
