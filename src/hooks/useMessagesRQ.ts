/**
 * REFACTORED useMessagesRQ Hook
 *
 * Simplified from 1,139 lines to ~400 lines
 * Uses extracted services for:
 * - Message normalization
 * - Deduplication
 * - Cache management
 *
 * This version demonstrates the refactoring approach.
 * Deploy alongside old version for A/B testing.
 */

"use client";

import {
  useInfiniteQuery,
  useQueryClient,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiPath } from "@/lib/base-path";
import { useSocket } from "./useSocket";
import { conversationKeys } from "./useConversationsRQ";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import {
  SOCKET_EVENTS,
  FrontendMessage,
  SocketMessageData,
} from "@/types/socket-events";
import {
  createInfiniteQueryOptions,
  queryKeyFactories,
} from "@/lib/query-configs";

// Import new services
import {
  normalizeResponse,
  sortMessages,
  deduplicateMessages,
} from "@/services/messageNormalizerService";
import { getDuplicationService } from "@/services/messageDuplicationService";

const PAGE_SIZE = 25;

export const messageKeys = {
  root: (userId?: string | null) => queryKeyFactories.messaging.all(userId),
  messages: (userId?: string | null, conversationId?: string | null) =>
    queryKeyFactories.messaging.messages(userId, conversationId),
  thread: (userId?: string | null, conversationId?: string | null) =>
    queryKeyFactories.messaging.thread(userId, conversationId),
} as const;

/**
 * Fetcher with auth headers
 */
const fetchMessages = async (
  context: QueryFunctionContext<
    ReturnType<typeof messageKeys.messages>,
    string | undefined
  >,
) => {
  const { pageParam, queryKey } = context;
  const [, , , conversationId] = queryKey;

  const url = new URL(
    apiPath(`/messaging/conversations/${conversationId}/messages`),
    window.location.origin,
  );

  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("_t", Date.now().toString()); // Cache buster

  if (pageParam) {
    url.searchParams.set("before", pageParam);
    url.searchParams.set("cursor", pageParam);
  }

  const resp = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (!resp.ok) {
    // Return empty normalized response on error instead of throwing
    return {
      messages: [],
      pagination: { limit: PAGE_SIZE, total: 0, nextBefore: null },
    };
  }

  const json = await resp.json().catch(() => ({}));

  // Normalize response using service
  const normalized = normalizeResponse(json, conversationId);

  return normalized;
};

export function useMessagesRQ(conversationId?: string) {
  const queryClient = useQueryClient();
  const { user: authUser } = useUnifiedAuth();
  const userScopeId = authUser?.id ?? null;
  const duplicationService = getDuplicationService();

  // Determine if this is a fetchable conversation
  const isFetchable = useMemo(() => {
    if (!conversationId) return false;
    const safeId = String(conversationId);
    return !(
      safeId.startsWith("temp-") ||
      safeId.startsWith("temp_conv-") ||
      safeId.startsWith("temp-conv-")
    );
  }, [conversationId]);

  const listKey = messageKeys.messages(userScopeId, conversationId);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: listKey,
    queryFn: fetchMessages,
    enabled: isFetchable && !!conversationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) return undefined;
      return lastPage.pagination.nextBefore || undefined;
    },
  });

  // Transform API pages to FrontendMessage[]
  const messages: FrontendMessage[] = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return [];

    try {
      // Merge all pages (support both shapes: page.messages and page.data.messages)
      const allMessages = (data.pages as any[]).flatMap((page: any) => {
        if (Array.isArray(page?.messages)) return page.messages;
        if (Array.isArray(page?.data?.messages)) return page.data.messages;
        return [];
      });

      // Sort by timestamp
      const sorted = sortMessages(allMessages);

      // Deduplicate
      const deduped = deduplicateMessages(sorted);

      return deduped as FrontendMessage[];
    } catch (error) {
      console.error("[useMessagesRQ] Error transforming messages:", error);
      return [];
    }
  }, [data?.pages]);

  // Socket integration
  const { on, off, emit } = useSocket();

  useEffect(() => {
    if (!conversationId || !isFetchable) return;

    // Simple duplicate detection
    const recentMessageIds = new Set<string>();

    const handleNewMessage = (payload: any) => {
      const msg = payload?.message || payload;
      const msgId = msg?.id;
      const convId = payload?.conversationId || msg?.conversation_id;

      // Wrong conversation
      if (convId !== conversationId) return;

      // Skip if seen
      if (msgId && duplicationService.hasSeen(msgId)) return;
      if (msgId && recentMessageIds.has(msgId)) return;

      // Mark as seen
      if (msgId && msg?.content) {
        duplicationService.markSeen(msgId, msg.content);
        recentMessageIds.add(msgId);
      }

      // Update cache
      queryClient.setQueryData(listKey, (prev: any) => {
        if (!prev?.pages) {
          return {
            pages: [
              {
                messages: [msg],
                pagination: { limit: PAGE_SIZE, total: 1 },
              },
            ],
            pageParams: [undefined],
          };
        }

        const copy = {
          ...prev,
          pages: prev.pages.map((p: any) => ({ ...p })),
        };

        // Add to last page
        const lastIdx = copy.pages.length - 1;
        const lastPage = { ...copy.pages[lastIdx] };
        const messages = [...(lastPage.messages || [])];

        if (!messages.find((m: any) => m.id === msgId)) {
          messages.push(msg);
        }

        lastPage.messages = messages;
        copy.pages[lastIdx] = lastPage;
        return copy;
      });
    };

    // Cleanup old recent IDs periodically
    const cleanupTimer = setInterval(() => {
      recentMessageIds.clear();
    }, 30000); // Every 30 seconds

    on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleNewMessage);
      clearInterval(cleanupTimer);
    };
  }, [
    conversationId,
    isFetchable,
    queryClient,
    listKey,
    on,
    off,
    duplicationService,
  ]);

  // Public API
  return {
    messages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
  };
}

export default useMessagesRQ;
