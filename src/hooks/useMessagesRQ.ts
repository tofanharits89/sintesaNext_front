"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useSocket } from "./useSocket";
import {
  SOCKET_EVENTS,
  FrontendMessage,
  SocketMessageData,
} from "@/shared/socket-events";
import {
  getTempMessages,
  pushTempMessage,
  removeTempMessageById,
} from "@/features/messaging/temp-messages-store";

const PAGE_SIZE = 50;

// Query keys for React Query
export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (conversationId: string) =>
    [...messageKeys.lists(), conversationId] as const,
};

// Fetcher with auth headers and safe JSON parsing
const fetchMessages = async (context: {
  pageParam: number;
  queryKey: readonly string[];
}) => {
  const { pageParam = 1, queryKey } = context;
  const [, , conversationId] = queryKey;
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = backendPath(
    `/messaging/conversations/${conversationId}/messages?page=${pageParam}&limit=${PAGE_SIZE}`
  );

  const resp = await fetch(url, { credentials: "include", headers });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  if (!text.trim()) throw new Error("Empty response");

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON");
  }
};

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  const isFetchable = (() => {
    if (!conversationId) return false;
    const isTemp =
      conversationId.startsWith("temp-") ||
      conversationId.startsWith("temp_conv-") ||
      conversationId.startsWith("temp-conv-");
    return !isTemp;
  })();

  // Shared store for temp/invalid conversations (no fetch). Ensures optimistic + socket messages appear across components.
  const [localTick, setLocalTick] = useState(0);
  const bump = () => setLocalTick((x) => x + 1);

  // Note: initialization effect removed to reduce console noise

  // Listen for updates from the shared temp messages store
  useEffect(() => {
    if (!conversationId || isFetchable) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conversationId?: string };
      if (detail?.conversationId === conversationId) {
        setLocalTick((x) => x + 1);
      }
    };
    window.addEventListener('tempMessages:updated', handler as EventListener);
    return () => window.removeEventListener('tempMessages:updated', handler as EventListener);
  }, [conversationId, isFetchable]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: messageKeys.list(conversationId || ""),
    queryFn: fetchMessages,
    enabled: isFetchable && !!conversationId,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Stop if the last page had fewer than PAGE_SIZE items (no more pages)
      if (
        Array.isArray(lastPage?.data?.messages) &&
        lastPage.data.messages.length < PAGE_SIZE
      ) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // rely on sockets for live updates
    refetchOnReconnect: true,
  });

  // Map API pages to FrontendMessage[]
  const messages: FrontendMessage[] = useMemo(() => {
    if (!isFetchable) {
      // Read from shared store; already in inserted order
      const arr = conversationId ? getTempMessages(conversationId) : [];
      return arr;
    }
    if (!data) return [];
    const pages = data.pages;

    // Normalize various timestamp formats to milliseconds since epoch
    const toMs = (t: any): number => {
      if (t == null) return 0;
      if (typeof t === "number") {
        // Heuristic: treat values < 1e12 as seconds
        return t < 1_000_000_000_000 ? t * 1000 : t;
      }
      if (typeof t === "string") {
        // Try ISO/RFC parsing first
        const parsed = Date.parse(t);
        if (Number.isFinite(parsed)) return parsed;
        // Fallback: numeric string
        const asNum = Number(t);
        if (Number.isFinite(asNum)) {
          return asNum < 1_000_000_000_000 ? asNum * 1000 : asNum;
        }
      }
      return 0;
    };

    const mappedWithSort = pages.flatMap((p) =>
      (p?.data?.messages ?? []).map((msg: any) => {
        const rawTs = msg.timestamp ?? msg.created_at;
        const ms = toMs(rawTs);
        return {
          id: msg.id,
          conversationId: msg.conversation_id || conversationId!,
          content: msg.content,
          // Store ISO for display while sorting by ms
          timestamp: ms ? new Date(ms).toISOString() : rawTs || "",
          _sortTs: ms,
          sender: msg.sender,
          senderType: msg.senderType || msg.sender_type,
          isRead: msg.isRead ?? msg.is_read ?? false,
          readAt: msg.readAt ?? null,
          isOpened: msg.isOpened ?? false,
          openedAt: msg.openedAt ?? null,
          isDelivered: msg.isDelivered ?? false,
          deliveredAt: msg.deliveredAt ?? null,
        } as FrontendMessage & { _sortTs: number };
      })
    );

    const sorted = mappedWithSort.sort((a, b) => a._sortTs - b._sortTs);
    // De-duplicate by id while preserving chronological order; keep the last occurrence
    const seen = new Set<string>();
    const dedupedReversed = [] as typeof sorted;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const item = sorted[i];
      if (!item?.id) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      dedupedReversed.push(item);
    }
    const deduped = dedupedReversed.reverse();
    // Drop helper field
    return deduped.map(({ _sortTs, ...rest }) => rest as FrontendMessage);
  }, [data, conversationId, isFetchable, localTick]);

  // Note: removed verbose messages-updated logging

  // Helper to update messages cache (memoized to keep effect deps stable)
  const updateMessagesCache = useCallback(
    (updater: (prev: any) => any) => {
      if (!conversationId) return;
      queryClient.setQueryData(messageKeys.list(conversationId), updater);
    },
    [conversationId, queryClient]
  );

  // Socket -> cache updates
  const { on, off } = useSocket();
  useEffect(() => {
    if (!conversationId) return;

    // Simple de-dupe for rapid duplicate socket events (e.g., NEW + RECEIVED)
    const recentIds = new Set<string>();
    let recentTimer: any = null;

    const remember = (id?: string | null) => {
      if (!id) return;
      recentIds.add(id);
      // Clear after short window
      if (recentTimer) clearTimeout(recentTimer);
      recentTimer = setTimeout(() => recentIds.clear(), 5000);
    };

    const isTempConvId = (id?: string) =>
      !!id &&
      (id.startsWith("temp-") ||
        id.startsWith("temp_conv-") ||
        id.startsWith("temp-conv-"));

    // Only accept events for this conversation. For temp conversations, also match by tempId echoed from backend.
    const convMatches = (incomingConvId?: string, incomingTempId?: string) => {
      if (incomingConvId === conversationId) return true;
      // When viewing a temp conversation (not fetchable yet), accept events only if the event carries our temp id
      if (
        !isFetchable &&
        isTempConvId(conversationId) &&
        incomingTempId === conversationId
      )
        return true;
      return false;
    };

    const appendNewMessage = (m: SocketMessageData | any) => {
      // Normalize possible shapes: { id, content, ... } OR { message: {...}, conversationId }
      const normalized = (() => {
        if (m && typeof m === "object" && m.message) {
          const msg = m.message;
          const ts =
            msg.timestamp || msg.created_at || new Date().toISOString();
          return {
            id: msg.id,
            content: msg.content,
            timestamp: ts,
            sender: msg.sender || m.sender,
            senderType: msg.senderType || m.senderType,
            conversationId: m.conversationId || msg.conversation_id,
            tempId: m.tempId || msg.tempId || msg.temp_id,
          } as SocketMessageData & { tempId?: string };
        }
        const ts =
          (m as any)?.timestamp ||
          (m as any)?.created_at ||
          new Date().toISOString();
        return { ...(m as any), timestamp: ts } as SocketMessageData & {
          tempId?: string;
        };
      })();

      if (!convMatches(normalized.conversationId, (normalized as any).tempId))
        return;
      if (recentIds.has(normalized.id)) return; // drop duplicate

      // If not fetchable, append into local store and re-render
      if (!isFetchable) {
        // Reconcile any temp by tempId
        const tempId = (normalized as any).tempId || null;
        if (tempId) {
          removeTempMessageById(conversationId, tempId);
        }
        const createdAt = normalized.timestamp || new Date().toISOString();
        pushTempMessage(conversationId, {
          id: normalized.id,
          conversationId: normalized.conversationId,
          content: normalized.content,
          timestamp: createdAt,
          sender: normalized.sender,
          senderType: normalized.senderType,
          isRead: false,
          isDelivered: false,
          isOpened: false,
        } as FrontendMessage);

        // If we got a real conversationId (with or without tempId) while viewing a temp chat, notify reconcilers
        if (
          normalized.conversationId &&
          normalized.conversationId !== conversationId
        ) {
          try {
            window.dispatchEvent(
              new CustomEvent("conversation:created", {
                detail: {
                  tempId: conversationId,
                  conversationId: normalized.conversationId,
                },
              })
            );
          } catch {}
        }
        remember(normalized.id);
        bump();
        return;
      }

      updateMessagesCache((prev: any) => {
        // Initialize cache if empty so first realtime message appears
        if (!prev || !prev.pages || prev.pages.length === 0) {
          // Seed with the incoming message so UI renders immediately
          const seededMsg = {
            id: normalized.id,
            conversation_id: normalized.conversationId,
            content: normalized.content,
            timestamp: normalized.timestamp,
            created_at: normalized.timestamp,
            sender: normalized.sender,
            senderType: normalized.senderType,
            is_read: false,
          };
          return {
            pages: [
              {
                data: {
                  messages: [seededMsg],
                  pagination: {
                    page: 1,
                    limit: PAGE_SIZE,
                    total: 1,
                    hasMore: false,
                  },
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
        const list = Array.isArray(last?.data?.messages)
          ? [...last.data.messages]
          : [];

        // Handle tempId reconciliation and message insertion logic here
        // (Similar to the original SWR implementation)
        const tempId = (normalized as any).tempId || null;
        let filtered = list;

        if (tempId) {
          filtered = filtered.filter((msg: any) => msg.id !== tempId);
        }

        const newMsg = {
          id: normalized.id,
          conversation_id: normalized.conversationId,
          content: normalized.content,
          timestamp: normalized.timestamp,
          created_at: normalized.timestamp,
          sender: normalized.sender,
          senderType: normalized.senderType,
          is_read: false,
        };

        // Skip if this exact message id already exists (guards against duplicate socket events)
        if (!filtered.some((msg: any) => msg?.id === newMsg.id)) {
          filtered.push(newMsg);
        }
        last.data = { ...(last.data || {}), messages: filtered };
        copy.pages[lastIdx] = last;
        return copy;
      });
    };

    on(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
      if (recentTimer) clearTimeout(recentTimer);
    };
  }, [conversationId, isFetchable, on, off, updateMessagesCache]);

  // Optimistic insert helper for sending
  const optimisticInsert = (temp: FrontendMessage) => {
    if (!isFetchable) {
      // Insert into shared store and trigger re-render
      const targetConvId = temp.conversationId || conversationId;
      if (targetConvId) {
        pushTempMessage(targetConvId, { ...temp });
      } else {
        // Missing conversationId; skip insert
      }
      bump();
      return Promise.resolve();
    }

    // Insert into React Query cache
    updateMessagesCache((prev: any) => {
      const newMsg = {
        id: temp.id,
        conversation_id: temp.conversationId,
        content: temp.content,
        timestamp: temp.timestamp,
        created_at: temp.timestamp,
        sender: temp.sender,
        senderType: temp.senderType,
        is_read: false,
      };

      if (!prev || !prev.pages || prev.pages.length === 0) {
        return {
          pages: [
            {
              data: {
                messages: [newMsg],
                pagination: {
                  page: 1,
                  limit: PAGE_SIZE,
                  total: 1,
                  hasMore: false,
                },
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
      const list = Array.isArray(last?.data?.messages)
        ? [...last.data.messages]
        : [];
      list.push(newMsg);
      last.data = { ...(last.data || {}), messages: list };
      copy.pages[lastIdx] = last;
      return copy;
    });

    return Promise.resolve();
  };

  return {
    messages,
    isLoading: conversationId ? isLoading : false,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    optimisticInsert,
    // React Query specific methods
    invalidateMessages: () =>
      queryClient.invalidateQueries({
        queryKey: messageKeys.list(conversationId || ""),
      }),
    refetchMessages: () =>
      queryClient.refetchQueries({
        queryKey: messageKeys.list(conversationId || ""),
      }),
  } as const;
}
