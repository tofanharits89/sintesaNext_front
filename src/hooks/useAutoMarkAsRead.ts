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
        trackers.set(convId, {
          conversationId: convId,
          lastMarkedAt: 0,
          markedMessageIds: new Set(),
          isMarking: false,
        });
      } else {
        // existing tracker present; nothing to log
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

      // cleared tracking; no debug log
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
      return;
    }

    const tracker = getConversationTracker(conversationId);

    // Prevent concurrent marking operations
    if (tracker.isMarking) {
      return;
    }

    // Find messages that are visible and not sent by current user (regardless of read status)
    const unopenedMessages = messages.filter((msg) => {
      const isNotFromCurrentUser = msg.sender.id !== currentUserId;
      const isVisible = visibleMessagesRef.current.has(msg.id);
      const notAlreadyMarked = !tracker.markedMessageIds.has(msg.id);
      const isNotOpened = !msg.isOpened; // Check if message is not opened yet

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
        const messageIds = fallbackUnopenedMessages.map((msg) => msg.id);
        await markAsOpened(messageIds);
        messageIds.forEach((id) => tracker.markedMessageIds.add(id));
        tracker.lastMarkedAt = now;
        return;
      }
      return;
    }

    // Temporarily disable cooldown for debugging
    // if (unopenedMessages.length > 0 && now - tracker.lastMarkedAt < 300) {
    //   console.log(
    //     "[useAutoMarkAsRead] Skipping: too soon since last mark (300ms cooldown)"
    //   );
    //   return;
    // }


    try {
      tracker.isMarking = true;

      const messageIds = unopenedMessages.map((msg) => msg.id);
      await markAsOpened(messageIds);

      // Track marked messages to prevent duplicate marking
      messageIds.forEach((id) => tracker.markedMessageIds.add(id));
      tracker.lastMarkedAt = now;
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
