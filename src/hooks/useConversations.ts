"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useSocket } from "./useSocket";
import {
  SOCKET_EVENTS,
  Conversation,
  SocketMessageData,
} from "@/shared/socket-events";
import { useCurrentUser } from "@/lib/use-current-user";

// Fetcher that attaches auth and parses JSON safely
const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { credentials: "include", headers });
  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText}`);
  }
  if (!text.trim()) throw new Error("Empty response from server");

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("[useConversations] JSON parse error:", e);
    console.error("[useConversations] Response text:", text);
    throw new Error("Invalid JSON response from server");
  }
};

export function useConversations() {
  const key = backendPath("/messaging/conversations");
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
  });

  const conversations: Conversation[] = data?.data?.conversations ?? [];
  // Helpers: optimistic add and reconcile for new conversations
  const optimisticAddConversation = (params: {
    tempId: string;
    otherParticipant: any;
    content: string;
    sender: any;
    senderType: "user" | "admin";
    timestamp: string;
  }) => {
    mutate((prev: any) => {
      const list: Conversation[] = prev?.data?.conversations || [];
      if (list.some((c) => c.id === params.tempId)) return prev;
      const conv: any = {
        id: params.tempId,
        otherParticipant: params.otherParticipant,
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
    }, false);
  };

  const reconcileConversationId = (tempId: string, realId: string) => {
    mutate((prev: any) => {
      const list: Conversation[] = prev?.data?.conversations || [];
      const idx = list.findIndex((c) => c.id === tempId);
      if (idx === -1) return prev;
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
    }, false);
  };

  // Bridge socket events -> in-place cache updates for snappy UI
  const { on, off } = useSocket();
  const { currentUser } = useCurrentUser();
  useEffect(() => {
    const updateOnNewMessage = (m: SocketMessageData) => {
      mutate((prev) => {
        const list: Conversation[] = prev?.data?.conversations || [];
        const idx = list.findIndex((c) => c.id === m.conversationId);
        if (idx === -1) return prev; // Unknown conversation; skip
        const next = [...list];
        const conv = { ...next[idx] } as Conversation & { lastMessage?: any };
        // Update lastMessage and updated_at
        conv.lastMessage = {
          ...(conv.lastMessage || {}),
          id: m.id,
          content: m.content,
          timestamp: m.timestamp,
          sender: m.sender,
          senderType: m.senderType,
          isRead: false,
          is_read: false,
        };
        conv.updated_at = m.timestamp;
        // Increase unread_count if the message is not from current user
        const fromSelf = currentUser?.id && m.sender?.id === currentUser.id;
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        conv.unread_count = fromSelf ? currentUnread : currentUnread + 1;
        next[idx] = conv;
        return {
          ...(prev || {}),
          data: { ...(prev?.data || {}), conversations: next },
        };
      }, false);
    };

    const updateOnReadOrOpened = (payload: {
      conversationId: string;
      messageIds: string[];
    }) => {
      mutate((prev) => {
        const list: Conversation[] = prev?.data?.conversations || [];
        const idx = list.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) return prev;
        const next = [...list];
        const conv = { ...next[idx] } as Conversation & { lastMessage?: any };
        // Decrease unread_count (min 0)
        const currentUnread =
          typeof conv.unread_count === "number" ? conv.unread_count : 0;
        const dec = Math.min(currentUnread, payload.messageIds.length);
        conv.unread_count = Math.max(0, currentUnread - dec);
        // If lastMessage included, set read flags if it’s among ids
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
      }, false);
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
  }, [on, off, mutate, currentUser?.id]);

  // Reconcile temp conversation ids when server confirms real id
  useEffect(() => {
    const handler = (payload: { tempId: string; conversationId: string }) => {
      reconcileConversationId(payload.tempId, payload.conversationId);
    };
    on("conversation:created", handler as any);
    return () => off("conversation:created", handler as any);
  }, [on, off, reconcileConversationId]);

  return {
    conversations,
    error,
    isLoading,
    mutateConversations: mutate,
    optimisticAddConversation,
    reconcileConversationId,
  } as const;
}
