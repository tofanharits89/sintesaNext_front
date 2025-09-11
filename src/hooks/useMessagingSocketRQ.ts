"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";
import { conversationKeys } from "./useConversationsRQ";
import { messageKeys } from "./useMessagesRQ";
import {
  useMessagingActions,
  useTypingActions,
  useUnreadActions,
  useNotificationActions,
  useActiveConversationId,
} from "@/stores";
import {
  SOCKET_EVENTS,
  SocketMessageData,
  FrontendMessage,
} from "@/shared/socket-events";
import { useCurrentUser } from "@/lib/use-current-user";
import { getTempMessages } from "@/features/messaging/temp-messages-store";

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

  // Deduplicate temp->real reconciliation events
  const reconciledMapRef = useRef<Map<string, string>>(new Map());

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
        Array.isArray(pg?.conversations)
          ? pg.conversations.map((c: any) => c?.id).filter(Boolean)
          : []
      );
      ids.forEach((id) => {
        // Skip temporary conversation ids; server rightfully denies joining them
        if (
          typeof id === "string" &&
          (id.startsWith("temp-") ||
            id.startsWith("temp_conv-") ||
            id.startsWith("temp-conv-"))
        ) {
          return;
        }
        if (!joinedRoomsRef.current.has(id)) {
          try {
            emit(
              SOCKET_EVENTS.CONVERSATION_JOIN,
              { conversationId: id },
              (resp: any) => {
                try {
                  // debug removed
                } catch {}
              }
            );
            joinedRoomsRef.current.add(id);
            // console.debug("[MessagingSocketRQ] Joined conversation room", id);
          } catch {}
        }
      });
    } catch {}
  }, [queryClient, emit]);

  // Handle new/received messages
  const handleNewMessage = useCallback(
    (incoming: SocketMessageData | any) => {
      // debug removed
      // Normalize payload to a flat structure
      const normalized = (() => {
        if (incoming && typeof incoming === "object" && incoming.message) {
          const msg = incoming.message;
          const ts =
            msg.timestamp || msg.created_at || new Date().toISOString();
          return {
            id: msg.id,
            content: msg.content,
            timestamp: ts,
            sender: msg.sender || incoming.sender,
            senderType:
              msg.senderType || msg.sender_type || incoming.senderType,
            conversationId: incoming.conversationId || msg.conversation_id,
            tempId: incoming.tempId || msg.tempId || msg.temp_id,
          } as SocketMessageData & { tempId?: string };
        }
        const ts =
          incoming?.timestamp ||
          incoming?.created_at ||
          new Date().toISOString();
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
            if (now - ts > DEDUPE_TTL_MS)
              processedMessageIdsRef.current.delete(mid);
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
        const existing = queryClient.getQueryData<any>(
          messageKeys.messages(conversationId)
        );
        if (existing?.pages) {
          const exists = existing.pages.some(
            (p: any) =>
              Array.isArray(p?.data?.messages) &&
              p.data.messages.some((m: any) => m.id === normalized.id)
          );
          if (exists) {
            return; // already processed this message, avoid duplicate append and unread increments
          }
        }
      } catch {}

      // Update React Query cache for messages
      queryClient.setQueryData(
        messageKeys.messages(conversationId),
        (prev: any) => {
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
                    pagination: {
                      page: 1,
                      limit: 50,
                      total: 1,
                      hasMore: true,
                    },
                  },
                },
              ],
              pageParams: [undefined],
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
            copy.pages[lastIdx] = {
              ...last,
              data: { ...(last.data || {}), messages },
            };
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
        }
      );

      // Update React Query cache for conversations (useInfiniteQuery shape)
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        const empty = {
          pages: [{ conversations: [], nextCursor: null }],
          pageParams: [null],
        };
        const curr = prev && prev.pages ? prev : empty;

        const pages = curr.pages.map((pg: any) => ({
          ...pg,
          conversations: Array.isArray(pg.conversations)
            ? [...pg.conversations]
            : [],
        }));

        // find the conversation
        let pFound = -1;
        let iFound = -1;
        pages.forEach((pg: any, pIdx: number) => {
          const idx = pg.conversations.findIndex(
            (c: any) => c.id === conversationId
          );
          if (idx !== -1) {
            pFound = pIdx;
            iFound = idx;
          }
        });

        if (iFound !== -1) {
          const removed = pages[pFound].conversations.splice(iFound, 1)[0];
          const conv = { ...(removed || {}) } as any;
          conv.lastMessage = {
            ...(conv.lastMessage || {}),
            id: normalized.id,
            content: normalized.content,
            timestamp: normalized.timestamp,
            sender: normalized.sender,
            senderType: normalized.senderType,
            isRead: false,
            is_read: false,
          };
          conv.updated_at = normalized.timestamp;
          conv.updatedAt = normalized.timestamp;

          // unread count if message not from self
          const fromSelf =
            currentUser?.id && normalized.sender?.id === currentUser.id;
          if (!fromSelf) {
            const currUnread =
              typeof conv.unread_count === "number" ? conv.unread_count : 0;
            conv.unread_count = currUnread + 1;
          }

          const first = pages[0] || { conversations: [], nextCursor: null };
          first.conversations.unshift(conv);
          pages[0] = first;
          return { pages, pageParams: curr.pageParams };
        }

        return curr;
      });

      // Update Zustand stores
      const fromSelf =
        currentUser?.id && normalized.sender?.id === currentUser.id;
      if (!fromSelf) {
        // Update unread count
        unreadActions.incrementUnreadCount(
          conversationId,
          normalized.id,
          normalized.timestamp
        );

        // Add notification
        notificationActions.addNotification({
          type: "message",
          title: "New Message",
          message: `${normalized.sender?.name || "Someone"}: ${
            normalized.content
          }`,
          conversationId,
          userId: normalized.sender?.id,
        });
      }

      // Notify UI listeners (e.g., chat window) to adjust scroll when messages are appended
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("messages:appended", { detail: { conversationId } })
          );
        }
      } catch {}
    },
    [queryClient, currentUser, unreadActions, notificationActions]
  );

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

    if (
      current &&
      !(
        String(current).startsWith("temp-") ||
        String(current).startsWith("temp_conv-") ||
        String(current).startsWith("temp-conv-")
      )
    ) {
      try {
        emit(
          SOCKET_EVENTS.CONVERSATION_JOIN,
          { conversationId: current },
          (resp: any) => {
            // debug removed
          }
        );
      } catch {}
    }

    prevConvRef.current = current;
  }, [activeConversationId, isConnected, emit]);

  // Handle message read events
  const handleMessageRead = useCallback(
    (data: { conversationId: string; messageIds: string[] }) => {
      // debug removed
      const { conversationId, messageIds } = data;

      // Update React Query cache for messages
      queryClient.setQueryData(
        messageKeys.messages(conversationId),
        (prev: any) => {
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
        }
      );

      // Update React Query cache for conversations (useInfiniteQuery shape)
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        const empty = {
          pages: [{ conversations: [], nextCursor: null }],
          pageParams: [null],
        };
        const curr = prev && prev.pages ? prev : empty;

        const pages = curr.pages.map((pg: any) => ({
          ...pg,
          conversations: Array.isArray(pg.conversations)
            ? pg.conversations.map((c: any) => {
                if (c.id !== conversationId) return c;
                // Do NOT change unread_count on READ; we decrement on OPENED only
                const updateLast =
                  c.lastMessage && messageIds.includes(c.lastMessage.id)
                    ? { ...c.lastMessage, isRead: true, is_read: true }
                    : c.lastMessage;
                return {
                  ...c,
                  unread_count: c.unread_count,
                  lastMessage: updateLast,
                };
              })
            : [],
        }));

        return { pages, pageParams: curr.pageParams };
      });

      // Note: do not force unread store to zero on READ; OPENED handler updates it.
    },
    [queryClient, unreadActions]
  );

  // MESSAGE_OPENED event removed - using 2-state system (delivered -> read)

  // Handle typing indicators
  const handleTypingStart = useCallback(
    (data: {
      conversationId: string;
      user: { id: string; username: string; name: string };
    }) => {
      typingActions.addTypingUser(data.conversationId, {
        userId: data.user.id,
        username: data.user.username,
        name: data.user.name,
        startedAt: Date.now(),
      });
    },
    [typingActions]
  );

  const handleTypingStop = useCallback(
    (data: { conversationId: string; userId: string }) => {
      typingActions.removeTypingUser(data.conversationId, data.userId);
    },
    [typingActions]
  );

  // Handle conversation creation (temp ID reconciliation)
  const handleConversationCreated = useCallback(
    (data: {
      tempId: string;
      conversationId: string;
      otherParticipant?: {
        id: string;
        username?: string;
        name?: string;
        role?: string;
      };
      participants?: Array<{
        id: string;
        username?: string;
        name?: string;
        role?: string;
      }>;
    }) => {
      const tempId = String(data?.tempId || "");
      const realId = String(data?.conversationId || "");
      try {
        // Processing conversation:created event
      } catch {}

      // Deduplicate repeated events for the same mapping
      const prev = reconciledMapRef.current.get(tempId);
      if (prev === realId) {
        try {
          // Deduplicating conversation:created event
        } catch {}
        return;
      }

      // If we are already on the real conversation, do nothing (no re-dispatch)
      if (activeConversationId === realId) {
        reconciledMapRef.current.set(tempId, realId);
        try {
          // Already on real conversation, no action needed
        } catch {}
        return;
      }

      // If currently viewing the temp conversation, switch to the real one and notify
      if (activeConversationId && activeConversationId === tempId) {
        ui.setActiveConversation(realId);
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("conversation:selected", {
                detail: { conversationId: realId },
              })
            );
          }
          console.log(
            "[MessagingDebug] switched temp->real and dispatched selection",
            {
              tempId,
              conversationId: realId,
            }
          );
        } catch {}
      }

      // Seed messages cache for the real conversation once
      try {
        const migrated = getTempMessages(tempId);
        if (Array.isArray(migrated) && migrated.length > 0) {
          const nowIso = new Date().toISOString();
          queryClient.setQueryData(messageKeys.messages(realId), (prev: any) => {
            const mapToCache = (m: any) => ({
              id: m.id,
              conversation_id: realId,
              content: m.content,
              timestamp: m.timestamp || nowIso,
              created_at: m.timestamp || nowIso,
              sender: m.sender,
              senderType: m.senderType || "user",
              is_read: true,
            });
            const seed = migrated.map(mapToCache);
            if (!prev || !prev.pages || prev.pages.length === 0) {
              return {
                pages: [
                  {
                    data: {
                      messages: seed,
                      pagination: {
                        page: 1,
                        limit: 50,
                        total: seed.length,
                        hasMore: true,
                      },
                    },
                  },
                ],
                pageParams: [undefined],
              };
            }
            const copy = {
              ...prev,
              pages: prev.pages.map((p: any) => ({ ...p })),
            };
            const lastIdx = copy.pages.length - 1;
            const last = { ...copy.pages[lastIdx] };
            const list = Array.isArray(last?.data?.messages)
              ? [...last.data.messages]
              : [];
            for (const msg of seed) {
              if (!list.some((m: any) => m?.id === msg.id)) list.push(msg);
            }
            last.data = { ...(last.data || {}), messages: list };
            copy.pages[lastIdx] = last;
            return copy;
          });
          try {
            // Temp messages migrated to real conversation
          } catch {}
        }
      } catch {}

      // Mark this mapping as reconciled so repeats are ignored
      reconciledMapRef.current.set(tempId, realId);

      // Merge participant data and reconcile temp->real using useInfiniteQuery cache shape
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        const empty = {
          pages: [{ conversations: [], nextCursor: null }],
          pageParams: [null],
        };
        const curr = prev && prev.pages ? prev : empty;

        const pages = curr.pages.map((pg: any) => ({
          ...pg,
          conversations: Array.isArray(pg.conversations)
            ? [...pg.conversations]
            : [],
        }));

        // Find temp or real entry using indices (avoids TS never errors)
        let pIndex = -1;
        let iIndex = -1;
        pages.forEach((pg: any, pIdx: number) => {
          const tIdx = pg.conversations.findIndex(
            (c: any) => c.id === data.tempId
          );
          if (tIdx !== -1) {
            pIndex = pIdx;
            iIndex = tIdx;
          }
        });
        if (pIndex === -1 || iIndex === -1) {
          pages.forEach((pg: any, pIdx: number) => {
            const rIdx = pg.conversations.findIndex(
              (c: any) => c.id === data.conversationId
            );
            if (rIdx !== -1) {
              pIndex = pIdx;
              iIndex = rIdx;
            }
          });
        }
        if (pIndex === -1 || iIndex === -1) return curr;

        // Build updated conversation
        const conv = { ...(pages[pIndex].conversations[iIndex] || {}) } as any;
        conv.id = data.conversationId;
        if (
          data.otherParticipant &&
          (!conv.otherParticipant || !conv.otherParticipant.id)
        ) {
          conv.otherParticipant = data.otherParticipant;
        }
        if (Array.isArray(data.participants) && data.participants.length > 0) {
          const selfId = currentUser?.id;
          // Try to set otherParticipant if still missing
          if (!conv.otherParticipant && selfId) {
            const other = data.participants.find((p) => p?.id !== selfId);
            if (other) conv.otherParticipant = other;
          }
        }

        // Remove original entry
        pages[pIndex].conversations.splice(iIndex, 1);

        // Remove any duplicates of tempId or realId across ALL pages
        for (let k = 0; k < pages.length; k++) {
          const pg = pages[k];
          pg.conversations = pg.conversations.filter(
            (c: any) => c.id !== data.tempId && c.id !== data.conversationId
          );
          pages[k] = pg;
        }

        // Insert updated conversation at top of first page
        const first = pages[0] || { conversations: [], nextCursor: null };
        first.conversations.unshift(conv);
        pages[0] = first;

        return { pages, pageParams: curr.pageParams };
      });

      // Defer invalidations slightly to avoid competing with immediate reconciliation writes
      setTimeout(() => {
        // Refresh server-calculated fields for conversations
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }, 150);

      // Force a fresh messages fetch for the real conversation (acts like a light "refresh")
      setTimeout(() => {
        try {
          queryClient.resetQueries({
            queryKey: messageKeys.messages(realId),
          });
          queryClient.refetchQueries({
            queryKey: messageKeys.messages(realId),
          });
          // Forcing messages refresh for real conversation
        } catch {}
      }, 200);

      // Optionally clear any temp cache for the old temp id
      if (data.tempId) {
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: messageKeys.messages(data.tempId),
          });
        }, 250);
      }
    },
    [queryClient, ui, activeConversationId, currentUser]
  );

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
    // MESSAGE_OPENED event removed - using 2-state system

    // Typing events
    on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);

    // Conversation events via socket
    // Wrap socket event to log before handling
    const socketConvCreatedListener = (payload: any) => {
      try {
        // Socket conversation:created event received
      } catch {}
      try {
        handleConversationCreated(payload);
      } catch {}
    };

    on("conversation:created", socketConvCreatedListener);

    // Also listen via browser CustomEvent dispatched by temp-message flow
    const windowListener = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as {
          tempId: string;
          conversationId: string;
          otherParticipant?: {
            id: string;
            username?: string;
            name?: string;
            role?: string;
          };
          participants?: Array<{
            id: string;
            username?: string;
            name?: string;
            role?: string;
          }>;
        };
        if (detail && detail.tempId && detail.conversationId) {
          try {
            // Window conversation:created event received
          } catch {}
          handleConversationCreated(detail);
        }
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener(
        "conversation:created",
        windowListener as EventListener
      );
    }

    return () => {
      // Clean up listeners
      clearInterval(joinInterval);
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
      // MESSAGE_OPENED event removed - using 2-state system
      off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      off("conversation:created", socketConvCreatedListener);
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "conversation:created",
          windowListener as EventListener
        );
      }
    };
  }, [
    isConnected,
    on,
    off,
    handleNewMessage,
    handleMessageRead,
    // handleMessageOpened removed
    handleTypingStart,
    handleTypingStop,
    handleConversationCreated,
    joinKnownConversationRooms,
  ]);

  // Provide methods for manual cache invalidation
  const invalidateConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  }, [queryClient]);

  const invalidateMessages = useCallback(
    (conversationId: string) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.messages(conversationId),
      });
    },
    [queryClient]
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    queryClient.invalidateQueries({ queryKey: messageKeys.all() });
  }, [queryClient]);

  return {
    isConnected,
    invalidateConversations,
    invalidateMessages,
    invalidateAll,
  };
}
