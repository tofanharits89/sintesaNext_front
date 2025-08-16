import { useRef, useCallback, useEffect } from "react";
import { FrontendMessage } from "@/shared/socket-events";

interface UseAutoMarkAsReadOptions {
  messages: FrontendMessage[];
  currentUserId?: string;
  conversationId?: string;
  markAsRead: (messageIds: string[]) => Promise<void>;
  markAsOpened: (messageIds: string[]) => Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
  onMessageVisible?: (messageId: string) => void;
}

interface ConversationTracker {
  conversationId: string;
  lastMarkedAt: number;
  markedMessageIds: Set<string>;
  isMarking: boolean;
}

export function useAutoMarkAsRead({
  messages,
  currentUserId,
  conversationId,
  markAsRead,
  markAsOpened,
  enabled = true,
  debounceMs = 2500, // 2.5 second delay
  onMessageVisible,
}: UseAutoMarkAsReadOptions) {
  const conversationTrackerRef = useRef<Map<string, ConversationTracker>>(
    new Map()
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const visibleMessagesRef = useRef<Set<string>>(new Set());

  // Initialize intersection observer for message visibility
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute("data-message-id");
          if (messageId) {
            console.log(
              `[useAutoMarkAsRead] Message ${messageId} visibility:`,
              entry.isIntersecting
            );
            if (entry.isIntersecting) {
              visibleMessagesRef.current.add(messageId);
              // Trigger the visibility callback for immediate UI update
              if (onMessageVisible) {
                onMessageVisible(messageId);
              }
            } else {
              visibleMessagesRef.current.delete(messageId);
            }
          }
        });

        console.log(
          `[useAutoMarkAsRead] Visible messages:`,
          Array.from(visibleMessagesRef.current)
        );
      },
      {
        threshold: 0.3, // Message must be 30% visible (reduced threshold)
        rootMargin: "0px 0px -20px 0px", // Reduced margin
      }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [enabled]);

  // Function to observe message elements
  const observeMessage = useCallback(
    (element: HTMLElement | null, messageId: string) => {
      if (!element || !intersectionObserverRef.current) return;

      element.setAttribute("data-message-id", messageId);
      intersectionObserverRef.current.observe(element);

      return () => {
        if (intersectionObserverRef.current) {
          intersectionObserverRef.current.unobserve(element);
        }
      };
    },
    []
  );

  // Get or create conversation tracker
  const getConversationTracker = useCallback(
    (convId: string): ConversationTracker => {
      const trackers = conversationTrackerRef.current;

      if (!trackers.has(convId)) {
        console.log(
          `[useAutoMarkAsRead] 🚨 DEBUG: Creating new tracker for conversation ${convId}`
        );
        trackers.set(convId, {
          conversationId: convId,
          lastMarkedAt: 0,
          markedMessageIds: new Set(),
          isMarking: false,
        });
      } else {
        const tracker = trackers.get(convId)!;
        console.log(
          `[useAutoMarkAsRead] 🚨 DEBUG: Using existing tracker for conversation ${convId}, markedMessageIds:`,
          Array.from(tracker.markedMessageIds)
        );
      }

      return trackers.get(convId)!;
    },
    []
  );

  // Clear tracking state for specific messages (called when messages are marked as read via socket)
  const clearMarkedMessages = useCallback(
    (messageIds: string[], convId?: string) => {
      const targetConversationId = convId || conversationId;
      if (!targetConversationId) return;

      const tracker = getConversationTracker(targetConversationId);
      messageIds.forEach((id) => tracker.markedMessageIds.delete(id));

      console.log(
        `[useAutoMarkAsRead] Cleared tracking for ${messageIds.length} messages in conversation ${targetConversationId}`
      );
    },
    [conversationId, getConversationTracker]
  );

  // Main auto-mark function with all safeguards
  const performAutoMarkAsRead = useCallback(async () => {
    if (
      !enabled ||
      !conversationId ||
      !currentUserId ||
      messages.length === 0
    ) {
      console.log("[useAutoMarkAsRead] Skipping: disabled or missing data");
      return;
    }

    const tracker = getConversationTracker(conversationId);

    // Prevent concurrent marking operations
    if (tracker.isMarking) {
      console.log("[useAutoMarkAsRead] Skipping: marking already in progress");
      return;
    }

    // Find messages that are visible and not sent by current user (regardless of read status)
    const unopenedMessages = messages.filter((msg) => {
      const isNotFromCurrentUser = msg.sender.id !== currentUserId;
      const isVisible = visibleMessagesRef.current.has(msg.id);
      const notAlreadyMarked = !tracker.markedMessageIds.has(msg.id);
      const isNotOpened = !msg.isOpened; // Check if message is not opened yet

      console.log(`[useAutoMarkAsRead] Message ${msg.id}:`, {
        isNotFromCurrentUser,
        isVisible,
        notAlreadyMarked,
        isNotOpened,
        senderId: msg.sender.id,
        currentUserId,
      });

      return (
        isNotFromCurrentUser && isVisible && notAlreadyMarked && isNotOpened
      );
    });

    // Prevent marking too frequently (minimum 1 second between marks, only if no new messages)
    const now = Date.now();

    // Fallback: If no messages are detected as visible but we have unopened messages from others,
    // mark them as opened anyway (user opened the conversation)
    if (unopenedMessages.length === 0) {
      const fallbackUnopenedMessages = messages.filter((msg) => {
        const isNotOpened = !msg.isOpened;
        const isNotFromCurrentUser = msg.sender.id !== currentUserId;
        const notAlreadyMarked = !tracker.markedMessageIds.has(msg.id);

        return isNotOpened && isNotFromCurrentUser && notAlreadyMarked;
      });

      if (fallbackUnopenedMessages.length > 0) {
        console.log(
          "[useAutoMarkAsRead] Using fallback: marking all unopened messages from others as opened"
        );
        const messageIds = fallbackUnopenedMessages.map((msg) => msg.id);
        await markAsOpened(messageIds);
        messageIds.forEach((id) => tracker.markedMessageIds.add(id));
        tracker.lastMarkedAt = now;
        return;
      }

      console.log("[useAutoMarkAsRead] No unopened visible messages to mark");
      return;
    }

    // Temporarily disable cooldown for debugging
    // if (unopenedMessages.length > 0 && now - tracker.lastMarkedAt < 300) {
    //   console.log(
    //     "[useAutoMarkAsRead] Skipping: too soon since last mark (300ms cooldown)"
    //   );
    //   return;
    // }

    console.log(
      `[useAutoMarkAsRead] Marking ${unopenedMessages.length} messages as opened:`,
      unopenedMessages.map((m) => m.id)
    );

    console.log(
      `[useAutoMarkAsRead] 🚨 DEBUG: markedMessageIds set:`,
      Array.from(tracker.markedMessageIds)
    );

    try {
      tracker.isMarking = true;

      const messageIds = unopenedMessages.map((msg) => msg.id);
      await markAsOpened(messageIds);

      // Track marked messages to prevent duplicate marking
      console.log(
        `[useAutoMarkAsRead] 🚨 DEBUG: Adding to markedMessageIds:`,
        messageIds
      );
      messageIds.forEach((id) => tracker.markedMessageIds.add(id));
      tracker.lastMarkedAt = now;

      console.log("[useAutoMarkAsRead] Successfully marked messages as opened");
    } catch (error) {
      console.error(
        "[useAutoMarkAsRead] Failed to mark messages as opened:",
        error
      );
    } finally {
      tracker.isMarking = false;
    }
  }, [
    enabled,
    conversationId,
    currentUserId,
    messages,
    markAsRead,
    markAsOpened,
    getConversationTracker,
  ]);

  // Debounced trigger for auto-mark
  const triggerAutoMarkAsRead = useCallback(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performAutoMarkAsRead();
    }, debounceMs);
  }, [enabled, debounceMs, performAutoMarkAsRead]);

  // Effect to trigger auto-mark when messages or conversation changes
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log(
      "[useAutoMarkAsRead] Messages or conversation changed, scheduling auto-mark"
    );

    // Add a small delay to ensure DOM is updated and intersection observer can work
    const timer = setTimeout(() => {
      triggerAutoMarkAsRead();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, conversationId, messages.length, triggerAutoMarkAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Listen for messages marked as read via socket events
  useEffect(() => {
    const handleMessagesMarkedAsRead = (event: CustomEvent) => {
      const { messageIds, conversationId: eventConversationId } = event.detail;
      clearMarkedMessages(messageIds, eventConversationId);
    };

    window.addEventListener(
      "messages:marked-as-read",
      handleMessagesMarkedAsRead as EventListener
    );

    return () => {
      window.removeEventListener(
        "messages:marked-as-read",
        handleMessagesMarkedAsRead as EventListener
      );
    };
  }, [clearMarkedMessages]);

  return {
    observeMessage,
    triggerAutoMarkAsRead,
    clearMarkedMessages,
  };
}
