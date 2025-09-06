"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { apiPath } from "@/lib/base-path";
import { http } from "@/lib/httpClient"; // keep for other callers; not used in fetcher
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

  const resp = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
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
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: options?.enabled ?? true,
  });

  // Flatten pages and ensure newest conversations appear first
  const rawConversations: Conversation[] = (data?.pages || []).flatMap(
    (p) => p.conversations || []
  );

  // Normalize conversations to ensure lastMessage.timestamp exists and updated_at is sane
  const normalizeConversation = (c: Conversation): Conversation => {
    const conv: any = { ...(c as any) };
    const lm: any = conv.lastMessage || undefined;
    if (lm) {
      const lmTs =
        lm.timestamp ||
        lm.created_at ||
        lm.createdAt ||
        lm.sent_at ||
        lm.sentAt;
      if (!lm.timestamp && lmTs) conv.lastMessage = { ...lm, timestamp: lmTs };
    }
    const convTs =
      (conv.lastMessage &&
        ((conv.lastMessage as any).timestamp ||
          (conv.lastMessage as any).created_at ||
          (conv.lastMessage as any).createdAt)) ||
      conv.updated_at ||
      conv.updatedAt ||
      conv.created_at ||
      conv.createdAt;
    if (!conv.updated_at && convTs) conv.updated_at = convTs;
    return conv as Conversation;
  };

  const normalizedConversations: Conversation[] = rawConversations.map(
    normalizeConversation
  );

  const getLastActivity = (c: Conversation): number => {
    const ts =
      (c.lastMessage as any)?.timestamp ||
      (c.lastMessage as any)?.created_at ||
      (c.lastMessage as any)?.createdAt ||
      (c.lastMessage as any)?.message?.timestamp ||
      (c.lastMessage as any)?.message?.created_at ||
      (c.lastMessage as any)?.message?.createdAt ||
      (c as any)?.updated_at ||
      (c as any)?.updatedAt ||
      (c as any)?.created_at ||
      (c as any)?.createdAt;
    const t = ts ? new Date(ts).getTime() : 0;
    return isNaN(t) ? 0 : t;
  };

  const conversations = [...normalizedConversations].sort(
    (a, b) => getLastActivity(b) - getLastActivity(a)
  );

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
          pages[pageIdx].conversations = pages[pageIdx].conversations.filter(
            (c) => c.id !== tempId
          );
        } else {
          pages[pageIdx].conversations[idx] = {
            ...pages[pageIdx].conversations[idx],
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

        // Locate conversation across pages
        const pages = prev.pages.map((pg) => ({
          ...pg,
          conversations: [...pg.conversations],
        }));
        let found: FoundLoc | null = null;
        pages.forEach((pg, pIdx) => {
          const idx = pg.conversations.findIndex(
            (c) => c.id === conversationId
          );
          if (idx !== -1) found = { pageIdx: pIdx, idx };
        });
        if (!found) {
          // Unknown conversation: create a minimal entry so UI updates immediately
          const pages = prev.pages.map((pg) => ({
            ...pg,
            conversations: [...pg.conversations],
          }));
          const firstPage = pages[0] || { conversations: [], nextCursor: null };
          const effectiveTs =
            ts ||
            msgLike.timestamp ||
            msgLike.created_at ||
            msgLike.createdAt ||
            new Date().toISOString();

          const minimalConv: any = {
            id: conversationId,
            updated_at: effectiveTs,
            unread_count: 1,
            // Best-effort mapping: otherParticipant is the sender for recipient's view
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
          pages[0] = firstPage;

          try {
            console.debug(
              "[ConversationsRQ] Inserted minimal conversation for unknown conversation on new message",
              {
                conversationId,
                lastMessageId: msgLike.id,
              }
            );
          } catch {}

          return { pages, pageParams: prev.pageParams };
        }

        const { pageIdx, idx } = found as FoundLoc;
        const fromPage = pages[pageIdx];
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

        // Update lastMessage and updated_at
        conv.lastMessage = {
          ...(conv.lastMessage || {}),
          id: msgLike.id ?? (conv.lastMessage as any)?.id,
          content: msgLike.content ?? (conv.lastMessage as any)?.content ?? "",
          timestamp: effectiveTs,
          sender: msgLike.sender ?? (conv.lastMessage as any)?.sender,
          senderType:
            msgLike.senderType ?? (conv.lastMessage as any)?.senderType,
          isRead: false,
          is_read: false,
        };
        conv.updated_at = effectiveTs || conv.updated_at;

        // Increase unread_count if the message is not from current user
        const fromSelf =
          currentUser?.id && msgLike?.sender?.id === currentUser.id;
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        conv.unread_count = fromSelf ? currentUnread : currentUnread + 1;

        // Move to top of first page (most recent first)
        const firstPage = pages[0] || { conversations: [], nextCursor: null };
        firstPage.conversations.unshift(conv);
        pages[0] = firstPage;

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
          ...pages[pageIdx].conversations[idx],
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

        pages[pageIdx].conversations[idx] = conv;
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
    const onOpened = (p: any) => updateOnReadOrOpened(p, "opened");

    on(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, onRead);
    on(SOCKET_EVENTS.MESSAGE_OPENED, onOpened);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, onRead);
      off(SOCKET_EVENTS.MESSAGE_OPENED, onOpened);
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
