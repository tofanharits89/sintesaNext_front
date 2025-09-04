import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useMemo } from "react";

// Types for unread badge management
export interface UnreadInfo {
  count: number;
  lastMessageId: string | null;
  lastMessageTimestamp: string | null;
  hasUnreadMentions: boolean; // For future @mention functionality
  lastReadMessageId: string | null;
}

export interface UnreadBadgesState {
  // Map of conversationId -> unread info
  unreadCounts: Record<string, UnreadInfo>;

  // Total unread count across all conversations
  totalUnreadCount: number;

  // Conversations with unread messages (for quick access)
  conversationsWithUnread: Set<string>;

  // Last global read timestamp (for marking all as read)
  lastGlobalReadTimestamp: string | null;
}

export interface UnreadBadgesActions {
  // Set unread count for a conversation
  setUnreadCount: (
    conversationId: string,
    count: number,
    lastMessageId?: string,
    lastMessageTimestamp?: string
  ) => void;

  // Increment unread count for a conversation
  incrementUnreadCount: (
    conversationId: string,
    messageId: string,
    messageTimestamp: string,
    hasMention?: boolean
  ) => void;

  // Mark conversation as read (set count to 0)
  markConversationAsRead: (
    conversationId: string,
    lastReadMessageId?: string
  ) => void;

  // Mark all conversations as read
  markAllAsRead: () => void;

  // Set last read message for a conversation
  setLastReadMessage: (conversationId: string, messageId: string) => void;

  // Add mention flag to a conversation
  addMentionFlag: (conversationId: string) => void;

  // Clear mention flag for a conversation
  clearMentionFlag: (conversationId: string) => void;

  // Bulk update unread counts (merges into existing map)
  bulkUpdateUnreadCounts: (
    updates: Record<string, Partial<UnreadInfo>>
  ) => void;

  // Replace all unread counts (source of truth from server)
  replaceAllUnreadCounts: (
    updates: Record<string, Partial<UnreadInfo>>
  ) => void;

  // Remove conversation from unread tracking
  removeConversation: (conversationId: string) => void;

  // Clear all unread data
  clearAllUnread: () => void;

  // Get unread info for a conversation
  getUnreadInfo: (conversationId: string) => UnreadInfo;

  // Check if conversation has unread messages
  hasUnreadMessages: (conversationId: string) => boolean;

  // Get conversations sorted by unread priority
  getConversationsByUnreadPriority: () => string[];
}

// Default unread info
const defaultUnreadInfo: UnreadInfo = {
  count: 0,
  lastMessageId: null,
  lastMessageTimestamp: null,
  hasUnreadMentions: false,
  lastReadMessageId: null,
};

const initialState: UnreadBadgesState = {
  unreadCounts: {},
  totalUnreadCount: 0,
  conversationsWithUnread: new Set(),
  lastGlobalReadTimestamp: null,
};

// Helper function to calculate total unread count
const calculateTotalUnread = (
  unreadCounts: Record<string, UnreadInfo>
): number => {
  return Object.values(unreadCounts).reduce(
    (total, info) => total + info.count,
    0
  );
};

// Helper function to get conversations with unread messages
const getConversationsWithUnread = (
  unreadCounts: Record<string, UnreadInfo>
): Set<string> => {
  return new Set(
    Object.entries(unreadCounts)
      .filter(([_, info]) => info.count > 0)
      .map(([conversationId]) => conversationId)
  );
};

export const useUnreadBadgesStore = create<
  UnreadBadgesState & UnreadBadgesActions
