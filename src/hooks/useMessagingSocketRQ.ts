"use client";

import { useEffect, useCallback, useRef } from 'react';
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
  const { socket, on, off, isConnected, emit } = useSocket();
  const { currentUser } = useCurrentUser();
  // In-memory dedupe for rapid duplicate socket events
  const processedMessageIdsRef = useRef<Map<string, number>>(new Map());
  const DEDUPE_TTL_MS = 15_000; // 15s window
  
  // Store actions
  const { ui } = useMessagingActions();
  const typingActions = useTypingActions();
  const unreadActions = useUnreadActions();
  const notificationActions = useNotificationActions();
  // Current active conversation id
  const activeConversationId = useActiveConversationId();

  // Track which rooms we've joined to avoid duplicate emits
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // Helper to join known conversation rooms from React Query cache
  const joinKnownConversationRooms = useCallback(() => {
    try {
      const cached = queryClient.getQueryData<any>(conversationKeys.lists());
      const pages = cached?.pages || [];
      const ids: string[] = pages.flatMap((pg: any) =>
        Array.isArray(pg?.conversations) ? pg.conversations.map((c: any) => c?.id).filter(Boolean) : []
      );
      ids.forEach((id) => {
        if (!joinedRoomsRef.current.has(id)) {
          try {
            emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: id });
            joinedRoomsRef.current.add(id);
            // console.debug("[MessagingSocketRQ] Joined conversation room", id);
          } catch {}
        }
      });
    } catch {}
  }, [queryClient, emit]);

  // Handle new/received messages
  const handleNewMessage = useCallback((incoming: SocketMessageData | any) => {
    try {
      console.debug("[MessagingSocketRQ] handleNewMessage incoming", incoming);
    } catch {}
    // Normalize payload to a flat structure
    const normalized = (() => {
      if (incoming && typeof incoming === 'object' && incoming.message) {
        const msg = incoming.message;
        const ts = msg.timestamp || msg.created_at || new Date().toISOString();
        return {
          id: msg.id,
          content: msg.content,
          timestamp: ts,
          sender: msg.sender || incoming.sender,
          senderType: msg.senderType || msg.sender_type || incoming.senderType,
          conversationId: incoming.conversationId || msg.conversation_id,
          tempId: incoming.tempId || msg.tempId || msg.temp_id,
        } as SocketMessageData & { tempId?: string };
      }
      const ts = incoming?.timestamp || incoming?.created_at || new Date().toISOString();
      return {
        id: incoming?.id,
        content: incoming?.content,
        timestamp: ts,
        sender: incoming?.sender,
        senderType: incoming?.senderType || incoming?.sender_type,
        conversationId: incoming?.conversationId || incoming?.conversation_id,
        tempId: incoming?.tempId || incoming?.temp_id,
      } as SocketMessageData & { tempId?: string };
    })();

    const conversationId = normalized.conversationId;
    if (!conversationId) return;

    // In-memory rapid dedupe (handles races where multiple events arrive before cache reflects updates)
    try {
      const now = Date.now();
      // prune expired entries occasionally
      if (processedMessageIdsRef.current.size > 500) {
        for (const [mid, ts] of processedMessageIdsRef.current) {
          if (now - ts > DEDUPE_TTL_MS) processedMessageIdsRef.current.delete(mid);
        }
      }
      const lastTs = processedMessageIdsRef.current.get(normalized.id);
      if (lastTs && now - lastTs < DEDUPE_TTL_MS) {
        return; // already processed recently
      }
      processedMessageIdsRef.current.set(normalized.id, now);
    } catch {}

    // Deduplicate: if this message id already exists in cache, skip processing
    try {
      const existing = queryClient.getQueryData<any>(messageKeys.list(conversationId));
      if (existing?.pages) {
        const exists = existing.pages.some((p: any) =>
          Array.isArray(p?.data?.messages) && p.data.messages.some((m: any) => m.id === normalized.id)
        );
        if (exists) {
          return; // already processed this message, avoid duplicate append and unread increments
        }
      }
    } catch {}

    // Update React Query cache for messages
    queryClient.setQueryData(messageKeys.list(conversationId), (prev: any) => {
      if (!prev?.pages) {
        // Initialize cache if empty so first realtime message appears immediately
        return {
          pages: [
            {
              data: {
                messages: [
                  {
                    id: normalized.id,
                    conversation_id: conversationId,
                    content: normalized.content,
                    timestamp: normalized.timestamp,
                    created_at: normalized.timestamp,
                    sender: normalized.sender,
                    senderType: normalized.senderType,
                    is_read: false,
                  },
                ],
                pagination: { page: 1, limit: 50, total: 1, hasMore: false },
              },
            },
          ],
          pageParams: [1],
        };
      }

      const copy = {
        ...prev,
        pages: prev.pages.map((p: any) => ({ ...p })),
      };
      const lastIdx = copy.pages.length - 1;
      const last = { ...copy.pages[lastIdx] };
      const messages = Array.isArray(last?.data?.messages)
        ? [...last.data.messages]
        : [];

      // Safety: if by any chance it exists in last page, skip appending
      if (messages.some((m: any) => m.id === normalized.id)) {
        copy.pages[lastIdx] = { ...last, data: { ...(last.data || {}), messages } };
        return copy;
      }

      // Handle tempId reconciliation if present
      const tempId = (normalized as any).tempId;
      if (tempId) {
        const filtered = messages.filter((m: any) => m.id !== tempId);
        messages.splice(0, messages.length, ...filtered);
      }

      // Add new message
      messages.push({
        id: normalized.id,
        conversation_id: conversationId,
        content: normalized.content,
        timestamp: normalized.timestamp,
        created_at: normalized.timestamp,
        sender: normalized.sender,
        senderType: normalized.senderType,
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
          id: normalized.id,
          content: normalized.content,
          timestamp: normalized.timestamp,
          sender: normalized.sender,
          senderType: normalized.senderType,
          isRead: false,
          is_read: false,
        };
        conv.updated_at = normalized.timestamp;
        
        // Update unread count if message is not from current user
        const fromSelf = currentUser?.id && normalized.sender?.id === currentUser.id;
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
    const fromSelf = currentUser?.id && normalized.sender?.id === currentUser.id;
    if (!fromSelf) {
      // Update unread count
      unreadActions.incrementUnreadCount(conversationId, normalized.id, normalized.timestamp);
      
      // Add notification
      notificationActions.addNotification({
        type: 'message',
        title: 'New Message',
        message: `${normalized.sender?.name || 'Someone'}: ${normalized.content}`,
        conversationId,
        userId: normalized.sender?.id,
      });
    }

    // Notify UI listeners (e.g., chat window) to adjust scroll when messages are appended
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('messages:appended', { detail: { conversationId } })
        );
      }
    } catch {}
  }, [queryClient, currentUser, unreadActions, notificationActions]);

  // Join/leave conversation rooms as active conversation changes to ensure we receive events
  const prevConvRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isConnected) return;
    const current = activeConversationId || null;
    const prev = prevConvRef.current;

    if (prev && prev !== current) {
      try {
        emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId: prev });
      } catch {}
    }

    if (current) {
      try {
        emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: current });
      } catch {}
    }

    prevConvRef.current = current;
  }, [activeConversationId, isConnected, emit]);

  // Handle message read events
  const handleMessageRead = useCallback((data: { conversationId: string; messageIds: string[] }) => {
    try {
      console.debug("[MessagingSocketRQ] handleMessageRead/opened incoming", data);
    } catch {}
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
    typingActions.removeTypingUser(data.conversationId, data.userId);
  }, [typingActions]);

  // Handle conversation creation (temp ID reconciliation)
  const handleConversationCreated = useCallback((data: { 
    tempId: string; 
    conversationId: string;
    otherParticipant?: { id: string; username?: string; name?: string; role?: string };
    participants?: Array<{ id: string; username?: string; name?: string; role?: string }>;
  }) => {
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
    if (!isConnected) return;

    // Attempt to join all known conversation rooms immediately and periodically
    joinKnownConversationRooms();
    const joinInterval = setInterval(() => joinKnownConversationRooms(), 10000);

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
      clearInterval(joinInterval);
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
    joinKnownConversationRooms,
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
