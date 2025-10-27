"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  tempId: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: string;
  status: "sending" | "sent" | "failed";
}

/**
 * Hook for managing optimistic message updates
 * Extracted from useMessageMutationsRQ.ts
 */
export function useOptimisticMessages() {
  const queryClient = useQueryClient();

  /**
   * Add a temporary message to the cache
   */
  const addTempMessage = useCallback(
    (tempMessage: Message) => {
      queryClient.setQueryData(
        ["messages", tempMessage.conversationId],
        (old: Message[] | undefined) => {
          if (!old) return [tempMessage];
          return [...old, tempMessage];
        }
      );
    },
    [queryClient]
  );

  /**
   * Update message status (sending -> sent/failed)
   */
  const updateMessageStatus = useCallback(
    (conversationId: string, tempId: string, status: Message["status"]) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: Message[] | undefined) => {
          if (!old) return [];

          return old.map((msg) => {
            if (msg.tempId === tempId || msg.id === tempId) {
              return { ...msg, status };
            }
            return msg;
          });
        }
      );
    },
    [queryClient]
  );

  /**
   * Replace temporary message with real message
   */
  const replaceTempMessage = useCallback(
    (conversationId: string, tempId: string, realMessage: Message) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: Message[] | undefined) => {
          if (!old) return [realMessage];

          return old.map((msg) => {
            if (msg.tempId === tempId) {
              return realMessage;
            }
            return msg;
          });
        }
      );
    },
    [queryClient]
  );

  /**
   * Remove failed message from cache
   */
  const removeFailedMessage = useCallback(
    (conversationId: string, tempId: string) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: Message[] | undefined) => {
          if (!old) return [];

          return old.filter((msg) => msg.tempId !== tempId);
        }
      );
    },
    [queryClient]
  );

  /**
   * Invalidate message queries
   */
  const invalidateMessages = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      }
    },
    [queryClient]
  );

  return {
    addTempMessage,
    updateMessageStatus,
    replaceTempMessage,
    removeFailedMessage,
    invalidateMessages,
  };
}
