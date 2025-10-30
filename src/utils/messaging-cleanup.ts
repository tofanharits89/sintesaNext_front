"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMessagingStore } from "@/stores/messaging-store";
import { useTypingIndicatorsStore } from "@/stores/typing-indicators-store";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { useAuth } from "@/hooks/useAuth";

export async function clearAllMessagingState() {
  clearMessagingStores();
  // Clear temp stores if present (guarded dynamic import)
  try {
    const mod = await import("@/features/messaging/temp-messages-store");
    mod.clearAllTempMessages?.();
  } catch {}
}

export function clearMessagingStores() {
  try {
    const messaging = useMessagingStore.getState();
    messaging.setActiveConversation(null);
    messaging.clearMessageInput();
    messaging.setConnectionStatus(false);
    messaging.reset();

    const typing = useTypingIndicatorsStore.getState();
    typing.clearAllTyping?.();

    const unread = useUnreadBadgesStore.getState();
    unread.clearAllUnread?.();
  } catch {}
}

export function clearMessagingQueryCache(
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { keepUserId?: string | null },
) {
  const keepUserId = options?.keepUserId ?? null;
  const predicate = (q: any) => {
    const key = Array.isArray(q?.queryKey) ? q.queryKey : [];
    if (!key.length) return false;
    const [root, scope] = key as any[];
    const isMessaging = root === "messaging" || root === "messages" || root === "conversations";
    if (!isMessaging) return false;
    if (keepUserId == null) return true;
    return scope !== keepUserId;
  };
  try {
    queryClient.cancelQueries({ predicate });
    queryClient.removeQueries({ predicate });
    queryClient.invalidateQueries({ predicate });
  } catch {}
}

export function useMessagingCleanup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const cleanupMessaging = async () => {
    await clearAllMessagingState();
    clearMessagingQueryCache(queryClient, { keepUserId: user?.id ?? null });
  };

  return { cleanupMessaging };
}

