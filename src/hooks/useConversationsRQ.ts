"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { apiPath } from "@/lib/base-path";
import { http } from "@/lib/httpClient"; // keep for other callers; not used in fetcher
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useSocket } from "./useSocket";
import {
  SOCKET_EVENTS,
  Conversation,
  SocketMessageData,
} from "@/shared/socket-events";
import { useCurrentUser } from "@/lib/use-current-user";

// Query keys for React Query
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// Fetcher that attaches auth and parses JSON safely (paginated by cursor)
type ConversationsPage = {
  conversations: Conversation[];
  nextCursor?: string | null;
};

type FoundLoc = { pageIdx: number; idx: number };

const fetchConversationsPage = async (
  cursor?: string | null,
  limit: number = 20
): Promise<ConversationsPage> => {
const url = new URL(
    apiPath("/messaging/conversations"),
    window.location.origin
  );
  if (cursor) url.searchParams.set("cursor", String(cursor));
  if (limit) url.searchParams.set("limit", String(limit));

  // Add timestamp to bust cache
  url.searchParams.set("_t", Date.now().toString());
  
  const resp = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
  });
  
  if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
  const json: any = await resp.json().catch(() => ({}));

  const conversations: Conversation[] =
    json?.data?.conversations || json?.conversations || [];
  const nextCursor: string | null =
    json?.data?.nextCursor ?? json?.nextCursor ?? null;

  return { conversations, nextCursor };
};

