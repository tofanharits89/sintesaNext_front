"use client";

import useSWRMutation from "swr/mutation";
import { mutate as swrMutate } from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

type ReadArgs = { messageIds: string[] };

// Utility to update messages cache for a given conversation across all pages
function mutateMessagesForConversation(
  conversationId: string,
  updater: (page: any) => any
) {
  const base = backendPath(`/messaging/conversations/${conversationId}/messages`);
  swrMutate(
    (key) => typeof key === "string" && key.startsWith(base),
    (prev: any) => {
      // useSWRInfinite stores pages as an array; guard against other shapes
      if (!prev) return prev;
      if (!Array.isArray(prev)) return prev;
      return prev.map((page: any) => updater(page));
    },
    false
  );
}

// Utility to optimistically adjust conversations list unread_count and lastMessage flags
function mutateConversationsList(
  conversationId: string,
  update: (conv: any) => any
) {
  const listKey = backendPath("/messaging/conversations");
  swrMutate(
    listKey,
    (prev: any) => {
      const list = Array.isArray(prev?.data?.conversations)
        ? prev.data.conversations
        : [];
      const idx = list.findIndex((c: any) => c?.id === conversationId);
      if (idx === -1) return prev ?? { data: { conversations: [] } };
      const next = [...list];
      next[idx] = update({ ...(next[idx] || {}) });
      return {
        ...(prev || {}),
        data: { ...(prev?.data || {}), conversations: next },
      };
    },
    false
  );
}

export function useMarkAsReadMutation(conversationId?: string) {
  const key = conversationId
    ? backendPath(`/messaging/conversations/${conversationId}/read`)
    : null;

  const { trigger, isMutating, error } = useSWRMutation(
    key,
    async (url: string, { arg }: { arg: Readonly<ReadArgs> }) => {
      if (!conversationId) return;
      const { messageIds } = arg || { messageIds: [] };
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;

      // Optimistic: mark messages as read in SWR cache
      mutateMessagesForConversation(conversationId, (page) => {
        const msgs = (page?.data?.messages || []).map((msg: any) =>
          messageIds.includes(msg.id)
            ? { ...msg, is_read: true, isRead: true }
            : msg
        );
        return { ...page, data: { ...(page.data || {}), messages: msgs } };
      });

      // Optimistic: drop unread_count and lastMessage read flag
      mutateConversationsList(conversationId, (conv) => {
        const currentUnread = typeof conv.unread_count === "number" ? conv.unread_count : 0;
        const dec = Math.min(currentUnread, messageIds.length);
        if (conv.lastMessage && messageIds.includes(conv.lastMessage.id)) {
          conv.lastMessage = { ...conv.lastMessage, isRead: true, is_read: true };
        }
        return { ...conv, unread_count: Math.max(0, currentUnread - dec) };
      });

      // Notify UI listeners immediately
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-read", {
            detail: { conversationId, messageIds },
          })
        );
      } catch {}

      // Send mutation via REST for retry semantics
      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch(url, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ messageIds }),
      });
      // let SWR retry on non-2xx
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json().catch(() => ({}));
    }
  );

  return { trigger, isMutating, error } as const;
}

export function useMarkAsOpenedMutation(conversationId?: string) {
  const key = conversationId
    ? backendPath(`/messaging/conversations/${conversationId}/opened`)
    : null;

  const { trigger, isMutating, error } = useSWRMutation(
    key,
    async (url: string, { arg }: { arg: Readonly<ReadArgs> }) => {
      if (!conversationId) return;
      const { messageIds } = arg || { messageIds: [] };
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;

      // Optimistic: mark messages as opened in SWR cache
      mutateMessagesForConversation(conversationId, (page) => {
        const msgs = (page?.data?.messages || []).map((msg: any) =>
          messageIds.includes(msg.id)
            ? { ...msg, isOpened: true }
            : msg
        );
        return { ...page, data: { ...(page.data || {}), messages: msgs } };
      });

      // Optimistic: decrease unread_count if appropriate
      mutateConversationsList(conversationId, (conv) => {
        const currentUnread = typeof conv.unread_count === "number" ? conv.unread_count : 0;
        const dec = Math.min(currentUnread, messageIds.length);
        if (conv.lastMessage && messageIds.includes(conv.lastMessage.id)) {
          conv.lastMessage = { ...conv.lastMessage, isOpened: true };
        }
        return { ...conv, unread_count: Math.max(0, currentUnread - dec) };
      });

      // Notify UI listeners immediately
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-opened", {
            detail: { conversationId, messageIds },
          })
        );
      } catch {}

      // Send mutation via REST for retry semantics
      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch(url, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ messageIds }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json().catch(() => ({}));
    }
  );

  return { trigger, isMutating, error } as const;
}

