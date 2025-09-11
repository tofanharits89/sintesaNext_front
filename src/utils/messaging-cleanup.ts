/**
 * Messaging system cleanup utilities
 * Handles clearing all messaging-related state when users log out or switch
 */

import { useQueryClient } from "@tanstack/react-query";
import { useMessagingUIStore } from "@/stores/messaging-ui-store";
import { useTypingIndicatorsStore } from "@/stores/typing-indicators-store";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { clearAllTempMessages } from "@/features/messaging/temp-messages-store";
import { messageQueue } from "@/services/messageQueue";

/**
 * Clear all messaging-related state
 * Call this when user logs out or switches accounts
 */
export async function clearAllMessagingState() {
  try {
    // Clear Zustand stores
    clearMessagingStores();
    
    // Clear temporary messages
    clearAllTempMessages();
    
    // Clear message queue
    await messageQueue.clearAllMessages();
    
    console.log("[Messaging Cleanup] All messaging state cleared");
  } catch (error) {
    console.error("[Messaging Cleanup] Error clearing messaging state:", error);
  }
}

/**
 * Clear all Zustand messaging stores
 */
export function clearMessagingStores() {
  try {
    // Clear messaging UI store
    const messagingUIStore = useMessagingUIStore.getState();
    messagingUIStore.setActiveConversation(null);
    messagingUIStore.clearMessageInput();
    messagingUIStore.setNewMessageDialogOpen(false);
    messagingUIStore.setSelectedRecipient(null);
    messagingUIStore.setSearchQuery("");
    messagingUIStore.setFilteredConversations([]);
    messagingUIStore.setLoadingConversation(false);
    messagingUIStore.setSendingMessage(false);
    
    // Reset all conversation states
    const conversationStates = messagingUIStore.conversationStates;
    Object.keys(conversationStates).forEach(conversationId => {
      messagingUIStore.resetConversationState(conversationId);
    });
    
    // Clear typing indicators store
    const typingStore = useTypingIndicatorsStore.getState();
    typingStore.clearAllTyping();
    
    // Clear unread badges store
    const unreadStore = useUnreadBadgesStore.getState();
    unreadStore.clearAllUnread();
    
    console.log("[Messaging Cleanup] Zustand stores cleared");
  } catch (error) {
    console.error("[Messaging Cleanup] Error clearing Zustand stores:", error);
  }
}

/**
 * Clear React Query messaging cache
 * This should be called from a component that has access to QueryClient
 */
export function clearMessagingQueryCache(queryClient: ReturnType<typeof useQueryClient>) {
  try {
    // Clear all messaging-related queries using the correct query keys
    queryClient.removeQueries({ queryKey: ['conversations'] });
    queryClient.removeQueries({ queryKey: ['messages'] });
    
    // Cancel any ongoing queries
    queryClient.cancelQueries({ queryKey: ['conversations'] });
    queryClient.cancelQueries({ queryKey: ['messages'] });
    
    // Clear all query data to ensure fresh start
    queryClient.clear();
    
    console.log("[Messaging Cleanup] React Query cache cleared");
  } catch (error) {
    console.error("[Messaging Cleanup] Error clearing React Query cache:", error);
  }
}

/**
 * Hook to handle messaging cleanup on auth events
 * Use this in a component that has access to QueryClient
 */
export function useMessagingCleanup() {
  const queryClient = useQueryClient();
  
  const cleanupMessaging = async () => {
    await clearAllMessagingState();
    clearMessagingQueryCache(queryClient);
  };
  
  return { cleanupMessaging };
}