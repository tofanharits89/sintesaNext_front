export type IpBlockParams = { duration: string; blockedAt: string; reason: string };
export type IpBlockResult = { ipBlocked: boolean; params?: IpBlockParams };

function toNum(v: any): number | undefined {
  return typeof v === "number" ? v : undefined;
}

function unwrap(payload: any): any {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    typeof (payload as any).data === "object"
  ) {
    return (payload as any).data;
  }
  return payload;
}

export function detectIpBlock(payload: any): IpBlockResult {
  const p = unwrap(payload);
  const code = p?.code ?? p?.error?.code;
  const err = typeof p?.error === "string" ? p.error.toLowerCase() : "";

  const ipBlocked = code === "IP_BLOCKED" || err.includes("blocked") || err.includes("suspicious activity");
  if (!ipBlocked) return { ipBlocked: false };

  const expiresIn = toNum(p?.expiresIn) ?? 3600;
  const expiresAt = toNum(p?.expiresAt);
  const blockedAt = toNum(p?.blockedAt);
  const DEFAULT_MS = 3600 * 1000;

  let finalBlockedAt: number;
  let finalDurationSec = 3600;

  if (blockedAt && expiresAt) {
    finalBlockedAt = blockedAt;
    finalDurationSec = Math.max(1, Math.ceil((expiresAt - blockedAt) / 1000));
  } else if (expiresAt) {
    finalBlockedAt = expiresAt - DEFAULT_MS;
    finalDurationSec = Math.ceil(DEFAULT_MS / 1000);
  } else {
    finalBlockedAt = Date.now() - ((3600 - expiresIn) * 1000);
  }

  const reason = p?.blockReason || (typeof p?.error === "string" ? p.error : "Access temporarily blocked");
  return { ipBlocked: true, params: { duration: String(finalDurationSec), blockedAt: String(finalBlockedAt), reason } };
}
