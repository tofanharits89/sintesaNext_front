// Best-effort in-memory auth validation cache for middleware and routes
// Edge/runtime isolates are stateless; this only helps on warm isolates and must be short-lived.

export type AuthCacheEntry = { valid: boolean; user?: any; expiresAt: number };

const DEFAULT_TTL_MS = process.env.NODE_ENV === 'production' ? 10_000 : 3_000;

// Non-crypto fast hash to avoid storing raw tokens
export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const cache = new Map<string, AuthCacheEntry>();

export function getAuthCache(key: string): AuthCacheEntry | undefined {
  const e = cache.get(key);
  if (!e) return;
  if (Date.now() > e.expiresAt) { cache.delete(key); return; }
  return e;
}
export function setAuthCache(key: string, data: Omit<AuthCacheEntry, 'expiresAt'>, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { ...data, expiresAt: Date.now() + Math.max(500, ttlMs) });
}

export function invalidateAuthCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}
