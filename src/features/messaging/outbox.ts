/*
 Simple localStorage-backed outbox for unsent messages.
 Persist small payloads and flush on reconnect. Not suitable for large attachments.
*/

export type OutboxItem = {
  tempId: string;
  conversationId: string;
  content: string;
  createdAt: string; // ISO
};

const KEY = "messaging:outbox:v1";

function readStore(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStore(items: OutboxItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function enqueue(item: OutboxItem) {
  const items = readStore();
  // avoid duplicates by tempId
  if (!items.find((x) => x.tempId === item.tempId)) {
    items.push(item);
    writeStore(items);
  }
}

export function remove(tempId: string) {
  const items = readStore().filter((x) => x.tempId !== tempId);
  writeStore(items);
}

export function all(): OutboxItem[] {
  return readStore();
}

export async function flush(
  sender: (item: OutboxItem) => Promise<boolean>,
  opts: { maxAttempts?: number; delayMs?: number } = {}
) {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.delayMs ?? 500;

  let items = readStore();
  for (const item of items) {
    let ok = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        ok = await sender(item);
        if (ok) break;
      } catch {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, baseDelay * attempt));
    }
    if (ok) remove(item.tempId);
  }
}
