/**
 * Messaging system cleanup utilities
 * Handles clearing all messaging-related state when users log out or switch
 */

import { useQueryClient } from "@tanstack/react-query";
import { useMessagingStore } from "@/stores/messaging-store";
import { useTypingIndicatorsStore } from "@/stores/typing-indicators-store";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { clearAllTempMessages } from "@/features/messaging/temp-messages-store";
import { messageQueue } from "@/services/messageQueue";
import logger from "@/lib/utils/logger";
import { useUnifiedAuth } from "@/lib/auth";

/**
 * Clear all messaging-related state
 * Call this when user logs out or switches accounts
 */
export async function clearAllMessagingState() {
  try {
    // CRITICAL FIX: Clear all messaging-related components aggressively

    // 1. Clear Zustand stores first
    clearMessagingStores();

    // 2. Clear temporary messages
    clearAllTempMessages();

    // 3. Clear message queue and stop any queued operations
    await messageQueue.clearAllMessages();

    // 4. CRITICAL FIX: Clear any persistent storage that might trigger reconnections
    if (typeof window !== 'undefined') {
      // Clear any messaging-related localStorage/sessionStorage that might cause reconnections
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('messaging') || key.includes('conversation') || key.includes('message'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage messaging data
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('messaging') || key.includes('conversation') || key.includes('message'))) {
          sessionStorage.removeItem(key);
        }
      }
    }

    // 5. CRITICAL FIX: Force disconnect any remaining socket connections
    try {
      const { socketClient } = await import("@/lib/api/socket-client");
      if (socketClient.isConnected()) {
        socketClient.disconnect();
        logger.info("Socket disconnected during messaging cleanup");
      }
    } catch (socketError) {
      logger.warn("Failed to disconnect socket during messaging cleanup", socketError);
    }

    logger.info("All messaging state cleared (enhanced)");
  } catch (error) {
    logger.error("Error clearing messaging state", error);
  }
}

/**
 * Clear all Zustand messaging stores
 */
export function clearMessagingStores() {
  try {
    // Clear messaging store
    const messagingStore = useMessagingStore.getState();
    messagingStore.setActiveConversation(null);
    messagingStore.clearMessageInput();
    messagingStore.setConnectionStatus(false);
    messagingStore.reset(); // Reset all state to initial values

    // Clear typing indicators store
    const typingStore = useTypingIndicatorsStore.getState();
    typingStore.clearAllTyping();

    // Clear unread badges store
    const unreadStore = useUnreadBadgesStore.getState();
    unreadStore.clearAllUnread();

    logger.info("Zustand stores cleared");
  } catch (error) {
    logger.error("Error clearing Zustand stores", error);
  }
}

/**
 * Clear React Query messaging cache
 * This should be called from a component that has access to QueryClient
 */
export function clearMessagingQueryCache(
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { keepUserId?: string | null }
) {
  try {
    const keepUserId = options?.keepUserId ?? null;
    const anonymousScope = 'anonymous';

    const shouldInspect = (key: unknown[]): boolean => {
      if (!key.length) return false;
      const root = key[0];
      return root === 'messaging' || root === 'messages' || root === 'conversations';
    };

    const belongsToKeptUser = (key: unknown[]): boolean => {
      if (keepUserId == null) return false;
      const scope = typeof key[1] === 'string' ? key[1] : anonymousScope;
      if (key[0] === 'messaging') {
        return scope === keepUserId;
      }
      if (key[0] === 'messages' || key[0] === 'conversations') {
        return scope === keepUserId;
      }
      return false;
    };

    const predicate = (query: any) => {
      const key = Array.isArray(query?.queryKey) ? query.queryKey : [];
      if (!shouldInspect(key)) return false;
      if (keepUserId == null) return true;
      return !belongsToKeptUser(key);
    };

    queryClient.cancelQueries({ predicate });
    queryClient.removeQueries({ predicate });
    queryClient.invalidateQueries({ predicate });

    logger.info('Targeted messaging queries cleared');
  } catch (error) {
    logger.error('Error clearing React Query cache', error);
  }
}

/**
 * Hook to handle messaging cleanup on auth events
 * Use this in a component that has access to QueryClient
 */
export function useMessagingCleanup() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUnifiedAuth();
  
  const cleanupMessaging = async () => {
    await clearAllMessagingState();
    clearMessagingQueryCache(queryClient, { keepUserId: currentUser?.id ?? null });
  };
  
  return { cleanupMessaging };
}
