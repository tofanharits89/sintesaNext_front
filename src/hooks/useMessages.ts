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
    const isTemp =
      conversationId.startsWith("temp-") ||
      conversationId.startsWith("temp_conv-") ||
      conversationId.startsWith("temp-conv-");
    // Previously we restricted to UUID-looking IDs; relax to any non-temp real ID
    return !isTemp;
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

    const isTempConvId = (id?: string) =>
      !!id && (id.startsWith("temp-") || id.startsWith("temp_conv-") || id.startsWith("temp-conv-"));

    // Only accept events for this conversation. For temp conversations, also match by tempId echoed from backend.
    const convMatches = (incomingConvId?: string, incomingTempId?: string) => {
      if (incomingConvId === conversationId) return true;
      // When viewing a temp conversation (not fetchable yet), accept events only if the event carries our temp id
      if (!isFetchable && isTempConvId(conversationId) && incomingTempId === conversationId) return true;
      return false;
    };

    const appendNewMessage = (m: SocketMessageData | any) => {
      // Normalize possible shapes: { id, content, ... } OR { message: {...}, conversationId }
      const normalized = (() => {
        if (m && typeof m === "object" && m.message) {
          const msg = m.message;
          const ts = msg.timestamp || msg.created_at || new Date().toISOString();
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
        const ts = (m as any)?.timestamp || (m as any)?.created_at || new Date().toISOString();
        return { ...(m as any), timestamp: ts } as SocketMessageData & { tempId?: string };
      })();

      if (!convMatches(normalized.conversationId, (normalized as any).tempId)) return;
      if (recentIds.has(normalized.id)) return; // drop duplicate

      // If not fetchable, append into local store and re-render
      if (!isFetchable) {
        console.log("[useMessages:socket->local]", {
          conversationId,
          echoConvId: normalized.conversationId,
          tempId: (normalized as any).tempId,
          id: normalized.id,
        });
        // Reconcile any temp by tempId
        const tempId = (normalized as any).tempId || null;
        if (tempId) {
          localStoreRef.current = localStoreRef.current.filter((msg) => msg.id !== tempId);
        }
        const createdAt = normalized.timestamp || new Date().toISOString();
        localStoreRef.current.push({
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
        if (normalized.conversationId && normalized.conversationId !== conversationId) {
          try {
            console.log("[useMessages:reconcile:dispatch]", {
              tempId: conversationId,
              realId: normalized.conversationId,
            });
            window.dispatchEvent(
              new CustomEvent("conversation:created", {
                detail: { tempId: conversationId, conversationId: normalized.conversationId },
              })
            );
          } catch {}
        }
        remember(normalized.id);
        bump();
        return;
      }

      mutate((prev) => {
        console.log("[useMessages:socket->swr]", {
          conversationId,
          id: normalized.id,
          echoConvId: normalized.conversationId,
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
        const tempId = (normalized as any).tempId || null;
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
              toMs(normalized.timestamp)
            );
          }
          filtered = filtered.filter((msg: any) => msg.id !== tempId);
          // reconciled by tempId
        } else {
          // Fallback: remove any temp placeholders that match content and are very recent
          const realTs = new Date(normalized.timestamp as any).getTime();
          const THRESHOLD_MS = 5000;
          filtered = filtered.filter((msg: any) => {
            if (typeof msg?.id === "string" && msg.id.startsWith("temp-")) {
              const sameContent = msg.content === normalized.content;
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
        if (filtered.some((x: any) => x.id === normalized.id)) {
          last.data = { ...(last.data || {}), messages: filtered };
          copy[lastIdx] = last;
          remember(normalized.id);
          return copy;
        }

        // Push message in backend-ish shape; mapper will handle fields
        filtered.push({
          id: normalized.id,
          conversation_id: normalized.conversationId,
          content: normalized.content,
          created_at: reconciledTimestampMs
            ? new Date(reconciledTimestampMs).toISOString()
            : normalized.timestamp,
          timestamp: reconciledTimestampMs
            ? new Date(reconciledTimestampMs).toISOString()
            : normalized.timestamp,
          sender: normalized.sender,
          senderType: normalized.senderType,
          is_read: false,
        });
        last.data = { ...(last.data || {}), messages: filtered };
        copy[lastIdx] = last;
        remember(normalized.id);
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
    } | { conversationId: string; messageId: string; readAt?: string } | any) => {
      // Normalize to { conversationId, messageIds[] }
      const p = (() => {
        if (payload?.messageId && !payload?.messageIds) {
          return {
            conversationId: payload.conversationId || payload?.data?.conversationId,
            messageIds: [payload.messageId],
            readAt: payload.readAt,
          } as { conversationId: string; messageIds: string[]; readAt?: string };
        }
        if (payload?.data?.messageIds || payload?.data?.conversationId) {
          return {
            conversationId: payload.data.conversationId,
            messageIds: payload.data.messageIds || [],
            readAt: payload.data.readAt,
          };
        }
        return payload as { conversationId: string; messageIds: string[]; readAt?: string };
      })();
      // Some backends may omit conversationId on MESSAGE_READ; update by IDs regardless
      console.debug("[socket] MESSAGE_READ", {
        cid: p.conversationId,
        ids: p.messageIds,
        at: p.readAt,
      });
      mutate((prev) => {
        if (!prev) return prev;
        const idSet = new Set(p.messageIds || []);
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            idSet.has(msg.id)
              ? {
                  ...msg,
                  is_read: true,
                  isRead: true,
                  readAt: p.readAt || msg.readAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);

      // Notify UI listeners (e.g., ChatWindow) for instantaneous status updates
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-read", {
            detail: { conversationId, messageIds: p.messageIds },
          })
        );
      } catch {}
    };

    const markMessagesOpened = (payload: {
      conversationId: string;
      messageIds: string[];
      openedAt?: string;
    } | { conversationId: string; messageId: string; openedAt?: string } | any) => {
      const p = (() => {
        if (payload?.messageId && !payload?.messageIds) {
          return {
            conversationId: payload.conversationId || payload?.data?.conversationId,
            messageIds: [payload.messageId],
            openedAt: payload.openedAt,
          };
        }
        if (payload?.data?.messageIds || payload?.data?.conversationId) {
          return {
            conversationId: payload.data.conversationId,
            messageIds: payload.data.messageIds || [],
            openedAt: payload.data.openedAt,
          };
        }
        return payload;
      })();
      // Some backends may omit conversationId on MESSAGE_OPENED; update by IDs regardless
      console.debug("[socket] MESSAGE_OPENED", {
        cid: p.conversationId,
        ids: p.messageIds,
        at: p.openedAt,
      });
      mutate((prev) => {
        if (!prev) return prev;
        const idSet = new Set(p.messageIds || []);
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            idSet.has(msg.id)
              ? {
                  ...msg,
                  isOpened: true,
                  openedAt: p.openedAt || msg.openedAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);

      // Notify UI listeners (e.g., ChatWindow) for instantaneous status updates
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-opened", {
            detail: { conversationId, messageIds: p.messageIds },
          })
        );
      } catch {}
    };

    const markMessagesDelivered = (payload: {
      conversationId: string;
      messages: Array<{ id: string; deliveredAt?: string }>;
    } | { conversationId: string; messageId: string; deliveredAt?: string } | any) => {
      const p = (() => {
        if (payload?.messageId && !payload?.messages) {
          return {
            conversationId: payload.conversationId || payload?.data?.conversationId,
            messages: [
              { id: payload.messageId, deliveredAt: payload.deliveredAt },
            ],
          } as { conversationId: string; messages: Array<{ id: string; deliveredAt?: string }> };
        }
        if (payload?.data?.messages || payload?.data?.conversationId) {
          return {
            conversationId: payload.data.conversationId,
            messages: (payload.data.messages || []).map((x: any) => ({
              id: x.id || x.messageId,
              deliveredAt: x.deliveredAt,
            })),
          };
        }
        return payload as { conversationId: string; messages: Array<{ id: string; deliveredAt?: string }> };
      })();
      if (!convMatches(p.conversationId, undefined)) return;
      const ids = new Set(
        p.messages.map((m: { id: string; deliveredAt?: string }) => m.id)
      );
      mutate((prev) => {
        if (!prev) return prev;
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) =>
            ids.has(msg.id)
              ? {
                  ...msg,
                  isDelivered: true,
                  deliveredAt:
                    p.messages.find(
                      (x: { id?: string; messageId?: string; deliveredAt?: string }) =>
                        (x.id || x.messageId) === msg.id
                    )
                      ?.deliveredAt || msg.deliveredAt,
                }
              : msg
          );
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);
    };

    // Some backends send a generic ACK event with a type field
    const handleMessageAck = (payload: any) => {
      // Normalize forms like { messageId, type, ackAt } or { data: { ... } }
      const p = (() => {
        const src = payload?.data || payload || {};
        return {
          messageId: src.messageId || src.id,
          type: src.type as string | undefined,
          ackAt: src.ackAt || src.openedAt || src.readAt,
          conversationId: src.conversationId,
        } as { messageId?: string; type?: string; ackAt?: string; conversationId?: string };
      })();
      if (!p.messageId) return;
      mutate((prev) => {
        if (!prev) return prev;
        return prev.map((page: any) => {
          const msgs = (page?.data?.messages || []).map((msg: any) => {
            if (msg.id !== p.messageId) return msg;
            if (p.type === "read") {
              return { ...msg, is_read: true, isRead: true, readAt: p.ackAt || msg.readAt };
            }
            if (p.type === "opened" || p.type === "viewed") {
              return { ...msg, isOpened: true, openedAt: p.ackAt || msg.openedAt };
            }
            if (p.type === "delivered" || p.type === "received") {
              return { ...msg, isDelivered: true, deliveredAt: p.ackAt || msg.deliveredAt };
            }
            return msg;
          });
          return { ...page, data: { ...(page.data || {}), messages: msgs } };
        });
      }, false);
    };

    on(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_SENT, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
    on(SOCKET_EVENTS.MESSAGE_READ, markMessagesRead as any);
    on(SOCKET_EVENTS.MESSAGE_OPENED, markMessagesOpened as any);
    on(SOCKET_EVENTS.MESSAGE_DELIVERED, markMessagesDelivered as any);
    on(SOCKET_EVENTS.MESSAGE_ACK, handleMessageAck as any);

    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_SENT, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_RECEIVED, appendNewMessage);
      off(SOCKET_EVENTS.MESSAGE_READ, markMessagesRead as any);
      off(SOCKET_EVENTS.MESSAGE_OPENED, markMessagesOpened as any);
      off(SOCKET_EVENTS.MESSAGE_DELIVERED, markMessagesDelivered as any);
      off(SOCKET_EVENTS.MESSAGE_ACK, handleMessageAck as any);
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
