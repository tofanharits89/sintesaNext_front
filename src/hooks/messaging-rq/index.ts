// React Query Messaging Hooks - Phase 2 Implementation
// This directory contains the new React Query + Zustand + WebSocket messaging system

// Main comprehensive hook
export { useMessagingRQ, useConversationRQ } from '../useMessagingRQ';

// Data hooks (React Query)
export { useConversations, conversationKeys } from '../useConversationsRQ';
export { useMessages, messageKeys } from '../useMessagesRQ';

// Mutation hooks (React Query)
export { 
  useSendMessageMutation, 
  useMarkAsReadMutation, 
  useMarkAsOpenedMutation 
} from '../useMessageMutationsRQ';

// WebSocket integration
export { useMessagingSocketRQ } from '../useMessagingSocketRQ';

// Re-export Zustand stores for convenience
export {
  // Store hooks
  useMessagingStores,
  useConversationStores,
  useMessagingActions,
  
  // Individual store hooks
  useMessagingUIStore,
  useTypingIndicatorsStore,
  useUnreadBadgesStore,
  useNotificationStore,
  
  // Selectors
  useActiveConversationId,
  useMessageInput,
  useTypingUsers,
  useUnreadCount,
  useTotalUnreadCount,
  
  // Types
  type MessagingUIState,
  type MessagingUIActions,
  type TypingUser,
  type UnreadInfo,
  type NotificationItem,
} from '../../stores';

// Migration utilities and compatibility
export const MessagingRQMigration = {
  // Helper to check if new system is being used
  isUsingReactQuery: () => true,
  
  // Migration status
  phase: 'Phase 2 - React Query + Zustand + WebSocket' as const,
  
  // Feature flags for gradual rollout
  features: {
    reactQueryData: true,
    zustandUIState: true,
    websocketIntegration: true,
    optimisticUpdates: true,
    typingIndicators: true,
    unreadBadges: true,
    notifications: true,
  },
  
  // Performance monitoring
  getPerformanceMetrics: () => ({
    cacheHitRate: 'Available in React Query DevTools',
    storeUpdates: 'Available in Zustand DevTools',
    websocketLatency: 'Measured in WebSocket events',
  }),
};

// Development utilities
export const MessagingRQDevTools = {
  // Clear all caches
  clearAllCaches: () => {
    // No-op in production; call from a component with access to queryClient if needed
  },
  
  // Debug current state
  debugState: () => {
    // No-op to avoid console noise; use appropriate DevTools instead
  },
  
  // Performance tips
  performanceTips: [
    'Use selective subscriptions with Zustand selectors',
    'Leverage React Query staleTime for reduced refetches',
    'Use optimistic updates for better UX',
    'Monitor cache size with React Query DevTools',
    'Use WebSocket for real-time updates, React Query for persistence',
  ],
};

// Type exports for TypeScript users
export type {
  // Hook return types
  UseMessagingRQReturn,
  UseConversationRQReturn,
} from '../useMessagingRQ';

// Declare the return types (these would be inferred, but explicit for documentation)
declare module '../useMessagingRQ' {
  interface UseMessagingRQReturn {
    // Data
    conversations: any[] | undefined;
    messages: any[] | undefined;
    activeConversationId: string | null;
    
    // UI State
    messageInput: any;
    totalUnreadCount: number;
    conversationState: any;
    
    // Typing indicators
    typingUsers: any[];
    isAnyoneTyping: boolean;
    typingText: string;
    
    // Unread state
    unreadCount: number;
    hasUnreadMessages: boolean;
    
    // Loading states
    isLoading: boolean;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isFetchingMessages: boolean;
    isLoadingMoreMessages: boolean;
    isSendingMessage: boolean;
    isMarkingAsRead: boolean;
    
    // Connection state
    isSocketConnected: boolean;
    
    // Pagination
    hasNextPage: boolean | undefined;
    canLoadMore: boolean;
    
    // Actions
    selectConversation: (conversationId: string) => void;
    sendMessage: (content: string, recipientId?: string) => Promise<void>;
    markMessagesAsRead: (messageIds: string[]) => void;
    markMessagesAsOpened: (messageIds: string[]) => void;
    loadMoreMessages: () => void;
    startTyping: () => void;
    stopTyping: () => void;
    refreshData: () => void;
    
    // UI Actions
    setMessageContent: (content: string) => void;
    clearMessageInput: () => void;
    setNewMessageDialogOpen: (open: boolean) => void;
    
    // Error states
    error: any;
    sendError: any;
    
    // Advanced
    invalidateConversations: () => void;
    invalidateMessages: () => void;
    refetchConversations: () => void;
    refetchMessages: () => void;
  }
  
  interface UseConversationRQReturn {
    messages: any[] | undefined;
    isLoading: boolean;
    hasNextPage: boolean | undefined;
    fetchNextPage: () => void;
    conversationState: any;
    typingUsers: any[];
    isAnyoneTyping: boolean;
    typingText: string;
    currentUserTyping: boolean;
    unreadCount: number;
    unreadInfo: any;
    hasUnreadMessages: boolean;
    markAsRead: (messageIds: string[]) => void;
    markAsOpened: (messageIds: string[]) => void;
  }
}
