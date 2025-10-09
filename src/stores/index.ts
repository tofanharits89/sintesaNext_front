// Simplified Messaging Store
import {
  useMessagingStore,
  useActiveConversationId,
  useMessageInput,
  useTypingUsers,
  useMessagingConnection,
  useMessageActions,
  type MessagingClientState,
} from "./messaging-store";

// Individual stores
import { useTypingIndicatorsStore } from "./typing-indicators-store";
import { useUnreadBadgesStore } from "./unread-badges-store";
import { useNotificationStore } from "./notification-store";

export {
  useMessagingStore,
  useActiveConversationId,
  useMessageInput,
  useTypingUsers,
  useMessagingConnection,
  useMessageActions,
  type MessagingClientState,
};

// Re-export individual stores for compatibility
export {
  useTypingIndicatorsStore,
  useUnreadBadgesStore,
  useNotificationStore,
};

// Compatibility exports for legacy code
export const useMessagingUIStore = useMessagingStore;
export const useMessagingStores = useMessagingStore;
export const useConversationStores = useMessagingStore;

// Store actions (compatibility)
export const useMessagingActions = () => ({
  ui: useMessagingStore,
  unread: useUnreadBadgesStore,
  typing: useTypingIndicatorsStore,
  notification: useNotificationStore,
});

// Selectors (compatibility)
export const useUnreadCount = () => {
  const store = useUnreadBadgesStore();
  return store.unreadCounts;
};

export const useTotalUnreadCount = () => {
  const store = useUnreadBadgesStore();
  return store.totalUnreadCount;
};
