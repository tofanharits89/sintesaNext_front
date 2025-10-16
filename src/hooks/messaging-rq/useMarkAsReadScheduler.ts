"use client";

import { useEffect, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

interface SchedulerOptions {
  activeConversationId?: string | null;
  unreadIds: string[];
  idsKey: string;
  mutation: Pick<UseMutationResult<any, any, { messageIds: string[] }>, "mutate" | "isPending">;
}

/**
 * Handles throttled auto mark-as-read submissions for the active conversation.
 * Extracted from useMessagingRQ to keep the main hook focused on data wiring.
 */
export function useMarkAsReadScheduler({
  activeConversationId,
  unreadIds,
  idsKey,
  mutation,
}: SchedulerOptions) {
  const { mutate, isPending } = mutation;
  const lastSubmittedRef = useRef<{ conversationId: string; idsKey: string } | null>(null);
  const lastMarkAtRef = useRef<number>(0);

  useEffect(() => {
    if (!activeConversationId || !idsKey || unreadIds.length === 0) return;
    if (isPending) return;

    if (typeof document !== "undefined") {
      if (document.visibilityState !== "visible") return;
      if (typeof (document as any).hasFocus === "function" && !(document as any).hasFocus()) {
        return;
      }
    }

    if (
      lastSubmittedRef.current &&
      lastSubmittedRef.current.conversationId === activeConversationId &&
      lastSubmittedRef.current.idsKey === idsKey
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastMarkAtRef.current < 1200) {
      return;
    }

    const timer = setTimeout(() => {
      if (!activeConversationId || !idsKey || unreadIds.length === 0) return;
      if (isPending) return;

      lastSubmittedRef.current = { conversationId: activeConversationId, idsKey };
      lastMarkAtRef.current = Date.now();
      mutate({ messageIds: unreadIds });
    }, 800);

    return () => clearTimeout(timer);
  }, [activeConversationId, idsKey, unreadIds, isPending, mutate]);
}
