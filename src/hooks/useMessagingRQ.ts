"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import { useConversations } from "./useConversationsRQ";
import { useMessages } from "./useMessagesRQ";
import { FrontendMessage } from "@/shared/socket-events";
import {
  useSendMessageMutation,
  useMarkAsReadMutation,
} from "./useMessageMutationsRQ";
import { useMessagingSocketRQ } from "./useMessagingSocketRQ";
import {
  useMessagingStores,
  useConversationStores,
  useMessagingUIStore,
  useTypingIndicatorsStore,
  useUnreadBadgesStore,
  useNotificationStore,
} from "@/stores";
import { useCurrentUser } from "@/lib/use-current-user";

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
  const { currentUser } = useCurrentUser();

  // Global messaging state from Zustand
  const { activeConversationId, messageInput, totalUnreadCount } =
    useMessagingStores();

  // Conversation-specific state from Zustand
  const conversationStores = useConversationStores(activeConversationId || "");

  // Actions (stable function refs from Zustand stores)
  const setActiveConversation = useMessagingUIStore(
    (s) => s.setActiveConversation
  );
  const setLoadingConversation = useMessagingUIStore(
    (s) => s.setLoadingConversation
  );
  const clearMessageInput = useMessagingUIStore((s) => s.clearMessageInput);
  const resetConversationState = useMessagingUIStore(
    (s) => s.resetConversationState
  );
  const setIsTyping = useMessagingUIStore((s) => s.setIsTyping);
  const setMessageContent = useMessagingUIStore((s) => s.setMessageContent);
  const setNewMessageDialogOpen = useMessagingUIStore(
    (s) => s.setNewMessageDialogOpen
  );

  const setCurrentUserTyping = useTypingIndicatorsStore(
    (s) => s.setCurrentUserTyping
  );

  const replaceAllUnreadCounts = useUnreadBadgesStore(
    (s) => s.replaceAllUnreadCounts
  );

  const addNotification = useNotificationStore((s) => s.addNotification);

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
  } = useConversations({ enabled: options?.enabled });

  const {
    messages,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    invalidateMessages,
    refetchMessages,
    optimisticInsert,
  } = useMessages(activeConversationId || undefined);

  // Mutations
  const sendMessageMutation = useSendMessageMutation();
  const markAsReadMutation = useMarkAsReadMutation(
    activeConversationId || undefined
  );

  // WebSocket integration
  const { isConnected: socketConnected } = useMessagingSocketRQ();

  // Sync unread counts from conversations to Zustand store using the centralized utility
  const lastUnreadSyncKeyRef = useRef<string>("");
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    // Clear any pending sync to debounce rapid changes
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Build a stable key of the unread state we intend to push into the store
    const entries = conversations
      .map((c) => {
        const cnt = c.unread_count || 0;
        const lid = c.lastMessage?.id || "";
        const lts = c.lastMessage?.timestamp || "";
        return `${c.id}:${cnt}:${lid}:${lts}`;
      })
      .sort();
    const key = entries.join("|");

    // If nothing changed since last sync, skip updating the store to avoid render loops
    if (key === lastUnreadSyncKeyRef.current) {
      return;
    }

    // Debounce the sync operation to prevent excessive updates
    syncTimeoutRef.current = setTimeout(() => {
      // Import the sync utility dynamically to avoid circular dependencies
      import('@/utils/unread-sync').then(({ debouncedSyncUnreadCounts, sanitizeUnreadData }) => {
        const updates = conversations
          .map((conv) => sanitizeUnreadData({
            conversationId: conv.id,
            count: conv.unread_count || 0,
            lastMessageId: conv.lastMessage?.id,
            lastMessageTimestamp: conv.lastMessage?.timestamp,
          }))
          .filter(Boolean) as any[];

        debouncedSyncUnreadCounts(updates, {
          preserveActiveConversation: true,
          source: 'api',
        });
      });

      lastUnreadSyncKeyRef.current = key;
    }, 100); // 100ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [conversations]);

  // Remember last submitted message IDs for mark-as-read to avoid duplicate requests
  const lastSubmittedReadRef = useRef<{
    conversationId: string;
    idsKey: string;
  } | null>(null);
  const lastMarkAtRef = useRef<number>(0);

  // Compute unread IDs and a stable key to avoid effect churn on array identity changes
  const { unreadIds, idsKey } = useMemo(() => {
    if (!activeConversationId || !messages || messages.length === 0)
      return { unreadIds: [] as string[], idsKey: "" };
    const ids = Array.from(
      new Set(
        messages
          .filter((msg) => !msg.isRead && msg.sender?.id !== currentUser?.id)
          .map((m) => m.id)
      )
    );
    const key = ids.length ? ids.slice().sort().join("|") : "";
    return { unreadIds: ids, idsKey: key };
  }, [activeConversationId, messages, currentUser?.id]);

  // Auto-mark messages as read when conversation is active and user is viewing
  useEffect(() => {
    if (!activeConversationId || !idsKey || unreadIds.length === 0) return;
    if (markAsReadMutation.isPending) return;

    // Only when tab visible; require window focus only if the API exists
    if (typeof document !== "undefined") {
      if (document.visibilityState !== "visible") return;
      if (typeof (document as any).hasFocus === "function") {
        if (!(document as any).hasFocus()) return;
      }
    }

    // Avoid re-submitting the same batch and add a short cooldown
    if (
      lastSubmittedReadRef.current &&
      lastSubmittedReadRef.current.conversationId === activeConversationId &&
      lastSubmittedReadRef.current.idsKey === idsKey
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastMarkAtRef.current < 1200) {
      // Increased cooldown to 1.2s to prevent rapid consecutive mutations
      return;
    }

    const timer = setTimeout(() => {
      // Double-check conditions before executing to prevent stale closures
      if (!activeConversationId || !idsKey || unreadIds.length === 0) return;
      if (markAsReadMutation.isPending) return;
      
      lastSubmittedReadRef.current = {
        conversationId: activeConversationId,
        idsKey,
      };
      lastMarkAtRef.current = Date.now();
      markAsReadMutation.mutate({ messageIds: unreadIds });
    }, 800); // Increased delay to 800ms

    return () => clearTimeout(timer);
  }, [activeConversationId, idsKey, unreadIds.length, markAsReadMutation.isPending]);

  // Helper functions
  const selectConversation = useCallback(
    (conversationId: string) => {
      // Avoid redundant updates that can cascade through stores and queries
      if (conversationId === activeConversationId) return;

      setActiveConversation(conversationId);
      setLoadingConversation(true);

      // Clear any existing message input
      clearMessageInput();

      // Reset conversation-specific UI state
      resetConversationState(conversationId);

      // For temp conversations, clear loading immediately to avoid perceived lag
      const safeConversationId = String(conversationId || "");
      const isTemp =
        safeConversationId.startsWith("temp-") ||
        safeConversationId.startsWith("temp_conv-") ||
        safeConversationId.startsWith("temp-conv-");
      if (isTemp) {
        setLoadingConversation(false);
      } else {
        // Keep a short delay for real conversations to allow UI to settle
        setTimeout(() => {
          setLoadingConversation(false);
        }, 500);
      }
    },
    [
      activeConversationId,
      setActiveConversation,
      setLoadingConversation,
      clearMessageInput,
      resetConversationState,
    ]
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
        useMessagingUIStore.getState().activeConversationId ||
        "";

      // If we're in a temporary conversation (not fetchable), inject optimistic message into local store
      const convId = String(latestActiveId || "");
      const isTempConv =
        convId.startsWith("temp-") ||
        convId.startsWith("temp_conv-") ||
        convId.startsWith("temp-conv-");

      if (isTempConv && !recipientId) {
        const err = new Error("Recipient required to start a new conversation");
        addNotification({
          type: "error",
          title: "Cannot send message",
          message:
            "Please select a recipient before sending the first message.",
        });
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
          isRead: true,
          isDelivered: false,
        } as FrontendMessage;
        try {
          await optimisticInsert(tempMessage);
        } catch {}
      }

      try {
        await sendMessageMutation.mutateAsync({
          content: content.trim(),
          // IMPORTANT: Do not send a temp conversationId to the server.
          // If it's a temp conversation, omit conversationId so the server creates a real one using recipientId.
          conversationId: isTempConv ? undefined : latestActiveId || undefined,
          recipientId,
          tempId,
        });
      } catch (error) {
        // Show error notification
        addNotification({
          type: "error",
          title: "Message Failed",
          message: "Failed to send message. Please try again.",
          persistent: true,
        });
      }
    },
    [
      activeConversationId,
      sendMessageMutation,
      addNotification,
      optimisticInsert,
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

    setIsTyping(true);
    setCurrentUserTyping(activeConversationId, true);

    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      setIsTyping(false);
      setCurrentUserTyping(activeConversationId, false);
    }, 3000);
  }, [activeConversationId, setIsTyping, setCurrentUserTyping]);

  const stopTyping = useCallback(() => {
    if (!activeConversationId) return;

    setIsTyping(false);
    setCurrentUserTyping(activeConversationId, false);
  }, [activeConversationId, setIsTyping, setCurrentUserTyping]);

  const refreshData = useCallback(() => {
    refetchConversations();
    if (activeConversationId) {
      refetchMessages();
    }
  }, [refetchConversations, refetchMessages, activeConversationId]);

  // Return comprehensive messaging interface
  return {
    // Data
    conversations,
    messages,
    activeConversationId,

    // UI State
    messageInput,
    totalUnreadCount,
    conversationState: conversationStores.conversationState,

    // Typing indicators
    typingUsers: conversationStores.typingUsers,
    isAnyoneTyping: conversationStores.isAnyoneTyping,
    typingText: conversationStores.typingText,

    // Unread state
    unreadCount: conversationStores.unreadCount,
    hasUnreadMessages: conversationStores.hasUnreadMessages,

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
    setNewMessageDialogOpen,

    // Error states
    error: conversationsError,
    sendError: sendMessageMutation.error,

    // Advanced
    invalidateConversations,
    invalidateMessages,
    refetchConversations,
    refetchMessages,
  };
}

// Convenience hook for conversation-specific operations
export function useConversationRQ(conversationId: string) {
  const conversationStores = useConversationStores(conversationId);
  const { messages, isLoading, hasNextPage, fetchNextPage } =
    useMessages(conversationId);
  const markAsReadMutation = useMarkAsReadMutation(conversationId);

  return {
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    ...conversationStores,
    markAsRead: (messageIds: string[]) =>
      markAsReadMutation.mutate({ messageIds }),
  };
}