>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUnreadCount: (
          conversationId,
          count,
          lastMessageId,
          lastMessageTimestamp
        ) => {
          set(
            (state) => {
              const updatedUnreadCounts = {
                ...state.unreadCounts,
                [conversationId]: {
                  ...(state.unreadCounts[conversationId] || defaultUnreadInfo),
                  count: Math.max(0, count), // Ensure count is never negative
                  ...(lastMessageId && { lastMessageId }),
                  ...(lastMessageTimestamp && { lastMessageTimestamp }),
                },
              };

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: calculateTotalUnread(updatedUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(updatedUnreadCounts),
              };
            },
            false,
            "setUnreadCount"
          );
        },

        incrementUnreadCount: (
          conversationId,
          messageId,
          messageTimestamp,
          hasMention = false
        ) => {
          set(
            (state) => {
              const currentInfo =
                state.unreadCounts[conversationId] || defaultUnreadInfo;
              const updatedUnreadCounts = {
                ...state.unreadCounts,
                [conversationId]: {
                  ...currentInfo,
                  count: currentInfo.count + 1,
                  lastMessageId: messageId,
                  lastMessageTimestamp: messageTimestamp,
                  hasUnreadMentions:
                    currentInfo.hasUnreadMentions || hasMention,
                },
              };

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: calculateTotalUnread(updatedUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(updatedUnreadCounts),
              };
            },
            false,
            "incrementUnreadCount"
          );
        },

        markConversationAsRead: (conversationId, lastReadMessageId) => {
          set(
            (state) => {
              const updatedUnreadCounts = {
                ...state.unreadCounts,
                [conversationId]: {
                  ...(state.unreadCounts[conversationId] || defaultUnreadInfo),
                  count: 0,
                  hasUnreadMentions: false,
                  ...(lastReadMessageId && { lastReadMessageId }),
                },
              };

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: calculateTotalUnread(updatedUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(updatedUnreadCounts),
              };
            },
            false,
            "markConversationAsRead"
          );
        },

        markAllAsRead: () => {
          set(
            (state) => {
              const updatedUnreadCounts = { ...state.unreadCounts };
              Object.keys(updatedUnreadCounts).forEach((conversationId) => {
                updatedUnreadCounts[conversationId] = {
                  ...updatedUnreadCounts[conversationId],
                  count: 0,
                  hasUnreadMentions: false,
                };
              });

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: 0,
                conversationsWithUnread: new Set(),
                lastGlobalReadTimestamp: new Date().toISOString(),
              };
            },
            false,
            "markAllAsRead"
          );
        },

        setLastReadMessage: (conversationId, messageId) => {
          set(
            (state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [conversationId]: {
                  ...(state.unreadCounts[conversationId] || defaultUnreadInfo),
                  lastReadMessageId: messageId,
                },
              },
            }),
            false,
            "setLastReadMessage"
          );
        },

        addMentionFlag: (conversationId) => {
          set(
            (state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [conversationId]: {
                  ...(state.unreadCounts[conversationId] || defaultUnreadInfo),
                  hasUnreadMentions: true,
                },
              },
            }),
            false,
            "addMentionFlag"
          );
        },

        clearMentionFlag: (conversationId) => {
          set(
            (state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [conversationId]: {
                  ...(state.unreadCounts[conversationId] || defaultUnreadInfo),
                  hasUnreadMentions: false,
                },
              },
            }),
            false,
            "clearMentionFlag"
          );
        },

        bulkUpdateUnreadCounts: (updates) => {
          set(
            (state) => {
              const updatedUnreadCounts = { ...state.unreadCounts };

              Object.entries(updates).forEach(
                ([conversationId, updateInfo]) => {
                  updatedUnreadCounts[conversationId] = {
                    ...(updatedUnreadCounts[conversationId] ||
                      defaultUnreadInfo),
                    ...updateInfo,
                  };
                }
              );

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: calculateTotalUnread(updatedUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(updatedUnreadCounts),
              };
            },
            false,
            "bulkUpdateUnreadCounts"
          );
        },

        replaceAllUnreadCounts: (updates) => {
          set(
            () => {
              const nextUnreadCounts: Record<string, UnreadInfo> = {};
              Object.entries(updates).forEach(
                ([conversationId, updateInfo]) => {
                  nextUnreadCounts[conversationId] = {
                    ...defaultUnreadInfo,
                    ...updateInfo,
                    count: Math.max(0, Number(updateInfo.count) || 0),
                  } as UnreadInfo;
                }
              );

              return {
                unreadCounts: nextUnreadCounts,
                totalUnreadCount: calculateTotalUnread(nextUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(nextUnreadCounts),
              };
            },
            false,
            "replaceAllUnreadCounts"
          );
        },

        removeConversation: (conversationId) => {
          set(
            (state) => {
              const updatedUnreadCounts = { ...state.unreadCounts };
              delete updatedUnreadCounts[conversationId];

              return {
                unreadCounts: updatedUnreadCounts,
                totalUnreadCount: calculateTotalUnread(updatedUnreadCounts),
                conversationsWithUnread:
                  getConversationsWithUnread(updatedUnreadCounts),
              };
            },
            false,
            "removeConversation"
          );
        },

        clearAllUnread: () => {
          set(
            {
              ...initialState,
              conversationsWithUnread: new Set(), // Reset the Set
            },
            false,
            "clearAllUnread"
          );
        },

        getUnreadInfo: (conversationId) => {
          const state = get();
          return state.unreadCounts[conversationId] || defaultUnreadInfo;
        },

        hasUnreadMessages: (conversationId) => {
          const state = get();
          return (state.unreadCounts[conversationId]?.count || 0) > 0;
        },

        getConversationsByUnreadPriority: () => {
          const state = get();

          // Sort conversations by:
          // 1. Mentions first (highest priority)
          // 2. Then by unread count (descending)
          // 3. Then by last message timestamp (most recent first)
          return Object.entries(state.unreadCounts)
            .filter(([_, info]) => info.count > 0)
            .sort(([, a], [, b]) => {
              // Mentions have highest priority
              if (a.hasUnreadMentions && !b.hasUnreadMentions) return -1;
              if (!a.hasUnreadMentions && b.hasUnreadMentions) return 1;

              // Then sort by unread count
              if (a.count !== b.count) return b.count - a.count;

              // Finally sort by timestamp (most recent first)
              if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
                return (
                  new Date(b.lastMessageTimestamp).getTime() -
                  new Date(a.lastMessageTimestamp).getTime()
                );
              }

              return 0;
            })
            .map(([conversationId]) => conversationId);
        },
      }),
      {
        name: "unread-badges-store",
        // Persist all unread data
        partialize: (state) => ({
          unreadCounts: state.unreadCounts,
          totalUnreadCount: state.totalUnreadCount,
          lastGlobalReadTimestamp: state.lastGlobalReadTimestamp,
          // Note: conversationsWithUnread will be recalculated on hydration
        }),
        // Rehydrate the Set after loading from storage
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.conversationsWithUnread = getConversationsWithUnread(
              state.unreadCounts
            );
          }
        },
      }
    ),
    { name: "UnreadBadges" }
  )
);

