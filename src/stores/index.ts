// Messaging UI Store
import {
  useMessagingUIStore,
  useActiveConversationId,
  useMessageInput,
  useConversationState,
  useNewMessageDialog,
  useSearchState,
  useUIPreferences,
  useLoadingStates,
  type MessagingUIState,
  type MessagingUIActions,
  type MessageInputState,
  type ConversationUIState,
} from "./messaging-ui-store";

export {
  useMessagingUIStore,
  useActiveConversationId,
  useMessageInput,
  useConversationState,
  useNewMessageDialog,
  useSearchState,
  useUIPreferences,
  useLoadingStates,
  type MessagingUIState,
  type MessagingUIActions,
  type MessageInputState,
  type ConversationUIState,
};

// Typing Indicators Store
import {
  useTypingIndicatorsStore,
  useTypingUsers,
  useIsAnyoneTyping,
  useTypingText,
  useCurrentUserTyping,
  useTypingActions,
  type TypingIndicatorsState,
  type TypingIndicatorsActions,
  type TypingUser,
} from "./typing-indicators-store";

export {
  useTypingIndicatorsStore,
  useTypingUsers,
  useIsAnyoneTyping,
  useTypingText,
  useCurrentUserTyping,
  useTypingActions,
  type TypingIndicatorsState,
  type TypingIndicatorsActions,
  type TypingUser,
};

// Unread Badges Store
import {
  useUnreadBadgesStore,
  useUnreadCount,
  useUnreadInfo,
  useTotalUnreadCount,
  useHasUnreadMessages,
  useConversationsWithUnread,
  useUnreadActions,
  type UnreadBadgesState,
  type UnreadBadgesActions,
  type UnreadInfo,
} from "./unread-badges-store";

export {
  useUnreadBadgesStore,
  useUnreadCount,
  useUnreadInfo,
  useTotalUnreadCount,
  useHasUnreadMessages,
  useConversationsWithUnread,
  useUnreadActions,
  type UnreadBadgesState,
  type UnreadBadgesActions,
  type UnreadInfo,
};

// Notification Store
import {
  useNotificationStore,
  useNotifications,
  useUnreadNotificationCount,
  useNotificationSettings,
  useActiveToasts,
  useNotificationActions,
  type NotificationState,
  type NotificationActions,
  type NotificationItem,
  type NotificationSettings,
} from "./notification-store";

export {
  useNotificationStore,
  useNotifications,
  useUnreadNotificationCount,
  useNotificationSettings,
  useActiveToasts,
  useNotificationActions,
  type NotificationState,
  type NotificationActions,
  type NotificationItem,
  type NotificationSettings,
};

// Combined hooks for common use cases
export const useMessagingStores = () => {
  const activeConversationId = useActiveConversationId();
  const messageInput = useMessageInput();
  const loadingStates = useLoadingStates();
  const totalUnreadCount = useTotalUnreadCount();
  const conversationsWithUnread = useConversationsWithUnread();
  const unreadNotificationCount = useUnreadNotificationCount();
  const notificationSettings = useNotificationSettings();

  return {
    // UI State
    activeConversationId,
    messageInput,
    loadingStates,

    // Unread Management
    totalUnreadCount,
    conversationsWithUnread,

    // Notifications
    unreadNotificationCount,
    notificationSettings,
  };
};

// Hook for conversation-specific state
export const useConversationStores = (conversationId: string) => {
  const conversationState = useConversationState(conversationId);
  const typingUsers = useTypingUsers(conversationId);
  const isAnyoneTyping = useIsAnyoneTyping(conversationId);
  const typingText = useTypingText(conversationId);
  const currentUserTyping = useCurrentUserTyping(conversationId);
  const unreadCount = useUnreadCount(conversationId);
  const unreadInfo = useUnreadInfo(conversationId);
  const hasUnreadMessages = useHasUnreadMessages(conversationId);

  return {
    // UI State
    conversationState,

    // Typing Indicators
    typingUsers,
    isAnyoneTyping,
    typingText,
    currentUserTyping,

    // Unread State
    unreadCount,
    unreadInfo,
    hasUnreadMessages,
  };
};

// Hook for all store actions
export const useMessagingActions = () => {
  // UI Actions
  const setActiveConversation = useMessagingUIStore(
    (state) => state.setActiveConversation
  );
  const setMessageContent = useMessagingUIStore(
    (state) => state.setMessageContent
  );
  const setIsTyping = useMessagingUIStore((state) => state.setIsTyping);
  const clearMessageInput = useMessagingUIStore(
    (state) => state.clearMessageInput
  );
  const setNewMessageDialogOpen = useMessagingUIStore(
    (state) => state.setNewMessageDialogOpen
  );
  const setLoadingConversation = useMessagingUIStore(
    (state) => state.setLoadingConversation
  );
  const setSendingMessage = useMessagingUIStore(
    (state) => state.setSendingMessage
  );
  const resetConversationState = useMessagingUIStore(
    (state) => state.resetConversationState
  );

  // Other Actions
  const typing = useTypingActions();
  const unread = useUnreadActions();
  const notifications = useNotificationActions();

  return {
    ui: {
      setActiveConversation,
      setMessageContent,
      setIsTyping,
      clearMessageInput,
      setNewMessageDialogOpen,
      setLoadingConversation,
      setSendingMessage,
      resetConversationState,
    },
    typing,
    unread,
    notifications,
  };
};
