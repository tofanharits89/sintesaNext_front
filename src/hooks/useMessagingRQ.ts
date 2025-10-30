"use client";

import { useCallback, useMemo } from "react";
import { useConversations } from "./useConversationsRQ";
import { useMessagesRQ } from "./useMessagesRQ";
import { pushTempMessage, updateTempMessageById } from "@/features/messaging/temp-messages-store";
import { FrontendMessage } from "@/types/socket-events";
import {
  useSendMessageMutation,
  useMarkAsReadMutation,
} from "./useMessageMutationsRQ";
import { useMarkAsReadScheduler } from "./messaging-rq/useMarkAsReadScheduler";
import { useSocket } from "./useSocket";
import {
  useMessagingStore,
  useActiveConversationId,
  useMessageInput,
  useTypingUsers,
  useMessagingConnection,
  useTotalUnreadCount,
} from "@/stores";
import { useAuth } from "@/hooks/useAuth";

/**
 * Comprehensive messaging hook that integrates React Query + Zustand + WebSocket
 *
 * This is the main hook that components should use for messaging functionality.
 * It provides:
 * - Conversations and messages data (React Query)
 * - UI state management (Zustand)
 * - Real-time updates (WebSocket)
 * - Optimistic updates and mutations
 */
export function useMessagingRQ(options?: { enabled?: boolean }) {
  const { user: currentUser } = useAuth();

  // Global messaging state from simplified Zustand store
  const activeConversationId = useActiveConversationId();
  const messageInput = useMessageInput();
  const { isConnected, setActiveConversation, setConnectionStatus } = useMessagingConnection();

  // Get total unread count from store
  const totalUnreadCount = useTotalUnreadCount();

  // Typing users for current conversation
  const typingUsers = useTypingUsers(activeConversationId || "");

  // Typing state for current conversation
  const isAnyoneTyping = typingUsers.length > 0;
  const typingText = typingUsers.length === 1 && typingUsers[0]
    ? `${typingUsers[0].username} is typing...`
    : `${typingUsers.length} people are typing...`;

  // Store actions
  const {
    setActiveConversation: setActive,
    setMessageContent,
    setTyping,
    clearMessageInput,
    addTypingUser,
    removeTypingUser,
  } = useMessagingStore();

  // React Query data
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    hasNextPage: conversationsHasNextPage,
    fetchNextPage: fetchNextConversations,
    isFetchingNextPage: isFetchingNextConversations,
    invalidateConversations,
    refetchConversations,
  } = useConversations(
    typeof options?.enabled === "boolean" ? { enabled: options.enabled } : undefined
  );

  const {
    messages,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessagesRQ(activeConversationId || undefined);

  // Mutations
  const sendMessageMutation = useSendMessageMutation();
  const markAsReadMutation = useMarkAsReadMutation(
    activeConversationId || undefined
  );

  // Direct socket integration
  const { isConnected: socketConnected } = useSocket();

  // TODO: Implement simplified unread count sync if needed
  // Removed complex unread sync for simplified implementation

  // Compute unread IDs and a stable key to avoid effect churn on array identity changes
  const { unreadIds, idsKey } = useMemo(() => {
    if (!activeConversationId || !messages || messages.length === 0)
      return { unreadIds: [] as string[], idsKey: "" };
    const ids = Array.from(
      new Set(
        messages
          .filter((msg: any) => !msg.isRead && msg.sender?.id !== currentUser?.id)
          .map((m: any) => m.id)
      )
    ) as string[];
    const key = ids.length ? ids.slice().sort().join("|") : "";
    return { unreadIds: ids, idsKey: key };
  }, [activeConversationId, messages, currentUser?.id]);

  useMarkAsReadScheduler({
    activeConversationId,
    idsKey,
    unreadIds,
    mutation: markAsReadMutation,
  });

  // Helper functions
  const selectConversation = useCallback(
    (conversationId: string) => {
      // Avoid redundant updates
      if (conversationId === activeConversationId) return;

      setActive(conversationId);
      clearMessageInput();
    },
    [activeConversationId, setActive, clearMessageInput]
  );

  const sendMessage = useCallback(
    async (
      content: string,
      recipientId?: string,
      conversationIdOverride?: string,
      skipOptimistic?: boolean
    ) => {
      if (!content.trim()) return;

      const tempId = `temp-msg-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      // IMPORTANT: Read the latest activeConversationId at call time to avoid stale closures
      // Allow explicit override to avoid UI store timing races (e.g., just selected a temp conversation)
      const latestActiveId =
        conversationIdOverride ||
        activeConversationId ||
        "";

      // If we're in a temporary conversation (not fetchable), inject optimistic message into local store
      const convId = String(latestActiveId || "");
      const isTempConv =
        convId.startsWith("temp-") ||
        convId.startsWith("temp_conv-") ||
        convId.startsWith("temp-conv-");

      if (isTempConv && !recipientId) {
        const err = new Error("Recipient required to start a new conversation");
        // TODO: Add simple notification system if needed
        console.error("Cannot send message: recipient required for new conversation");
        throw err;
      }

      if (isTempConv && !skipOptimistic) {
        const nowIso = new Date().toISOString();
        const tempMessage: FrontendMessage = {
          id: tempId,
          conversationId: convId,
          content: content.trim(),
          timestamp: nowIso,
          sender: currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username || "you",
                name: currentUser.name || "You",
              }
            : { id: "current-user", username: "you", name: "You" },
          senderType: "user",
          isRead: false,
          isDelivered: false,
        } as FrontendMessage;
        // Mark as sending to show clock icon in UI
        (tempMessage as any)._sending = true;
        (tempMessage as any)._failed = false;
        // optimisticInsert removed - temp messages are handled by temp-messages-store

        // Start a 10s watchdog for temp conversations as well
        const localTempId = tempId;
        const localConvId = convId;
        let tempWatchdog: any = null;
        tempWatchdog = setTimeout(() => {
          try {
            updateTempMessageById(localConvId, localTempId, {
              _sending: false as any,
              _failed: true as any,
            });
          } catch {}
        }, 10000);

        // Attach to window to allow clearing on success/error in this scope
        (window as any).__temp_send_watchdog__ = tempWatchdog;
      }

      try {
        const args: any = {
          content: content.trim(),
          tempId,
        };
        // IMPORTANT: Do not send a temp conversationId to the server.
        // If it's a temp conversation, omit conversationId so the server creates a real one using recipientId.
        if (!isTempConv && latestActiveId) {
          args.conversationId = latestActiveId;
        }
        if (recipientId) {
          args.recipientId = recipientId;
        }
        await sendMessageMutation.mutateAsync(args);
      } catch (error) {
        // TODO: Add simple error notification if needed
        console.error("Failed to send message:", error);

        // If this is a temporary conversation, flip the optimistic message to failed
        if (isTempConv && tempId) {
          try {
            updateTempMessageById(convId, tempId, { _sending: false as any, _failed: true as any });
          } catch {}
        }

        // Clear temp watchdog on error
        try {
          const wd = (window as any).__temp_send_watchdog__;
          if (wd) clearTimeout(wd);
        } catch {}
      }

      // Clear temp watchdog on success
      try {
        const wd = (window as any).__temp_send_watchdog__;
        if (wd) clearTimeout(wd);
      } catch {}
    },
    [
      activeConversationId,
      sendMessageMutation,
    ]
  );

  const markMessagesAsRead = useCallback(
    (messageIds: string[]) => {
      if (!activeConversationId || messageIds.length === 0) return;

      markAsReadMutation.mutate({ messageIds });
    },
    [activeConversationId, markAsReadMutation]
  );



  const loadMoreMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const startTyping = useCallback(() => {
    if (!activeConversationId) return;

    setTyping(true);

    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [activeConversationId, setTyping]);

  const stopTyping = useCallback(() => {
    if (!activeConversationId) return;

    setTyping(false);
  }, [activeConversationId, setTyping]);

  const refreshData = useCallback(() => {
    refetchConversations();
    // Messages are automatically refetched on conversation change
  }, [refetchConversations, activeConversationId]);

  // Return simplified messaging interface
  return {
    // Data
    conversations,
    messages,
    activeConversationId,

    // UI State
    messageInput,
    typingUsers,
    isAnyoneTyping,
    typingText,
    totalUnreadCount,

    // Loading states
    isLoading: conversationsLoading || messagesLoading,
    isLoadingConversations: conversationsLoading,
    isLoadingMessages: messagesLoading,
    isFetchingMessages: messagesFetching,
    isLoadingMoreMessages: isFetchingNextPage,
    isSendingMessage: sendMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,

    // Connection state
    isSocketConnected: socketConnected,

    // Pagination
    hasNextPage,
    canLoadMore: hasNextPage && !isFetchingNextPage,
    conversationsHasNextPage,
    fetchNextConversations,
    isFetchingNextConversations,

    // Actions
    selectConversation,
    sendMessage,
    markMessagesAsRead,
    loadMoreMessages,
    startTyping,
    stopTyping,
    refreshData,

    // UI Actions
    setMessageContent,
    clearMessageInput,

    // Error states
    error: conversationsError,
    sendError: sendMessageMutation.error,

    // Advanced
    invalidateConversations,
    refetchConversations,
  };
}

// Convenience hook for conversation-specific operations
export function useConversationRQ(conversationId: string) {
  const { messages, isLoading, hasNextPage, fetchNextPage } =
    useMessagesRQ(conversationId);
  const markAsReadMutation = useMarkAsReadMutation(conversationId);
  const typingUsers = useTypingUsers(conversationId);

  return {
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    typingUsers,
    markAsRead: (messageIds: string[]) =>
      markAsReadMutation.mutate({ messageIds }),
  };
}
