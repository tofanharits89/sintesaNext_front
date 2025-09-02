"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import { useConversations } from "./useConversations";
import {
  SOCKET_EVENTS,
  Conversation,
  SocketMessageData,
  TypingUserPayload,
  MessagesReadPayload,
  formatRelativeTime,
  FrontendMessage,
} from "@/shared/socket-events";
import { backendPath } from "@/lib/backend";
import { toast } from "sonner";
import { mutate as swrMutate } from "swr";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import * as Outbox from "@/features/messaging/outbox";
import {
  getHint,
  clearHint,
} from "@/features/messaging/temp-conversation-hints";

export interface UseMessagingReturn {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isConnected: boolean;
  typingUsers: Set<string>;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    content: string,
    recipientId?: string,
    tempId?: string
  ) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;

  // Utilities
  getUnreadCount: (conversationId?: string) => number;
  formatMessageTime: (timestamp: string) => string;
}

export const useMessaging = (): UseMessagingReturn => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Socket connection
  const { socket, isConnected, emit, on, off, connectionState } = useSocket();
  // SWR conversations source of truth (includes optimistic temp conversations)
  const { conversations: swrConversations } = useConversations();

  // Refs for cleanup
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const currentConversationRef = useRef<Conversation | null>(null);
  const lastLoadAtRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  // Update ref when currentConversation changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    // Throttle to avoid 429 and prevent concurrent loads
    if (isLoadingRef.current) return;
    const now = Date.now();
    if (now - lastLoadAtRef.current < 1500) return;
    isLoadingRef.current = true;
    try {
      setIsLoading(true);

      const token = getAuthTokenFromCookie();
      const response = await fetch(backendPath("/messaging/conversations"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      // Check if response has valid JSON content
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // Keep error concise
        console.error("[Messaging] Failed to parse conversations response");
        throw new Error("Invalid JSON response from server");
      }

      if (data.success) {
        const serverConvs = data.data.conversations;
        setConversations(serverConvs);
        // Reconcile currentConversation with fresh data if available
        const cur = currentConversationRef.current;
        if (cur) {
          const updated = serverConvs.find((c: any) => c.id === cur.id);
          if (updated) {
            setCurrentConversation(updated);
          }
        }
      } else {
        throw new Error(data.error || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      lastLoadAtRef.current = Date.now();
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(
    async (conversationId: string) => {
      // Avoid redundant selection
      if (currentConversationRef.current?.id === conversationId) {
        // Still broadcast so UI highlights if needed
        try {
          window.dispatchEvent(
            new CustomEvent("conversation:selected", {
              detail: { conversationId },
            })
          );
        } catch {}
        return;
      }

      // Prefer SWR conversations (may contain optimistic data like otherParticipant)
      let conversation =
        (swrConversations.find((c) => c.id === conversationId) as any) ||
        (conversations.find((c) => c.id === conversationId) as any);
      // If not found yet (e.g., immediately after creation), use a minimal stub so UI can open
      if (!conversation) {
        // Try to hydrate stub with any temp hint (e.g., selected recipient) so UI shows proper name immediately
        const hint = getHint(conversationId);
        conversation = {
          id: conversationId,
          ...(hint || {}),
        } as unknown as Conversation;
      }

      // Leave previous conversation room if any
      if (currentConversationRef.current && isConnected && socket) {
        emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
          conversationId: currentConversationRef.current.id,
        });
      }

      console.log("[useMessaging:selectConversation]", {
        conversationId,
        from: conversation,
      });
      setCurrentConversation(conversation);
      // Broadcast selection so containers can sync their local selection state
      try {
        window.dispatchEvent(
          new CustomEvent("conversation:selected", {
            detail: { conversationId },
          })
        );
      } catch {}

      // Join conversation room via socket
      if (isConnected && socket) {
        emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
      }

      // If we selected a stub (no details), schedule a single reconciliation fetch
      if (!("otherParticipant" in conversation)) {
        setTimeout(() => {
          loadConversations();
        }, 250);
      }

      // Clear temp hint when we select a real conversation id (keep for temp ids)
      try {
        const looksTemp =
          conversationId.startsWith("temp-") ||
          conversationId.startsWith("temp_conv-") ||
          conversationId.startsWith("temp-conv-");
        if (!looksTemp) clearHint(conversationId);
      } catch {}
    },
    [
      swrConversations,
      conversations,
      isConnected,
      socket,
      emit,
      loadConversations,
    ]
  );

  // Reconcile currentConversation from SWR list when details become available
  useEffect(() => {
    const cur = currentConversationRef.current as any;
    if (!cur) return;
    const detailed = (swrConversations as any[])?.find((c) => c.id === cur.id);
    if (detailed && cur.otherParticipant == null && detailed.otherParticipant) {
      setCurrentConversation(detailed as Conversation);
    }
  }, [swrConversations]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, recipientId?: string, tempId?: string) => {
      if (!content.trim()) return;

      try {
        // Prefer explicitly provided recipientId (e.g., from NewMessageDialog)
        const resolvedRecipientId =
          recipientId || (currentConversation as any)?.otherParticipant?.id;
        console.log("[useMessaging:send]", {
          content: content.trim(),
          currentConversationId: currentConversation?.id,
          passedRecipientId: recipientId,
          resolvedRecipientId,
          tempId,
        });

        // Only attach conversationId if it looks real (not a temp id)
        const looksTemp =
          !!currentConversation?.id &&
          (currentConversation.id.startsWith("temp-") ||
            currentConversation.id.startsWith("temp_conv-") ||
            currentConversation.id.startsWith("temp-conv-"));
        const payload: any = {
          content: content.trim(),
          type: "text" as const,
          ...(!looksTemp && currentConversation
            ? { conversationId: currentConversation.id }
            : {}),
          tempId: tempId, // pass through explicit tempId for reconciliation
        };
        if (resolvedRecipientId) {
          payload.recipientId = resolvedRecipientId;
        }

        // Optimistically update conversations list so recent chat shows immediately
        if (currentConversation) {
          const listKey = backendPath("/messaging/conversations");
          const nowIso = new Date().toISOString();
          swrMutate(
            listKey,
            (prev: any) => {
              const list = Array.isArray(prev?.data?.conversations)
                ? [...prev.data.conversations]
                : [];
              const idx = list.findIndex(
                (c: any) => c?.id === currentConversation.id
              );
              // If the conversation isn't in the cache yet, do not overwrite the cache with an empty list
              if (idx === -1) return prev;

              const conv = { ...(list[idx] || {}) };
              // Set a minimal lastMessage optimistically
              conv.lastMessage = {
                ...(conv.lastMessage || {}),
                id: tempId || `temp-${Math.random().toString(36).slice(2)}`,
                content: payload.content,
                is_read: true,
                isRead: true,
                timestamp: nowIso,
                created_at: nowIso,
              };
              conv.updated_at = nowIso;

              // Move conversation to top
              list.splice(idx, 1);
              list.unshift(conv);

              return {
                ...(prev || {}),
                data: { ...(prev?.data || {}), conversations: list },
              };
            },
            { revalidate: false }
          );
        }

        if (isConnected && socket) {
          // Send via socket for real-time delivery
          emit(SOCKET_EVENTS.MESSAGE_SEND, payload, async (response: any) => {
            console.log("[useMessaging:send][ACK]", { response });
            if (response?.success) {
              try {
                const newConvId =
                  response?.data?.conversationId || response?.conversationId;
                if (tempId) Outbox.remove(tempId);
                if (newConvId) {
                  // Notify listeners to reconcile temp conversation in SWR cache
                  try {
                    window.dispatchEvent(
                      new CustomEvent("conversation:created", {
                        detail: { tempId, conversationId: newConvId },
                      })
                    );
                  } catch {}
                  await loadConversations();
                  await selectConversation(newConvId);
                } else {
                  // Fallback: just refresh conversations
                  await loadConversations();
                }
              } catch (e) {
                console.warn(
                  "[Messaging][send][socket ack] success handling error",
                  e
                );
              }
              return;
            }

            if (!response?.success) {
              const serverErr =
                response?.error || response?.message || "Unknown error";
              console.warn(
                "[Messaging][send] socket failed; trying REST fallback",
                serverErr,
                { payload }
              );

              // Attempt REST fallback immediately
              let restOk = false;
              try {
                const token = getAuthTokenFromCookie();
                const resp = await fetch(backendPath("/messaging/send"), {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  credentials: "include",
                  body: JSON.stringify(payload),
                });
                if (resp.ok) {
                  const json = await resp.json();
                  if (json?.success) {
                    restOk = true;
                    if (tempId) Outbox.remove(tempId);
                    await loadConversations();
                    const newConvId = json?.data?.conversationId;
                    if (newConvId) {
                      await selectConversation(newConvId);
                    }
                    // Success via REST; suppress error toast to avoid confusion
                  }
                } else {
                  const text = await resp.text();
                  console.error(
                    "[Messaging][send][REST] failed",
                    resp.status,
                    text
                  );
                }
              } catch (e) {
                console.error("[Messaging][send][REST] exception", e);
              }

              if (!restOk) {
                // Both socket and REST failed: show error and queue for retry
                toast.error(serverErr || "Failed to send message");
                if (currentConversation && tempId) {
                  Outbox.enqueue({
                    tempId,
                    conversationId: currentConversation.id,
                    content: payload.content,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          });
        } else {
          // Offline or no socket: queue in outbox to retry later
          if (currentConversation && tempId) {
            Outbox.enqueue({
              tempId,
              conversationId: currentConversation.id,
              content: payload.content,
              createdAt: new Date().toISOString(),
            });
          }
          // Best-effort REST attempt when network is up but socket not ready
          try {
            const token = getAuthTokenFromCookie();
            const response = await fetch(backendPath("/messaging/send"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: "include",
              body: JSON.stringify(payload),
            });
            if (response.ok) {
              const data = await response.json();
              if (data?.success) {
                // success path
                if (tempId) Outbox.remove(tempId);
                await loadConversations();
                const newConvId = data?.data?.conversationId;
                if (newConvId) {
                  await selectConversation(newConvId);
                }
              }
            }
          } catch {
            // ignore; will retry from outbox
          }
        }
      } catch (error) {
        console.error("[Messaging][send] error", error);
        toast.error("Failed to send message");
      }
    },
    [
      currentConversation,
      isConnected,
      socket,
      emit,
      loadConversations,
      selectConversation,
    ]
  );

  // Typing indicators
  const lastTypingEmitAtRef = useRef<number>(0);
  const startTyping = useCallback(() => {
    if (!currentConversation || !isConnected || !socket) return;

    const now = Date.now();
    if (now - lastTypingEmitAtRef.current > 2000) {
      lastTypingEmitAtRef.current = now;
      emit(SOCKET_EVENTS.TYPING_START, {
        conversationId: currentConversation.id,
      });
    }

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [currentConversation, isConnected, socket, emit]);

  const stopTyping = useCallback(() => {
    if (!currentConversation || !isConnected || !socket) return;

    emit(SOCKET_EVENTS.TYPING_STOP, { conversationId: currentConversation.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentConversation, isConnected, socket, emit]);

  // Utility functions
  const getUnreadCount = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) return 0;

        // Use the proper unread_count field from backend if available
        if (conversation.unread_count !== undefined) {
          return conversation.unread_count;
        }

        // Fallback to lastMessage.isRead logic for backward compatibility
        const lastMessage = conversation.lastMessage;
        if (!lastMessage) return 0;
        const isRead =
          lastMessage.isRead !== undefined
            ? lastMessage.isRead
            : lastMessage.is_read;
        return !isRead ? 1 : 0;
      }

      // Total unread count across all conversations
      return conversations.reduce((count, conv) => {
        // Use the proper unread_count field from backend if available
        if (conv.unread_count !== undefined) {
          return count + conv.unread_count;
        }

        // Fallback to lastMessage.isRead logic for backward compatibility
        const lastMessage = conv.lastMessage;
        if (!lastMessage) return count;
        const isRead =
          lastMessage.isRead !== undefined
            ? lastMessage.isRead
            : lastMessage.is_read;
        return count + (!isRead ? 1 : 0);
      }, 0);
    },
    [conversations]
  );

  const formatMessageTime = useCallback((timestamp: string) => {
    return formatRelativeTime(timestamp);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!isConnected || !socket) return;

    // Handle new messages
    const handleNewMessage = (messageData: SocketMessageData) => {
      const newMessage: FrontendMessage = {
        id: messageData.id,
        conversationId: messageData.conversationId,
        content: messageData.content,
        timestamp: messageData.timestamp,
        sender: messageData.sender,
        senderType: messageData.senderType,
        isRead: false,
      };

      // Messages are handled by SWR (useMessages); no local push here

      // Conversations list is updated by useConversations socket bridges; avoid clearing/revalidating cache here
    };

    // Handle typing indicators
    const handleTypingUser = (data: TypingUserPayload) => {
      if (data.conversationId === currentConversation?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    };

    // Handle opened status updates
    const handleMessagesOpened = (data: any) => {
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-opened", {
            detail: {
              messageIds: data.messageIds,
              conversationId: data.conversationId,
              openedAt: data.openedAt,
            },
          })
        );

        // Conversations list is updated by useConversations socket bridges; avoid clearing cache here
        console.debug(
          "[Messaging][handleMessagesOpened] opened messages",
          data
        );
      } catch (error) {
        console.error("[Messaging][handleMessagesOpened] error", error);
      }
    };

    // Handle read status updates
    const handleMessagesRead = (data: MessagesReadPayload) => {
      try {
        window.dispatchEvent(
          new CustomEvent("messages:marked-as-read", {
            detail: {
              messageIds: data.messageIds,
              conversationId: data.conversationId,
            },
          })
        );

        // Avoid forcing revalidation; rely on socket bridges/useConversations to sync
        swrMutate(backendPath("/messaging/conversations"), undefined, {
          revalidate: false,
        });
        console.debug("[Messaging][handleMessagesRead] read messages", data);
      } catch (error) {
        console.error("[Messaging][handleMessagesRead] error", error);
      }
    };

    // Handle delivered status updates
    const handleMessagesDelivered = (_data: {
      conversationId: string;
      messages: Array<{ id: string; deliveredAt?: string }>;
    }) => {
      // Messages are handled by SWR (useMessages); no local update here
    };

    // Register event listeners
    on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    on(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
    on(SOCKET_EVENTS.MESSAGE_READ, handleMessagesRead);
    on(SOCKET_EVENTS.MESSAGE_OPENED, handleMessagesOpened);
    on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessagesDelivered);

    // Also listen for backend message errors for diagnostics
    const handleMessageError = (err: any) => {
      console.error("[Messaging][socket] MESSAGE_ERROR", err);
      const msg = err?.error || err?.message || "Message error";
      toast.error(msg);
    };
    on(SOCKET_EVENTS.MESSAGE_ERROR, handleMessageError);

    // Cleanup
    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
      off(SOCKET_EVENTS.MESSAGE_READ, handleMessagesRead);
      off(SOCKET_EVENTS.MESSAGE_OPENED, handleMessagesOpened);
      off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessagesDelivered);
      off(SOCKET_EVENTS.MESSAGE_ERROR, handleMessageError);
    };
  }, [isConnected, socket, currentConversation, on, off]);

  // On reconnect: rejoin current conversation and flush outbox
  useEffect(() => {
    if (connectionState !== "connected" || !socket) return;
    const conv = currentConversationRef.current;
    if (conv) {
      emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: conv.id });
    }
    // Flush outbox
    Outbox.flush(async (item) => {
      return new Promise<boolean>((resolve) => {
        emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          {
            content: item.content,
            conversationId: item.conversationId,
            tempId: item.tempId,
          },
          (response: any) => {
            resolve(!!response?.success);
          }
        );
      });
    });
  }, [connectionState, socket, emit]);

  // Auto-mark-as-read functionality moved to useAutoMarkAsRead hook for better control

  // Load conversations on mount
  useEffect(() => {
    loadConversations();

    return () => {
      mountedRef.current = false;
    };
  }, [loadConversations]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    conversations,
    currentConversation,
    isLoading,
    isConnected,
    typingUsers,

    // Actions
    loadConversations,
    selectConversation,
    sendMessage,
    startTyping,
    stopTyping,

    // Utilities
    getUnreadCount,
    formatMessageTime,
  };
};
