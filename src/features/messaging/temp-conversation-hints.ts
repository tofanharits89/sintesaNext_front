// Simple in-memory hints for temp conversations so UI can resolve otherParticipant immediately
// Not persisted; cleared on page reload. Safe for optimistic UX.

export type TempConversationHint = {
  otherParticipant?: any;
  participant1_id?: string;
  participant2_id?: string;
  participant1?: any;
  participant2?: any;
  lastMessage?: any;
  updated_at?: string;
};

// Use a window-scoped singleton to survive HMR and ensure a single shared store
function getStore(): Map<string, TempConversationHint> {
  const g = globalThis as any;
  if (!g.__tempConvHints) {
    g.__tempConvHints = new Map<string, TempConversationHint>();
  }
  return g.__tempConvHints as Map<string, TempConversationHint>;
}

export function setHint(
  tempConversationId: string,
  hint: TempConversationHint
) {
  if (!tempConversationId) return;
  const store = getStore();
  store.set(tempConversationId, { ...hint });
}

export function getHint(
  conversationId: string
): TempConversationHint | undefined {
  if (!conversationId) return undefined;
  const store = getStore();
  return store.get(conversationId);
}

export function clearHint(conversationId: string) {
  const store = getStore();
  store.delete(conversationId);
}
