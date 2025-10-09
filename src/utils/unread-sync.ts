/**
 * Unread Count Synchronization Utility
 * Handles reliable synchronization of unread counts between server and client
 */

import { useUnreadBadgesStore } from '@/stores/unread-badges-store';
import { useMessagingStore } from '@/stores/messaging-store';

export interface UnreadSyncData {
  conversationId: string;
  count: number;
  lastMessageId?: string | null;
  lastMessageTimestamp?: string | null;
}

/**
 * Synchronize unread counts with proper conflict resolution
 * @param updates - Array of unread count updates from server
 * @param options - Sync options
 */
export function syncUnreadCounts(
  updates: UnreadSyncData[],
  options: {
    preserveActiveConversation?: boolean;
    source?: 'api' | 'socket' | 'manual';
  } = {}
) {
  const { preserveActiveConversation = true, source = 'api' } = options;
  
  const unreadStore = useUnreadBadgesStore.getState();
  const messagingStore = useMessagingStore.getState();
  const activeConversationId = messagingStore.activeConversationId;

  const syncUpdates: Record<string, any> = {};

  updates.forEach(({ conversationId, count, lastMessageId, lastMessageTimestamp }) => {
    const serverCount = Math.max(0, count || 0);
    const currentInfo = unreadStore.unreadCounts[conversationId];
    const currentCount = Math.max(0, currentInfo?.count || 0);
    const lastReadId = currentInfo?.lastReadMessageId || null;

    // Conflict resolution logic
    let effectiveCount = serverCount;

    // If user has read the last message locally, trust local state
    if (lastReadId && lastMessageId && lastReadId === lastMessageId) {
      effectiveCount = 0;
    }
    // For active conversation, be conservative to prevent badge bouncing
    else if (preserveActiveConversation && conversationId === activeConversationId) {
      // Use minimum of current and server count to avoid sudden increases
      effectiveCount = Math.min(currentCount, serverCount);
    }
    // For socket updates, be more aggressive in updating counts
    else if (source === 'socket') {
      effectiveCount = serverCount;
    }

    syncUpdates[conversationId] = {
      count: effectiveCount,
      lastMessageId: lastMessageId || currentInfo?.lastMessageId || null,
      lastMessageTimestamp: lastMessageTimestamp || currentInfo?.lastMessageTimestamp || null,
    };
  });

  // Apply updates atomically
  unreadStore.bulkUpdateUnreadCounts(syncUpdates);

  return syncUpdates;
}

/**
 * Handle unread count changes from socket events
 * @param event - Socket event data
 */
export function handleSocketUnreadUpdate(event: {
  conversationId: string;
  userId: string;
  messageIds?: string[];
  type: 'increment' | 'decrement' | 'reset';
  count?: number;
}) {
  const { conversationId, userId, messageIds = [], type, count } = event;
  
  // Only process events for current user
  // Note: This should be validated by the caller with current user ID
  
  const unreadStore = useUnreadBadgesStore.getState();
  const currentInfo = unreadStore.unreadCounts[conversationId];
  const currentCount = Math.max(0, currentInfo?.count || 0);

  let newCount = currentCount;

  switch (type) {
    case 'increment':
      newCount = currentCount + (count || messageIds.length || 1);
      break;
    case 'decrement':
      newCount = Math.max(0, currentCount - (count || messageIds.length || 1));
      break;
    case 'reset':
      newCount = 0;
      break;
  }

  unreadStore.setUnreadCount(conversationId, newCount);
}

/**
 * Mark conversation as read locally (optimistic update)
 * @param conversationId - Conversation ID
 * @param lastReadMessageId - ID of the last read message
 */
export function markConversationAsReadLocally(
  conversationId: string,
  lastReadMessageId?: string
) {
  const unreadStore = useUnreadBadgesStore.getState();
  
  unreadStore.markConversationAsRead(conversationId, lastReadMessageId);
  
  // Also update the last read message ID for conflict resolution
  if (lastReadMessageId) {
    unreadStore.setLastReadMessage(conversationId, lastReadMessageId);
  }
}

/**
 * Increment unread count locally (for incoming messages)
 * @param conversationId - Conversation ID
 * @param messageId - Message ID
 * @param messageTimestamp - Message timestamp
 * @param hasMention - Whether the message mentions the user
 */
export function incrementUnreadCountLocally(
  conversationId: string,
  messageId: string,
  messageTimestamp: string,
  hasMention = false
) {
  const unreadStore = useUnreadBadgesStore.getState();
  
  unreadStore.incrementUnreadCount(
    conversationId,
    messageId,
    messageTimestamp,
    hasMention
  );
}

/**
 * Validate and sanitize unread count data
 * @param data - Raw unread count data
 * @returns Sanitized data
 */
export function sanitizeUnreadData(data: any): UnreadSyncData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const conversationId = String(data.conversationId || data.conversation_id || '').trim();
  if (!conversationId) {
    return null;
  }

  const count = Math.max(0, parseInt(String(data.count || data.unread_count || 0), 10) || 0);
  const lastMessageId = data.lastMessageId || data.last_message_id || null;
  const lastMessageTimestamp = data.lastMessageTimestamp || data.last_message_timestamp || null;

  return {
    conversationId,
    count,
    lastMessageId: lastMessageId ? String(lastMessageId) : null,
    lastMessageTimestamp: lastMessageTimestamp ? String(lastMessageTimestamp) : null,
  };
}

/**
 * Debounced sync function to prevent rapid updates
 */
let syncTimeout: NodeJS.Timeout | null = null;

export function debouncedSyncUnreadCounts(
  updates: UnreadSyncData[],
  options: Parameters<typeof syncUnreadCounts>[1] = {},
  delay = 100
) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncUnreadCounts(updates, options);
    syncTimeout = null;
  }, delay);
}

/**
 * Get current unread counts for debugging/validation
 */
export function getCurrentUnreadState() {
  const unreadStore = useUnreadBadgesStore.getState();
  
  return {
    totalUnreadCount: unreadStore.totalUnreadCount,
    conversationsWithUnread: Array.from(unreadStore.conversationsWithUnread),
    unreadCounts: { ...unreadStore.unreadCounts },
  };
}