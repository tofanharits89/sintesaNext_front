"use client";

import useSWRInfinite from "swr/infinite";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const isFetchable = (() => {
    if (!conversationId) return false;
    const isTemp = conversationId.startsWith("temp-") || conversationId.startsWith("temp_conv-") || conversationId.startsWith("temp-conv-");
    const looksLikeUuid = /^[0-9a-fA-F-]{16,}$/.test(conversationId);
    return !isTemp && looksLikeUuid;
  })();

  // Local store for temp/invalid conversations (no fetch). Ensures optimistic + socket messages appear.
  const localStoreRef = useRef<FrontendMessage[]>([]);
  const [localTick, setLocalTick] = useState(0);
  const bump = () => setLocalTick((x) => x + 1);

  // Debug: log initialization
  useEffect(() => {
    console.log("[useMessages:init]", {
      conversationId,
      isFetchable,
      localStoreSize: localStoreRef.current.length,
    });
  }, [conversationId, isFetchable]);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!isFetchable) return null;
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
    if (!isFetchable) {
      // Return a copy to avoid external mutation; already in chronological order by insertion
      return [...localStoreRef.current];
    }
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
  }, [data, conversationId, isFetchable, localTick]);

  // If not fetchable (temp/invalid id), do not show loading spinner
  const isLoading = isFetchable ? (!data && !error) : false;

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

    const appendNewMessage = (m: SocketMessageData) => {
      if (m.conversationId !== conversationId) return;
      if (recentIds.has(m.id)) return; // drop duplicate

      // If not fetchable, append into local store and re-render
      if (!isFetchable) {
        console.log("[useMessages:socket->local]", {
          conversationId,
          echoConvId: m.conversationId,
          tempId: (m as any).tempId || (m as any).temp_id,
          id: m.id,
        });
        // Reconcile any temp by tempId
        const tempId = (m as any).tempId || (m as any).temp_id || null;
        if (tempId) {
          localStoreRef.current = localStoreRef.current.filter((msg) => msg.id !== tempId);
        }
        const createdAt = m.timestamp || new Date().toISOString();
        localStoreRef.current.push({
          id: m.id,
          conversationId: m.conversationId,
          content: m.content,
          timestamp: createdAt,
          sender: m.sender,
          senderType: m.senderType,
          isRead: false,
          isDelivered: false,
          isOpened: false,
        } as FrontendMessage);

        // If we got a real conversationId alongside a tempId for this temp chat, notify reconcilers
        if (tempId && m.conversationId && m.conversationId !== conversationId) {
          try {
            console.log("[useMessages:reconcile:dispatch]", {
              tempId: conversationId,
              realId: m.conversationId,
            });
            window.dispatchEvent(
              new CustomEvent("conversation:created", {
                detail: { tempId: conversationId, conversationId: m.conversationId },
              })
            );
          } catch {}
        }
        remember(m.id);
        bump();
        return;
      }

      mutate((prev) => {
        console.log("[useMessages:socket->swr]", {
          conversationId,
          id: m.id,
          echoConvId: m.conversationId,
        });
        // Initialize cache if empty so first realtime message appears
        if (!prev || !Array.isArray(prev) || prev.length === 0) {
          const newPage = {
            data: {
              messages: [] as any[],
              pagination: { page: 1, limit: PAGE_SIZE, total: 1, hasMore: false },
            },
          } as any;
          prev = [newPage];
        }

        const copy = prev.map((p: any) => ({ ...p }));
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
          remember(m.id);
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
        remember(m.id);
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

  // Global optimistic insert bridge (e.g., from NewMessageDialog)
  useEffect(() => {
    if (!conversationId) return;
    const handler = (e: Event) => {
      const { conversationId: cid, message } = (e as CustomEvent).detail || {};
      if (!cid || cid !== conversationId || !message) return;
      console.log("[useMessages:optimisticInsert:event]", { conversationId: cid, id: (message as any)?.id, isFetchable });
      const temp: FrontendMessage = message as FrontendMessage;
      if (!isFetchable) {
        localStoreRef.current.push({ ...temp });
        bump();
      } else {
        // Insert into SWR cache
        mutate((prev) => {
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
          const list = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];
          list.push(newMsg);
          last.data = { ...(last.data || {}), messages: list };
          copy[lastIdx] = last;
          return copy;
        }, false);
      }
    };
    window.addEventListener("messages:optimistic-insert", handler as EventListener);
    return () => window.removeEventListener("messages:optimistic-insert", handler as EventListener);
  }, [conversationId, isFetchable, mutate]);

  // Optimistic insert helper for sending
  const optimisticInsert = (temp: FrontendMessage) => {
    if (!isFetchable) {
      // Insert into local store and trigger re-render
      console.log("[useMessages:optimisticInsert:local]", { conversationId: temp.conversationId, id: temp.id });
      localStoreRef.current.push({ ...temp });
      bump();
      return Promise.resolve();
    }
    console.log("[useMessages:optimisticInsert:swr]", { conversationId: temp.conversationId, id: temp.id });
    return mutate((prev) => {
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
  };

  return {
    messages,
    isLoading: conversationId ? isLoading : false,
    isValidating,
    size,
    setSize,
    optimisticInsert,
    mutateMessages: mutate,
  } as const;
}
