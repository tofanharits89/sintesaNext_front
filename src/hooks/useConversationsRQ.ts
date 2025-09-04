"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from "react";
import { backendPath } from "@/lib/backend";
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
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// Fetcher that attaches auth and parses JSON safely
const fetchConversations = async (): Promise<{ data: { conversations: Conversation[] } }> => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(backendPath("/messaging/conversations"), { 
    credentials: "include", 
    headers 
  });
  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText}`);
  }
  if (!text.trim()) throw new Error("Empty response from server");

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON response from server");
  }
};

export function useConversations() {
  const queryClient = useQueryClient();
  
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: fetchConversations,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Ensure newest conversations appear first, even on initial fetch
  const rawConversations: Conversation[] = data?.data?.conversations ?? [];
  
  // Normalize conversations to ensure lastMessage.timestamp exists and updated_at is sane
  const normalizeConversation = (c: Conversation): Conversation => {
    const conv: any = { ...(c as any) };
    const lm: any = conv.lastMessage || undefined;
    if (lm) {
      const lmTs =
        lm.timestamp || lm.created_at || lm.createdAt || lm.sent_at || lm.sentAt;
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

  // Helper to update conversations cache
  const updateConversationsCache = useCallback((
    updater: (prev: { data: { conversations: Conversation[] } } | undefined) => { data: { conversations: Conversation[] } }
  ) => {
    queryClient.setQueryData(conversationKeys.lists(), updater);
  }, [queryClient]);

  // Helpers: optimistic add and reconcile for new conversations
  const optimisticAddConversation = useCallback((params: {
    tempId: string;
    otherParticipant: any;
    content: string;
    sender: any;
    senderType: "user" | "admin";
    timestamp: string;
  }) => {
    updateConversationsCache((prev) => {
      const list: Conversation[] = prev?.data?.conversations || [];
      if (list.some((c) => c.id === params.tempId)) return prev || { data: { conversations: [] } };
      
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
      
      const next = [conv, ...list];
      return {
        ...(prev || {}),
        data: { ...(prev?.data || {}), conversations: next },
      };
    });
  }, [updateConversationsCache]);

  const reconcileConversationId = useCallback((tempId: string, realId: string) => {
    updateConversationsCache((prev) => {
      const list: Conversation[] = prev?.data?.conversations || [];
      const idx = list.findIndex((c) => c.id === tempId);
      if (idx === -1) return prev || { data: { conversations: [] } };
      
      // If a conversation with realId already exists, remove temp; else rename
      const existingIdx = list.findIndex((c) => c.id === realId);
      let next = [...list];
      if (existingIdx !== -1) {
        next = next.filter((c) => c.id !== tempId);
      } else {
        next[idx] = { ...next[idx], id: realId } as any;
      }
      
      return {
        ...(prev || {}),
        data: { ...(prev?.data || {}), conversations: next },
      };
    });
  }, [updateConversationsCache]);

  // Bridge socket events -> in-place cache updates for snappy UI
  const { on, off } = useSocket();
  const { currentUser } = useCurrentUser();
  
  useEffect(() => {
    const updateOnNewMessage = (m: SocketMessageData) => {
      updateConversationsCache((prev) => {
        const list: Conversation[] = prev?.data?.conversations || [];
        // Normalize possibly nested payloads and timestamps
        const msgLike: any = (m as any)?.message ? (m as any).message : (m as any);
        const conversationId =
          (m as any)?.conversationId || msgLike.conversation_id || msgLike.conversationId;
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
        
        const idx = list.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev || { data: { conversations: [] } }; // Unknown conversation; skip
        
        const next = [...list];
        const [removed] = next.splice(idx, 1);
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
          senderType: msgLike.senderType ?? (conv.lastMessage as any)?.senderType,
          isRead: false,
          is_read: false,
        };
        conv.updated_at = effectiveTs || conv.updated_at;
        
        // Increase unread_count if the message is not from current user
        const fromSelf = currentUser?.id && msgLike?.sender?.id === currentUser.id;
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        conv.unread_count = fromSelf ? currentUnread : currentUnread + 1;
        
        // Move to top (most recent first)
        next.unshift(conv);
        
        return {
          ...(prev || {}),
          data: { ...(prev?.data || {}), conversations: next },
        };
      });
    };

    const updateOnReadOrOpened = (payload: {
      conversationId: string;
      messageIds: string[];
    }) => {
      updateConversationsCache((prev) => {
        const list: Conversation[] = prev?.data?.conversations || [];
        const idx = list.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) return prev || { data: { conversations: [] } };
        
        const next = [...list];
        const conv = { ...next[idx] } as Conversation & { lastMessage?: any };
        
        // Decrease unread_count (min 0)
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        const dec = Math.min(currentUnread, payload.messageIds.length);
        conv.unread_count = Math.max(0, currentUnread - dec);
        
        // If lastMessage included, set read flags if it's among ids
        if (
          conv.lastMessage &&
          payload.messageIds.includes(conv.lastMessage.id)
        ) {
          conv.lastMessage = {
            ...conv.lastMessage,
            isRead: true,
            is_read: true,
          };
        }
        
        next[idx] = conv;
        
        return {
          ...(prev || {}),
          data: { ...(prev?.data || {}), conversations: next },
        };
      });
    };

    on(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, updateOnReadOrOpened as any);
    on(SOCKET_EVENTS.MESSAGE_OPENED, updateOnReadOrOpened as any);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, updateOnNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, updateOnReadOrOpened as any);
      off(SOCKET_EVENTS.MESSAGE_OPENED, updateOnReadOrOpened as any);
    };
  }, [on, off, updateConversationsCache, currentUser?.id]);

  // Reconcile temp conversation ids when server confirms real id
  useEffect(() => {
    const handler = (payload: { tempId: string; conversationId: string }) => {
      reconcileConversationId(payload.tempId, payload.conversationId);
    };

    // Listen via socket (if backend emits it)
    on("conversation:created", handler as any);

    // Also listen to browser CustomEvent dispatched by temp-message flow
    const windowListener = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as { tempId: string; conversationId: string };
        if (detail && detail.tempId && detail.conversationId) handler(detail);
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("conversation:created", windowListener as EventListener);
    }

    return () => {
      off("conversation:created", handler as any);
      if (typeof window !== "undefined") {
        window.removeEventListener("conversation:created", windowListener as EventListener);
      }
    };
  }, [on, off, reconcileConversationId]);

  return {
    conversations,
    error,
    isLoading,
    mutateConversations: refetch, // React Query equivalent of SWR's mutate
    optimisticAddConversation,
    reconcileConversationId,
    // Additional React Query specific methods
    invalidateConversations: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
    refetchConversations: refetch,
  } as const;
}
