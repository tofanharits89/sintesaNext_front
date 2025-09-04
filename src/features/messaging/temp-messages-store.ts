// Shared in-memory store for messages of temporary conversations (non-fetchable)
// This allows multiple components/hooks to see the same optimistic/socket messages.

import type { FrontendMessage } from '@/shared/socket-events';

type TempMessagesStore = Map<string, FrontendMessage[]>; // key: conversationId

function getGlobal(): any {
  return globalThis as any;
}

function getStore(): TempMessagesStore {
  const g = getGlobal();
  if (!g.__tempMessagesStore) {
    g.__tempMessagesStore = new Map<string, FrontendMessage[]>();
  }
  return g.__tempMessagesStore as TempMessagesStore;
}

export function getTempMessages(conversationId: string): FrontendMessage[] {
  if (!conversationId) return [];
  const store = getStore();
  const list = store.get(conversationId) || [];
  // return a copy to avoid external mutation
  return [...list];
}

export function setTempMessages(conversationId: string, messages: FrontendMessage[]): void {
  if (!conversationId) return;
  const store = getStore();
  store.set(conversationId, [...messages]);
  emitTempMessagesUpdated(conversationId);
}

export function pushTempMessage(conversationId: string, message: FrontendMessage): void {
  if (!conversationId) return;
  const store = getStore();
  const list = store.get(conversationId) || [];
  list.push(message);
  store.set(conversationId, list);
  emitTempMessagesUpdated(conversationId);
}

export function removeTempMessageById(conversationId: string, messageId: string): void {
  if (!conversationId) return;
  const store = getStore();
  const list = store.get(conversationId) || [];
  const filtered = list.filter((m) => m.id !== messageId);
  store.set(conversationId, filtered);
  emitTempMessagesUpdated(conversationId);
}

export function reconcileTempMessageId(conversationId: string, tempId: string, realId: string): void {
  if (!conversationId) return;
  const store = getStore();
  const list = store.get(conversationId) || [];
  const idx = list.findIndex((m) => m.id === tempId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], id: realId };
    store.set(conversationId, list);
    emitTempMessagesUpdated(conversationId);
  }
}

export function emitTempMessagesUpdated(conversationId: string) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tempMessages:updated', { detail: { conversationId } })
      );
    }
  } catch {}
}