// Selectors for better performance
export const useUnreadCount = (conversationId: string) =>
  useUnreadBadgesStore(
    (state) => state.unreadCounts[conversationId]?.count || 0
  );

export const useUnreadInfo = (conversationId: string) =>
  useUnreadBadgesStore((state) => state.getUnreadInfo(conversationId));

export const useTotalUnreadCount = () =>
  useUnreadBadgesStore((state) => state.totalUnreadCount);

export const useHasUnreadMessages = (conversationId: string) =>
  useUnreadBadgesStore((state) => state.hasUnreadMessages(conversationId));

export const useConversationsWithUnread = () => {
  const setRef = useUnreadBadgesStore((state) => state.conversationsWithUnread);
  // Memoize the derived array so getServerSnapshot returns a stable value
  // across multiple reads within the same render.
  return useMemo(() => Array.from(setRef), [setRef]);
};

export const useUnreadActions = () => {
  const setUnreadCount = useUnreadBadgesStore((state) => state.setUnreadCount);
  const incrementUnreadCount = useUnreadBadgesStore(
    (state) => state.incrementUnreadCount
  );
  const markConversationAsRead = useUnreadBadgesStore(
    (state) => state.markConversationAsRead
  );
  const markAllAsRead = useUnreadBadgesStore((state) => state.markAllAsRead);
  const setLastReadMessage = useUnreadBadgesStore(
    (state) => state.setLastReadMessage
  );
  const addMentionFlag = useUnreadBadgesStore((state) => state.addMentionFlag);
  const clearMentionFlag = useUnreadBadgesStore(
    (state) => state.clearMentionFlag
  );
  const bulkUpdateUnreadCounts = useUnreadBadgesStore(
    (state) => state.bulkUpdateUnreadCounts
  );
  const removeConversation = useUnreadBadgesStore(
    (state) => state.removeConversation
  );
  const clearAllUnread = useUnreadBadgesStore((state) => state.clearAllUnread);

  return {
    setUnreadCount,
    incrementUnreadCount,
    markConversationAsRead,
    markAllAsRead,
    setLastReadMessage,
    addMentionFlag,
    clearMentionFlag,
    bulkUpdateUnreadCounts,
    removeConversation,
    clearAllUnread,
  };
};
