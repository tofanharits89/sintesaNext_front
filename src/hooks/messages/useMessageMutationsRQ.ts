"use client";

import { useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { messageService } from "@/services/MessageService";
import { useOptimisticMessages } from "./useOptimisticMessages";

interface UseMessageMutationsProps {
  conversationId: string;
  currentUserId: string;
}

/**
 * Refactored hook for message mutations
 * Now separated into service layer (MessageService) and optimistic updates (useOptimisticMessages)
 *
 * Original file: 222 LOC with complex nested logic
 * Refactored: ~120 LOC with clear separation of concerns
 */
export function useMessageMutationsRQ({ conversationId, currentUserId }: UseMessageMutationsProps) {
  const {
    addTempMessage,
    updateMessageStatus,
    replaceTempMessage,
    removeFailedMessage,
    invalidateMessages,
  } = useOptimisticMessages();

  /**
   * Send message mutation
   */
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      // Generate temporary ID for optimistic updates
      const tempId = uuidv4();

      // Add optimistic message
      const tempMessage = {
        id: "",
        tempId,
        conversationId,
        content,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        status: "sending" as const,
      };

      addTempMessage(tempMessage);

      // Attempt to send the message
      const result = await messageService.sendMessage({
        conversationId,
        content,
        tempId,
        senderId: currentUserId,
      });

      if (result.success && result.message) {
        // Replace temp message with real message
        replaceTempMessage(conversationId, tempId, {
          ...result.message,
          tempId,
          status: "sent" as const,
        });
      } else {
        // Mark as failed
        updateMessageStatus(conversationId, tempId, "failed");
      }

      return result;
    },

    onError: (error) => {
      console.error("Failed to send message:", error);
    },

    onSuccess: () => {
      // Invalidate queries to refetch latest data
      invalidateMessages(conversationId);
    },
  });

  /**
   * Retry sending a failed message
   */
  const retryMessageMutation = useMutation({
    mutationFn: async ({ tempId }: { tempId: string }) => {
      return messageService.retryMessage(tempId);
    },

    onError: (error, variables) => {
      console.error("Failed to retry message:", error);
      updateMessageStatus(conversationId, variables.tempId, "failed");
    },

    onSuccess: (result, variables) => {
      if (result.success) {
        updateMessageStatus(conversationId, variables.tempId, "sent");
      }
    },
  });

  /**
   * Mark message as read
   */
  const markAsReadMutation = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      await messageService.markAsRead(messageId, currentUserId);
    },

    onSuccess: () => {
      invalidateMessages(conversationId);
    },
  });

  /**
   * Delete message
   */
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      await messageService.deleteMessage(messageId);
    },

    onSuccess: () => {
      invalidateMessages(conversationId);
    },
  });

  return {
    sendMessage: sendMessageMutation.mutate,
    retryMessage: retryMessageMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,

    // Status flags
    isSending: sendMessageMutation.isPending,
    isRetrying: retryMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,

    // Errors
    sendError: sendMessageMutation.error,
    retryError: retryMessageMutation.error,
    markAsReadError: markAsReadMutation.error,
    deleteError: deleteMessageMutation.error,
  };
}