export function useConversations(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: conversationKeys.lists(),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchConversationsPage(pageParam as string | null, 20),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000, // Refetch every 5 seconds
    enabled: options?.enabled ?? true,
    retry: false, // Don't retry failed requests
  });

  // Flatten pages and ensure newest conversations appear first
  const rawConversations: Conversation[] = (data?.pages || []).flatMap(
    (p) => p.conversations || []
  );

  // Normalize conversations to ensure lastMessage.timestamp exists and updated_at is sane
  const normalizeConversation = (c: Conversation): Conversation => {
    const conv: any = { ...(c as any) };
    
    // Normalizing conversation data
    
    const lm: any = conv.lastMessage || undefined;
    if (lm) {
      const originalTimestamp = lm.timestamp;
      const originalCreatedAt = lm.created_at;
      const originalSentAt = lm.sentAt;
      
      const lmTs =
        lm.timestamp ||
        lm.created_at ||
        lm.createdAt ||
        lm.sent_at ||
        lm.sentAt;
      if (!lm.timestamp && lmTs) conv.lastMessage = { ...lm, timestamp: lmTs };
      
      // Last message timestamp normalized
    }
    const convTs =
      (conv.lastMessage &&
        ((conv.lastMessage as any).timestamp ||
          (conv.lastMessage as any).created_at ||
          (conv.lastMessage as any).createdAt)) ||
      conv.lastMessageAt ||
      conv.updated_at ||
      conv.updatedAt ||
      conv.created_at ||
      conv.createdAt;
    if (!conv.updated_at && convTs) conv.updated_at = convTs;
    
    // Conversation normalization completed
    
    return conv as Conversation;
  };

  // Remove any temporary conversations (created for optimistic UI) from the list
  const normalizedConversations: Conversation[] = rawConversations
    .filter((c) => {
      const id = String((c as any)?.id || "");
      return !(id.startsWith("temp-") || id.startsWith("temp_conversation") || id.startsWith("tempconv") || id.startsWith("temp-conv-"));
    })
    .map(normalizeConversation);

  const getLastActivity = (c: Conversation): number => {
    // Priority order for timestamp sources (most reliable first)
    const timestampSources = [
      (c.lastMessage as any)?.timestamp,
      (c as any)?.lastMessageAt,
      (c.lastMessage as any)?.created_at,
      (c.lastMessage as any)?.createdAt,
      (c as any)?.updated_at,
      (c as any)?.updatedAt,
      (c.lastMessage as any)?.message?.timestamp,
      (c.lastMessage as any)?.message?.created_at,
      (c.lastMessage as any)?.message?.createdAt,
      (c as any)?.created_at,
      (c as any)?.createdAt,
    ];

    for (const ts of timestampSources) {
      if (ts) {
        const t = new Date(ts).getTime();
        if (!isNaN(t) && t > 0) {
          return t;
        }
      }
    }
    
    // Fallback to current time for conversations without valid timestamps
    return Date.now();
  };

  // Sort conversations by last activity (most recent first) with stable sorting
  const conversations = [...normalizedConversations].sort((a, b) => {
    const aTime = getLastActivity(a);
    const bTime = getLastActivity(b);
    
    // Primary sort: by timestamp (descending)
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    
    // Secondary sort: by conversation ID for stability
    return (a.id || '').localeCompare(b.id || '');
  });

  // On mount and whenever the cache changes, purge any temp conversations from the cache itself
  useEffect(() => {
    const removeTemps = (id: any) => {
      const s = String(id || "");
      return s.startsWith("temp-") || s.startsWith("temp_conversation") || s.startsWith("tempconv") || s.startsWith("temp-conv-");
    };
    updateConversationsCache((prev) => {
      if (!prev) return { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
      const pages = prev.pages.map((pg) => ({
        ...pg,
        conversations: (pg.conversations || []).filter((c: any) => !removeTemps(c?.id)),
      }));
      return { pages, pageParams: prev.pageParams };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages?.length]);

  // Helper to update conversations cache for paginated data
  const updateConversationsCache = useCallback(
    (
      updater: (
        prev:
          | { pages: ConversationsPage[]; pageParams: (string | null)[] }
          | undefined
      ) => { pages: ConversationsPage[]; pageParams: (string | null)[] }
    ) => {
      queryClient.setQueryData(conversationKeys.lists(), updater as any);
    },
    [queryClient]
  );

  // Helpers: optimistic add and reconcile for new conversations
  const optimisticAddConversation = useCallback(
    (params: {
      tempId: string;
      otherParticipant: any;
      content: string;
      sender: any;
      senderType: "user" | "admin";
      timestamp: string;
    }) => {
      updateConversationsCache((prev) => {
        const empty: {
          pages: ConversationsPage[];
          pageParams: (string | null)[];
        } = {
          pages: [{ conversations: [], nextCursor: null }],
          pageParams: [null],
        };
        const curr = prev || empty;
        const firstPage = curr.pages[0] || {
          conversations: [],
          nextCursor: null,
        };
        const list: Conversation[] = firstPage.conversations || [];
        if (list.some((c) => c.id === params.tempId)) return curr;

        const conv: any = {
          id: params.tempId,
          otherParticipant: params.otherParticipant,
          participant1_id: params.sender?.id,
          participant2_id: params.otherParticipant?.id,
          participant1: params.sender,
          participant2: params.otherParticipant,
          updated_at: params.timestamp,
          unread_count: 0,
          lastMessage: {
            id: `temp-msg-${params.tempId}`,
            content: params.content,
            timestamp: params.timestamp,
            sender: params.sender,
            senderType: params.senderType,
            isRead: true,
            is_read: true,
          },
        };

        const nextFirst = [conv, ...list];
        const nextPages = [
          { ...firstPage, conversations: nextFirst },
          ...curr.pages.slice(1),
        ];
        return { pages: nextPages, pageParams: curr.pageParams };
      });
    },
    [updateConversationsCache]
  );

  const reconcileConversationId = useCallback(
    (tempId: string, realId: string) => {
      updateConversationsCache((prev) => {
        if (!prev)
          return {
            pages: [{ conversations: [], nextCursor: null }],
            pageParams: [null],
          };
        const pages = prev.pages.map((pg) => ({
          ...pg,
          conversations: [...pg.conversations],
        }));
        let foundAt: FoundLoc | null = null;
        pages.forEach((pg, pIdx) => {
          const idx = pg.conversations.findIndex((c) => c.id === tempId);
          if (idx !== -1) foundAt = { pageIdx: pIdx, idx };
        });
        if (!foundAt) return prev;
        const { pageIdx, idx } = foundAt as FoundLoc;

        // If a conversation with realId already exists anywhere, remove the temp; else rename
        let realExists = false;
        pages.forEach((pg) => {
          if (pg.conversations.some((c) => c.id === realId)) realExists = true;
        });

        if (realExists) {
          pages[pageIdx]!.conversations = pages[pageIdx]!.conversations.filter(
            (c) => c.id !== tempId
          );
        } else {
          pages[pageIdx]!.conversations[idx] = {
            ...pages[pageIdx]!.conversations[idx],
            id: realId,
          } as any;
        }

        return { pages, pageParams: prev.pageParams };
      });
    },
    [updateConversationsCache]
  );

  // Bridge socket events -> in-place cache updates for snappy UI
  const { on, off } = useSocket();
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    const updateOnNewMessage = (m: SocketMessageData) => {
      try {
        console.debug(
          "[ConversationsRQ] MESSAGE_NEW/RECEIVED incoming payload",
          m
        );
      } catch {}
      updateConversationsCache((prev) => {
        if (!prev)
          return {
            pages: [{ conversations: [], nextCursor: null }],
            pageParams: [null],
          };
        // Normalize possibly nested payloads and timestamps
        const msgLike: any = (m as any)?.message
          ? (m as any).message
          : (m as any);
        const conversationId =
          (m as any)?.conversationId ||
          msgLike.conversation_id ||
          msgLike.conversationId;
        const safeConversationId = String(conversationId || "");
        const ts =
          msgLike.timestamp ||
          msgLike.created_at ||
          msgLike.createdAt ||
          msgLike.sent_at ||
          msgLike.sentAt ||
          msgLike.message?.timestamp ||
          msgLike.message?.created_at ||
          msgLike.message?.createdAt ||
          msgLike.message?.sent_at ||
          msgLike.message?.sentAt;
        const tempId = (m as any)?.tempId || msgLike?.tempId || msgLike?.temp_id;

        // Locate conversation across pages
        const pages = prev.pages.map((pg) => ({
          ...pg,
          conversations: [...pg.conversations],
        }));
        let found: FoundLoc | null = null;
        if (!safeConversationId) {
          return prev; // cannot process message without a valid conversation id
        }
        pages.forEach((pg, pIdx) => {
          const idx = pg.conversations.findIndex(
            (c) => c.id === safeConversationId
          );
          if (idx !== -1) found = { pageIdx: pIdx, idx };
        });
        if (!found) {
          // Attempt reconcile: if we have a tempId entry, rename it to real conversationId
          const pages2 = prev.pages.map((pg) => ({
            ...pg,
            conversations: [...pg.conversations],
          }));
          let tempLoc: FoundLoc | null = null;
          if (tempId) {
            pages2.forEach((pg, pIdx) => {
              const tIdx = pg.conversations.findIndex((c) => c.id === tempId);
              if (tIdx !== -1) tempLoc = { pageIdx: pIdx, idx: tIdx };
            });
          }

          const effectiveTs =
            ts ||
            msgLike.timestamp ||
            msgLike.created_at ||
            msgLike.createdAt ||
            new Date().toISOString();

          const fromSelf = !!currentUser?.id && msgLike?.sender?.id === currentUser?.id;

          if (tempLoc) {
            const { pageIdx: tPage, idx: tIdx } = tempLoc as FoundLoc;
            const conv = { ...(pages2[tPage]!.conversations[tIdx] as any) };
            conv.id = safeConversationId;
            conv.lastMessage = {
              ...(conv.lastMessage || {}),
              id: msgLike.id,
              content: msgLike.content || "",
              timestamp: effectiveTs,
              sender: msgLike.sender,
              senderType: msgLike.senderType,
              isRead: fromSelf ? true : false,
              is_read: fromSelf ? true : false,
            };
            conv.updated_at = effectiveTs;

            // remove temp and place updated at top
            pages2[tPage]!.conversations.splice(tIdx, 1);
            const firstPage = pages2[0] || { conversations: [], nextCursor: null };
            firstPage.conversations.unshift(conv);
            pages2[0] = firstPage;
            return { pages: pages2, pageParams: prev.pageParams };
          }

          // If message is from self and we have no temp to reconcile, still allow updating existing conversations
          // but avoid creating new unknown conversations (let onSuccess mutation handle that)
          if (fromSelf) {
            // Check if this is updating an existing real conversation that we already have
            let existingFound: FoundLoc | null = null;
            pages2.forEach((pg, pIdx) => {
              const idx = pg.conversations.findIndex((c) => c.id === safeConversationId);
              if (idx !== -1) existingFound = { pageIdx: pIdx, idx };
            });
            
            if (!existingFound) {
              // No existing conversation found, let onSuccess mutation handle creation
              return prev;
            }
            
            // Update the existing conversation with the new message data
            const { pageIdx, idx } = existingFound;
            const conv = { ...pages2[pageIdx]!.conversations[idx] } as any;
            conv.lastMessage = {
              ...(conv.lastMessage || {}),
              id: msgLike.id,
              content: msgLike.content || "",
              timestamp: effectiveTs,
              sender: msgLike.sender,
              senderType: msgLike.senderType,
              isRead: true, // Self messages are read
              is_read: true,
            };
            conv.updated_at = effectiveTs;
            
            // Move to top of first page
            pages2[pageIdx]!.conversations.splice(idx, 1);
            const firstPage = pages2[0] || { conversations: [], nextCursor: null };
            firstPage.conversations.unshift(conv);
            pages2[0] = firstPage;
            
            // Re-sort the first page
            firstPage.conversations.sort((a, b) => {
              const aTime = new Date((a as any).updated_at || 0).getTime();
              const bTime = new Date((b as any).updated_at || 0).getTime();
              return bTime - aTime;
            });
            
            return { pages: pages2, pageParams: prev.pageParams };
          }

          // Otherwise (incoming from other user), create minimal entry so UI updates
          const firstPage = pages2[0] || { conversations: [], nextCursor: null };
          const minimalConv: any = {
            id: safeConversationId,
            updated_at: effectiveTs,
            unread_count: 1,
            otherParticipant: msgLike.sender || msgLike.from || null,
            lastMessage: {
              id: msgLike.id,
              content: msgLike.content || "",
              timestamp: effectiveTs,
              sender: msgLike.sender,
              senderType: msgLike.senderType,
              isRead: false,
              is_read: false,
            },
          };
          firstPage.conversations.unshift(minimalConv);
          pages2[0] = firstPage;
          return { pages: pages2, pageParams: prev.pageParams };
        }

        const { pageIdx, idx } = found as FoundLoc;
        const fromPage = pages[pageIdx]!;
        const [removed] = fromPage.conversations.splice(idx, 1);
        const conv = { ...(removed || {}) } as Conversation & {
          lastMessage?: any;
        };

        // Effective timestamp fallback
        const effectiveTs =
          ts ||
          (conv.lastMessage as any)?.timestamp ||
          (conv.lastMessage as any)?.created_at ||
          (conv as any)?.updated_at ||
          (conv as any)?.created_at ||
          new Date().toISOString();

        // Determine if the message is from the current user (used for flags and unread logic)
        const fromSelf =
          !!currentUser?.id && msgLike?.sender?.id === currentUser?.id;

        // Update lastMessage and timestamps with proper ordering consideration
        conv.lastMessage = {
          ...(conv.lastMessage || {}),
          id: msgLike.id ?? (conv.lastMessage as any)?.id,
          content: msgLike.content ?? (conv.lastMessage as any)?.content ?? "",
          timestamp: effectiveTs,
          sender: msgLike.sender ?? (conv.lastMessage as any)?.sender,
          senderType:
            msgLike.senderType ?? (conv.lastMessage as any)?.senderType,
          // Self messages should be marked as read immediately
          isRead: !!fromSelf,
          is_read: !!fromSelf,
        };
        
        // Update updated_at for proper ordering
        conv.updated_at = effectiveTs || conv.updated_at;

        // Increase unread_count only if the message is not from current user
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        conv.unread_count = fromSelf ? currentUnread : Math.max(0, currentUnread + 1);

        // Move to top of first page (most recent first)
        const firstPage = pages[0] || { conversations: [], nextCursor: null };
        firstPage.conversations.unshift(conv);
        pages[0] = firstPage;

        // Re-sort the first page to ensure proper ordering
        firstPage.conversations.sort((a, b) => {
          const aTime = new Date((a as any).updated_at || 0).getTime();
          const bTime = new Date((b as any).updated_at || 0).getTime();
          return bTime - aTime; // Descending order (newest first)
        });

        try {
          console.debug(
            "[ConversationsRQ] Updated conversation on new message",
            {
              conversationId,
              unread_count: conv.unread_count,
              lastMessageId: (conv.lastMessage as any)?.id,
              pagesCount: pages.length,
            }
          );
        } catch {}

        return { pages, pageParams: prev.pageParams };
      });
    };

    const updateOnReadOrOpened = (
      payload: {
        conversationId: string;
        messageIds: string[];
      },
      eventType: "read" | "opened" = "read"
    ) => {
      try {
        console.debug(
          "[ConversationsRQ] MESSAGE_READ/OPENED incoming payload",
          { eventType, payload }
        );
      } catch {}

      // Only process read/opened events for the current user when userId is provided
      const incomingUserId = (payload as any)?.userId;
      const me = currentUser?.id;
      if (incomingUserId && me && incomingUserId !== me) {
        try {
          console.debug(
            "[ConversationsRQ] Skipping read/opened: event userId does not match current user",
            {
              incomingUserId,
              me,
              conversationId: (payload as any)?.conversationId,
            }
          );
        } catch {}
        return; // Do not decrement our unread due to other user's read/opened
      }
      updateConversationsCache((prev) => {
        if (!prev)
          return {
            pages: [{ conversations: [], nextCursor: null }],
            pageParams: [null],
          };
        const pages = prev.pages.map((pg) => ({
          ...pg,
          conversations: [...pg.conversations],
        }));
        let found: FoundLoc | null = null;
        pages.forEach((pg, pIdx) => {
          const idx = pg.conversations.findIndex(
            (c) => c.id === payload.conversationId
          );
          if (idx !== -1) found = { pageIdx: pIdx, idx };
        });
        if (!found) {
          try {
            console.debug(
              "[ConversationsRQ] Read/opened for unknown conversation, skipping",
              payload
            );
          } catch {}
          return prev;
        }

        const { pageIdx, idx } = found as FoundLoc;
        const conv = {
          ...pages[pageIdx]!.conversations[idx],
        } as Conversation & { lastMessage?: any };

        // Only decrement unread_count for READ events; OPENED should not affect unread badges
        if (eventType === "read") {
          const currentUnread =
            typeof conv.unread_count === "number" ? conv.unread_count : 0;
          conv.unread_count = Math.max(
            0,
            currentUnread - (payload.messageIds?.length || 0)
          );
        }

        // Update lastMessage flags if the last message is in the payload
        if (
          conv.lastMessage &&
          payload.messageIds?.includes((conv.lastMessage as any)?.id)
        ) {
          conv.lastMessage = {
            ...conv.lastMessage,
            isRead:
              eventType === "read" ? true : (conv.lastMessage as any)?.isRead,
            is_read:
              eventType === "read" ? true : (conv.lastMessage as any)?.is_read,
          };
        }

        pages[pageIdx]!.conversations[idx] = conv;
        try {
          console.debug(
            "[ConversationsRQ] Updated conversation on read/opened",
            {
              eventType,
              conversationId: payload.conversationId,
              decBy: payload.messageIds.length,
              unread_count: conv.unread_count,
            }
          );
        } catch {}
        return { pages, pageParams: prev.pageParams };
      });
    };

    // Register socket listeners with stable wrapper functions to allow proper cleanup
    const onRead = (p: any) => updateOnReadOrOpened(p, "read");
    // onOpened removed - using 2-state system

    on(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, onRead);
    // MESSAGE_OPENED event removed - using 2-state system

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, onRead);
      // MESSAGE_OPENED cleanup removed - using 2-state system
    };
  }, [on, off, currentUser?.id, updateConversationsCache]);

  return {
    conversations,
    error,
    isLoading,
    mutateConversations: refetch, // keep shape compatibility
    optimisticAddConversation,
    reconcileConversationId,
    // Pagination controls (optional for callers)
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    isFetchingNextPage: !!isFetchingNextPage,
    // Additional React Query specific methods
    invalidateConversations: () =>
      queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
    refetchConversations: refetch,
  } as const;
}
