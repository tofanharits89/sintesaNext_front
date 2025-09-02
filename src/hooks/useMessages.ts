"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo } from "react";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useSocket } from "./useSocket";
import {
  SOCKET_EVENTS,
  FrontendMessage,
  SocketMessageData,
} from "@/shared/socket-events";

const PAGE_SIZE = 50;

// Fetcher with auth headers and safe JSON parsing
const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { credentials: "include", headers });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  if (!text.trim()) throw new Error("Empty response");
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("[useMessages] JSON parse error", e);
    console.error("[useMessages] Response text", text);
    throw new Error("Invalid JSON");
  }
};

export function useMessages(conversationId?: string) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!conversationId) return null;
    // Stop if the previous page had fewer than PAGE_SIZE items (no more pages)
    if (
      previousPageData &&
      Array.isArray(previousPageData?.data?.messages) &&
      previousPageData.data.messages.length < PAGE_SIZE
    ) {
      return null;
    }
    const page = pageIndex + 1;
    return backendPath(
      `/messaging/conversations/${conversationId}/messages?page=${page}&limit=${PAGE_SIZE}`
    );
  };

  const { data, error, size, setSize, mutate, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false, // rely on sockets for live updates
      revalidateOnReconnect: true,
    }
  );

  // Map API pages to FrontendMessage[]
  const messages: FrontendMessage[] = useMemo(() => {
    if (!data) return [];
    const pages = data as Array<any>;

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
          timestamp: ms ? new Date(ms).toISOString() : (rawTs || ""),
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
    // Drop helper field
    return sorted.map(({ _sortTs, ...rest }) => rest as FrontendMessage);
  }, [data, conversationId]);

  const isLoading = !data && !error;

  // Socket -> cache updates
  const { on, off } = useSocket();
  useEffect(() => {
    if (!conversationId) return;

    const appendNewMessage = (m: SocketMessageData) => {
      if (m.conversationId !== conversationId) return;
      mutate((prev) => {
        if (!prev || !Array.isArray(prev)) return prev;
        const copy = prev.map((p: any) => ({ ...p }));
        if (copy.length === 0) return prev;
        const lastIdx = copy.length - 1;
        const last = { ...copy[lastIdx] };
        const list = Array.isArray(last?.data?.messages)
          ? [...last.data.messages]
          : [];

        // Tiny helper: reconcile by tempId if backend echoes it; fallback to proximity
        const tempId = (m as any).tempId || (m as any).temp_id || null;
        let filtered = list;
        let reconciledTimestampMs: number | null = null;

        if (tempId) {
          // Remove the optimistic placeholder with this tempId
          // Capture the optimistic timestamp to preserve ordering if server ts is older
          const tempMsg = filtered.find((msg: any) => msg.id === tempId);
          if (tempMsg) {
            const toMs = (t: any) => {
              if (t == null) return 0;
              if (typeof t === "number") return t < 1_000_000_000_000 ? t * 1000 : t;
              const parsed = Date.parse(t);
              if (Number.isFinite(parsed)) return parsed;
              const asNum = Number(t);
              return Number.isFinite(asNum)
                ? asNum < 1_000_000_000_000
                  ? asNum * 1000
                  : asNum
                : 0;
            };
            reconciledTimestampMs = Math.max(
              toMs(tempMsg.timestamp || tempMsg.created_at),
              toMs(m.timestamp)
            );
          }
          filtered = filtered.filter((msg: any) => msg.id !== tempId);
          // reconciled by tempId
        } else {
          // Fallback: remove any temp placeholders that match content and are very recent
          const realTs = new Date(m.timestamp).getTime();
          const THRESHOLD_MS = 5000;
          filtered = filtered.filter((msg: any) => {
            if (typeof msg?.id === "string" && msg.id.startsWith("temp-")) {
              const sameContent = msg.content === m.content;
              const ts = new Date(
                msg.timestamp || msg.created_at || 0
              ).getTime();
              const close = Math.abs(realTs - ts) <= THRESHOLD_MS;
              return !(sameContent && close);
            }
            return true;
          });
          // reconciled by fallback
        }

        // Avoid duplicate by real id if already present
        if (filtered.some((x: any) => x.id === m.id)) {
          last.data = { ...(last.data || {}), messages: filtered };
          copy[lastIdx] = last;
          return copy;
        }

        // Push message in backend-ish shape; mapper will handle fields
        filtered.push({
          id: m.id,
          conversation_id: m.conversationId,
          content: m.content,
          created_at: reconciledTimestampMs
            ? new Date(reconciledTimestampMs).toISOString()
            : m.timestamp,
          timestamp: reconciledTimestampMs
            ? new Date(reconciledTimestampMs).toISOString()
            : m.timestamp,
          sender: m.sender,
          senderType: m.senderType,
          is_read: false,
        });
        last.data = { ...(last.data || {}), messages: filtered };
        copy[lastIdx] = last;
        return copy;
      }, false);

      // Notify UI to auto-scroll for visibility even if total count is unchanged
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("messages:appended", {
            detail: { conversationId },
          })
        );
      }
    };

    const markMessagesRead = (payload: {
      conversationId: string;
      messageIds: string[];
      readAt?: string;
    }) => {
      if (payload.conversationId !== conversationId) return;
      mutate((prev) => {
        if (!prev) return prev;
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            payload.messageIds.includes(msg.id)
              ? {
                  ...msg,
                  is_read: true,
                  isRead: true,
                  readAt: payload.readAt || msg.readAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);
    };

    const markMessagesOpened = (payload: {
      conversationId: string;
      messageIds: string[];
      openedAt?: string;
    }) => {
      if (payload.conversationId !== conversationId) return;
      mutate((prev) => {
        if (!prev) return prev;
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            payload.messageIds.includes(msg.id)
              ? {
                  ...msg,
                  isOpened: true,
                  openedAt: payload.openedAt || msg.openedAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);
    };

    const markMessagesDelivered = (payload: {
      conversationId: string;
      messages: Array<{ id: string; deliveredAt?: string }>;
    }) => {
      if (payload.conversationId !== conversationId) return;
      const ids = new Set(payload.messages.map((m) => m.id));
      mutate((prev) => {
        if (!prev) return prev;
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            ids.has(msg.id)
              ? {
                  ...msg,
                  isDelivered: true,
                  deliveredAt:
                    payload.messages.find((x) => x.id === msg.id)
                      ?.deliveredAt || msg.deliveredAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);
    };

    on(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, markMessagesRead as any);
    on(SOCKET_EVENTS.MESSAGE_OPENED, markMessagesOpened as any);
    on(SOCKET_EVENTS.MESSAGE_DELIVERED, markMessagesDelivered as any);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, markMessagesRead as any);
      off(SOCKET_EVENTS.MESSAGE_OPENED, markMessagesOpened as any);
      off(SOCKET_EVENTS.MESSAGE_DELIVERED, markMessagesDelivered as any);
    };
  }, [conversationId, on, off, mutate]);

  // Optimistic insert helper for sending
  const optimisticInsert = (temp: FrontendMessage) =>
    mutate((prev) => {
      // If no cache yet, create the first page with this optimistic message
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

      if (!prev || !Array.isArray(prev) || prev.length === 0) {
        return [
          {
            data: {
              messages: [newMsg],
              pagination: { page: 1, limit: PAGE_SIZE, total: 1, hasMore: false },
            },
          },
        ];
      }

      const copy = prev.map((p: any) => ({ ...p }));
      const lastIdx = copy.length - 1;
      const last = { ...copy[lastIdx] };
      const list = Array.isArray(last?.data?.messages)
        ? [...last.data.messages]
        : [];
      list.push(newMsg);
      last.data = { ...(last.data || {}), messages: list };
      copy[lastIdx] = last;
      return copy;
    }, false);

  return {
    messages,
    isLoading,
    isValidating,
    size,
    setSize,
    optimisticInsert,
    mutateMessages: mutate,
  } as const;
}
