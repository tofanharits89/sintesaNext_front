"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
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
  const { socket, isConnected, emit, on, off } = useSocket();

  // Refs for cleanup
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const currentConversationRef = useRef<Conversation | null>(null);

  // Update ref when currentConversation changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(backendPath("/messaging/conversations"), {
        headers: {
          Authorization: `Bearer ${
            document.cookie.split("token=")[1]?.split(";")[0]
          }`,
        },
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
        setConversations(data.data.conversations);
      } else {
        throw new Error(data.error || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(
    async (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      // Leave previous conversation room if any
      if (currentConversationRef.current && isConnected && socket) {
        emit(SOCKET_EVENTS.CONVERSATION_LEAVE, {
          conversationId: currentConversationRef.current.id,
        });
      }

      setCurrentConversation(conversation);

      // Join conversation room via socket
      if (isConnected && socket) {
        emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
      }
    },
    [conversations, isConnected, socket, emit]
  );

  // Send a message
  const sendMessage = useCallback(
    async (content: string, recipientId?: string, tempId?: string) => {
      if (!content.trim()) return;

      try {
        const payload = {
          content: content.trim(),
          ...(currentConversation
            ? { conversationId: currentConversation.id }
            : { recipientId }),
          tempId: tempId, // pass through explicit tempId for reconciliation
        };

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
              if (idx === -1) return prev ?? { data: { conversations: [] } };

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
          emit(SOCKET_EVENTS.MESSAGE_SEND, payload, (response: any) => {
            if (!response.success) {
              console.error("[Messaging][send] socket failed", response.error);
              toast.error("Failed to send message");
            }
          });
        } else {
          // Fallback to REST API
          const response = await fetch(backendPath("/messaging/send"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                document.cookie.split("token=")[1]?.split(";")[0]
              }`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error("Failed to send message");
          }

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Failed to send message");
          }

          // Refresh conversations to show new message
          await loadConversations();
        }
      } catch (error) {
        console.error("[Messaging][send] error", error);
        toast.error("Failed to send message");
      }
    },
    [currentConversation, isConnected, socket, emit, loadConversations]
  );

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!currentConversation || !isConnected || !socket) return;

    emit(SOCKET_EVENTS.TYPING_START, {
      conversationId: currentConversation.id,
    });

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

      // Update conversations list cache in-place via SWR for snappier UI
      swrMutate(backendPath("/messaging/conversations"), undefined, {
        revalidate: true,
      });
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
      // Broadcast custom event for UI hooks
      window.dispatchEvent(
        new CustomEvent("messages:marked-as-opened", {
          detail: {
            messageIds: data.messageIds,
            conversationId: data.conversationId,
            openedAt: data.openedAt,
          },
        })
      );

      // Revalidate conversations cache to refresh unread counts if needed
      swrMutate(backendPath("/messaging/conversations"), undefined, {
        revalidate: true,
      });
    };

    // Handle read status updates
    const handleMessagesRead = (data: MessagesReadPayload) => {
      // Broadcast custom event for UI hooks
      window.dispatchEvent(
        new CustomEvent("messages:marked-as-read", {
          detail: {
            messageIds: data.messageIds,
            conversationId: data.conversationId,
          },
        })
      );

      // Revalidate conversations cache to refresh unread counts if needed
      swrMutate(backendPath("/messaging/conversations"), undefined, {
        revalidate: true,
      });
    };

    // Handle delivered status updates
    const handleMessagesDelivered = (data: any) => {
      // Messages are handled by SWR (useMessages); no local update here
    };

    // Register event listeners
    on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    on(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
    on(SOCKET_EVENTS.MESSAGE_READ, handleMessagesRead);
    on(SOCKET_EVENTS.MESSAGE_OPENED, handleMessagesOpened);
    on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessagesDelivered);

    // Cleanup
    return () => {
      off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      off(SOCKET_EVENTS.TYPING_USER, handleTypingUser);
      off(SOCKET_EVENTS.MESSAGE_READ, handleMessagesRead);
      off(SOCKET_EVENTS.MESSAGE_OPENED, handleMessagesOpened);
      off(SOCKET_EVENTS.MESSAGE_DELIVERED, handleMessagesDelivered);
    };
  }, [isConnected, socket, currentConversation, on, off]);

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
