"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { backendPath } from "@/lib/backend";
import { useSocket } from "./useSocket";
import { conversationKeys } from "./useConversationsRQ";
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
import { createInfiniteQueryOptions, queryKeyFactories } from "@/lib/query-configs";

// Persist last-known truthy status flags across refetches to prevent visual regressions
const lastKnownFlags: Map<
  string,
  Partial<{ isDelivered: boolean; isRead: boolean }>
> = new Map();

const PAGE_SIZE = 25;

// Use centralized query keys
export const messageKeys = queryKeyFactories.messaging;

// Fetcher with auth headers and safe JSON parsing (cursor-based)
const fetchMessages = async (context: {
  pageParam: string | undefined;
  queryKey: readonly string[];
}) => {
  const { pageParam, queryKey } = context;
  const [, , conversationId] = queryKey as [string, string, string];

  const url = new URL(
    backendPath(`/messaging/conversations/${conversationId}/messages`),
    window.location.origin
  );
  // Be liberal in what we send: support multiple backend param names after TS migration
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  if (pageParam) {
    url.searchParams.set("before", pageParam);
    url.searchParams.set("cursor", pageParam);
    url.searchParams.set("next_before", pageParam);
  }

  try {
    // Fetching messages from API
  } catch {}

  const resp = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json().catch(() => ({}));
  try {
    // Best-effort length check using common shapes
    const cands = [
      json?.data?.messages,
      json?.messages,
      json?.data?.data?.messages,
      json?.result?.messages,
      json?.data?.result?.messages,
    ];
    const arr = cands.find((a: any) => Array.isArray(a)) as any[] | undefined;
    // Processing messages response
  } catch {}
  return json;
};

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  const isFetchable = (() => {
    if (!conversationId) return false;
    const safeConversationId = String(conversationId);
    const isTemp =
      safeConversationId.startsWith("temp-") ||
      safeConversationId.startsWith("temp_conv-") ||
      safeConversationId.startsWith("temp-conv-");
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
    window.addEventListener("tempMessages:updated", handler as EventListener);
    return () =>
      window.removeEventListener(
        "tempMessages:updated",
        handler as EventListener
      );
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
    queryKey: messageKeys.messages(conversationId || ""),
    queryFn: fetchMessages,
    enabled: isFetchable && !!conversationId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Support multiple possible locations for pagination cursor
      const pg =
        lastPage?.data?.pagination ||
        lastPage?.pagination ||
        lastPage?.data?.data?.pagination ||
        lastPage?.result?.pagination ||
        null;
      const nextBefore =
        pg?.nextBefore || pg?.next_before || pg?.next || undefined;
      return nextBefore || undefined;
    },
    ...createInfiniteQueryOptions('realtime', {
      refetchOnWindowFocus: false, // rely on sockets for live updates
      gcTime: 30 * 60 * 1000, // 30 minutes (avoid dropping cache during short idles)
    }),
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

    // Helper to find messages array in various shapes (tolerant to backend changes)
    const extractMessages = (p: any): any[] => {
      if (!p) return [];

      // 1) Known candidates from legacy and migrated APIs
      const cands = [
        p?.data?.messages,
        p?.messages,
        p?.data?.data?.messages,
        p?.result?.messages,
        p?.data?.result?.messages,
        // Common TS migration variants
        p?.data?.items,
        p?.items,
        p?.result?.items,
        p?.data?.result?.items,
        p?.data?.records,
        p?.records,
        p?.rows,
        p?.data?.rows,
        p?.data?.data, // sometimes the array itself is here
      ];
      for (const arr of cands) {
        if (Array.isArray(arr)) return arr;
      }

      // 2) Recursive fallback: search for the first array of objects that looks like messages
      const looksLikeMessageArray = (arr: any[]): boolean => {
        if (!Array.isArray(arr) || arr.length === 0) return false;
        const first = arr[0];
        if (typeof first !== "object") return false;
        // Accept if has an id and one of typical fields
        return (
          ("id" in first || "messageId" in first) &&
          ("content" in first ||
            "text" in first ||
            "message" in first ||
            "created_at" in first ||
            "timestamp" in first ||
            "conversation_id" in first)
        );
      };

      const visited = new Set<any>();
      const dfs = (obj: any, depth: number): any[] => {
        if (!obj || typeof obj !== "object" || visited.has(obj) || depth > 3)
          return [];
        visited.add(obj);
        // If this object itself is an array, test it
        if (Array.isArray(obj)) {
          return looksLikeMessageArray(obj) ? obj : [];
        }
        // Otherwise, scan its values
        for (const key of Object.keys(obj)) {
          const val = (obj as any)[key];
          if (Array.isArray(val) && looksLikeMessageArray(val)) return val;
        }
        // Recurse into nested objects (limited depth)
        for (const key of Object.keys(obj)) {
          const val = (obj as any)[key];
          if (val && typeof val === "object") {
            const found = dfs(val, depth + 1);
            if (found.length) return found;
          }
        }
        return [];
      };

      return dfs(p, 0);
    };

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
      extractMessages(p).map((msg: any) => {
        const rawTs = msg.timestamp ?? msg.created_at;
        const ms = toMs(rawTs);
        const id = msg.id as string;
        const fromApi = {
          id: msg.id,
          conversationId: msg.conversation_id || conversationId!,
          content: msg.content,
          // Store ISO for display while sorting by ms
          timestamp: ms ? new Date(ms).toISOString() : rawTs || "",
          _sortTs: ms,
          sender: msg.sender,
          senderType: msg.senderType || msg.sender_type,
          isRead: msg.isRead ?? msg.is_read ?? false,
          readAt: msg.readAt ?? msg.read_at ?? null,
          isDelivered: msg.isDelivered ?? msg.is_delivered ?? false,
          deliveredAt: msg.deliveredAt ?? msg.delivered_at ?? null,
        } as FrontendMessage & { _sortTs: number };

        const known = lastKnownFlags.get(id);
        if (known) {
          // Once true, keep true (do not downgrade from true -> false on refetch)
          fromApi.isDelivered = fromApi.isDelivered || !!known.isDelivered;
          fromApi.isRead = fromApi.isRead || !!known.isRead;
        }
        return fromApi;
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
      queryClient.setQueryData(messageKeys.messages(conversationId), updater);
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
          // isOpened removed - using 2-state system
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

      // If cache is empty before appending, schedule a backfill fetch after seeding
      const prevCache = queryClient.getQueryData(
        messageKeys.messages(conversationId)
      );
      const wasEmpty =
        !prevCache ||
        !(prevCache as any).pages ||
        (prevCache as any).pages.length === 0;

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
          // Mark that we seeded so we can trigger a backfill fetch below (outside updater)
          (window as any).__messagesSeeded__ = true;
          return {
            pages: [
              {
                data: {
                  messages: [seededMsg],
                  pagination: {
                    page: 1,
                    limit: PAGE_SIZE,
                    total: 1,
                    hasMore: true, // unknown; allow backfill to load older
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
      // If we had to seed because cache was empty, backfill immediately to fetch full history
      if (wasEmpty) {
        try {
          setTimeout(() => {
            try {
              queryClient.refetchQueries({
                queryKey: messageKeys.messages(conversationId),
              });
            } catch {}
          }, 0);
        } catch {}
      }
    };

    on(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);

    // Normalize message IDs from various payload shapes (single, array, nested)
    const getMsgIds = (p: any): string[] => {
      if (!p) return [];
      if (Array.isArray(p.messageIds)) return p.messageIds.filter(Boolean);
      if (Array.isArray(p.messages))
        return p.messages.map((m: any) => m?.id).filter(Boolean);
      const single = p?.messageId || p?.id || p?.message?.id;
      return single ? [single] : [];
    };

    // Update flags in messages cache and lastMessage in conversations list
    const updateMessageFlags = (
      messageId: string | undefined,
      updates: Partial<{
        isDelivered: boolean;
        deliveredAt: string | null;
        isRead: boolean;
        readAt: string | null;
      }>
    ) => {
      if (!messageId) return;

      // Persist truthy flags to avoid downgrades on refetch
      const prev = lastKnownFlags.get(messageId) || {};
      lastKnownFlags.set(messageId, {
        isDelivered: prev.isDelivered || !!updates.isDelivered,
        isRead: prev.isRead || !!updates.isRead,
      });

      updateMessagesCache((prevCache: any) => {
        if (!prevCache?.pages) return prevCache;
        const copy = {
          ...prevCache,
          pages: prevCache.pages.map((p: any) => ({ ...p })),
        };
        copy.pages = copy.pages.map((pg: any) => {
          const msgs = Array.isArray(pg?.data?.messages)
            ? pg.data.messages.map((m: any) =>
                m?.id === messageId
                  ? {
                      ...m,
                      is_delivered:
                        updates.isDelivered ?? m.is_delivered ?? m.isDelivered,
                      isDelivered:
                        updates.isDelivered ?? m.isDelivered ?? m.is_delivered,
                      delivered_at:
                        updates.deliveredAt ?? m.delivered_at ?? m.deliveredAt,
                      deliveredAt:
                        updates.deliveredAt ?? m.deliveredAt ?? m.delivered_at,
                      // isOpened properties removed - using 2-state system
                      is_read: updates.isRead ?? m.is_read ?? m.isRead,
                      isRead: updates.isRead ?? m.isRead ?? m.is_read,
                      read_at: updates.readAt ?? m.read_at ?? m.readAt,
                      readAt: updates.readAt ?? m.readAt ?? m.read_at,
                    }
                  : m
              )
            : pg?.data?.messages;
          return { ...pg, data: { ...(pg.data || {}), messages: msgs } };
        });
        return copy;
      });

      // Update lastMessage flags in conversations list cache
      queryClient.setQueryData(conversationKeys.lists(), (prevList: any) => {
        if (!prevList) return prevList;
        const curr = prevList?.pages
          ? prevList
          : { pages: [prevList], pageParams: [null] };
        const pages = curr.pages.map((pg: any) => ({
          ...pg,
          conversations: Array.isArray(pg?.conversations)
            ? pg.conversations.map((c: any) =>
                c?.lastMessage?.id === messageId
                  ? {
                      ...c,
                      lastMessage: {
                        ...c.lastMessage,
                        isDelivered:
                          updates.isDelivered ?? c.lastMessage.isDelivered,
                        deliveredAt:
                          updates.deliveredAt ?? c.lastMessage.deliveredAt,
                        // isOpened properties removed - using 2-state system
                        isRead: updates.isRead ?? c.lastMessage.isRead,
                        is_read: updates.isRead ?? c.lastMessage.is_read,
                        readAt: updates.readAt ?? c.lastMessage.readAt,
                      },
                    }
                  : c
              )
            : pg?.conversations,
        }));
        return { ...curr, pages };
      });
    };

    const onDelivered = (payload: any) => {
      const convId = payload?.conversationId || payload?.conversation_id;
      if (!convMatches(convId, (payload as any)?.tempId)) return;
      const ids = getMsgIds(payload);
      const atGlobal =
        payload?.deliveredAt ||
        payload?.delivered_at ||
        payload?.timestamp ||
        null;
      if (ids.length === 0 && Array.isArray(payload?.messages)) {
        for (const m of payload.messages) {
          const id = m?.id;
          const at =
            m?.deliveredAt ||
            m?.delivered_at ||
            atGlobal ||
            new Date().toISOString();
          updateMessageFlags(id, { isDelivered: true, deliveredAt: at });
        }
        return;
      }
      for (const id of ids) {
        const at = atGlobal || new Date().toISOString();
        updateMessageFlags(id, { isDelivered: true, deliveredAt: at });
      }
    };

    // onOpened removed - using 2-state system (delivered -> read)

    const onRead = (payload: any) => {
      const convId = payload?.conversationId || payload?.conversation_id;
      if (!convMatches(convId, (payload as any)?.tempId)) return;
      const ids = getMsgIds(payload);
      const atGlobal =
        payload?.readAt || payload?.read_at || payload?.timestamp || null;
      for (const id of ids) {
        const at = atGlobal || new Date().toISOString();
        updateMessageFlags(id, { isRead: true, readAt: at });
      }
    };

    on(SOCKET_EVENTS.MESSAGE_DELIVERED, onDelivered);
    // MESSAGE_OPENED event removed - using 2-state system
    on(SOCKET_EVENTS.MESSAGE_READ, onRead);

    // Also listen for reconciliation events emitted by mutation/socket paths
    const onConvCreated = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as {
          tempId: string;
          conversationId: string;
        };
        if (!detail?.conversationId || !detail?.tempId) return;
        // Only act if this hook instance is for the REAL conversation id
        if (detail.conversationId !== conversationId) return;

        // Seed the real conversation cache with any temp messages, if the cache is empty
        const migrated = getTempMessages(String(detail.tempId));
        if (!Array.isArray(migrated) || migrated.length === 0) return;

        queryClient.setQueryData(
          messageKeys.messages(conversationId),
          (prev: any) => {
            const nowIso = new Date().toISOString();
            const toCache = migrated.map((m: any) => ({
              id: m.id,
              conversation_id: conversationId,
              content: m.content,
              timestamp: m.timestamp || nowIso,
              created_at: m.timestamp || nowIso,
              sender: m.sender,
              senderType: m.senderType || "user",
              is_read: true,
            }));
            if (!prev || !prev.pages || prev.pages.length === 0) {
              return {
                pages: [
                  {
                    data: {
                      messages: toCache,
                      pagination: {
                        page: 1,
                        limit: PAGE_SIZE,
                        total: toCache.length,
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
            for (const msg of toCache) {
              if (!list.some((m: any) => m?.id === msg.id)) list.push(msg);
            }
            last.data = { ...(last.data || {}), messages: list };
            copy.pages[lastIdx] = last;
            return copy;
          }
        );
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener(
        "conversation:created",
        onConvCreated as EventListener
      );
    }

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_DELIVERED, onDelivered);
      // MESSAGE_OPENED event removed - using 2-state system
      off(SOCKET_EVENTS.MESSAGE_READ, onRead);
      if (recentTimer) clearTimeout(recentTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "conversation:created",
          onConvCreated as EventListener
        );
      }
    };
  }, [conversationId, isFetchable, on, off, updateMessagesCache, queryClient]);

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
        queryKey: messageKeys.messages(conversationId || ""),
      }),
    refetchMessages: () =>
      queryClient.refetchQueries({
        queryKey: messageKeys.messages(conversationId || ""),
      }),
  } as const;
}
