export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";
import { verifyCacheInvalidationSignature } from "@/utils/cache-signature";
import { hashKey, invalidateAuthCache } from "@/lib/auth/simplified-utils";

function extractSidFromCookieStr(s: string): string | null {
  const m = /(?:^|;\s*)sid=([^;]+)/.exec(s || "");
  const v = m && typeof m[1] === "string" ? m[1] : undefined;
  return v ? decodeURIComponent(v) : null;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  let body: any = {};
  try { body = JSON.parse(bodyText || "{}"); } catch {}
  const sig = req.headers.get("x-internal-signature") || "";
  const isSigned = await verifyCacheInvalidationSignature(bodyText, sig);
  const isInternal = req.headers.get("x-internal-request") === "true";

  if (!isSigned && !isInternal) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let keyToInvalidate: string | undefined;
  if (typeof body.sessionKey === "string" && body.sessionKey.length > 0) {
    const token = body.sessionKey.includes("=")
      ? extractSidFromCookieStr(body.sessionKey) || body.sessionKey
      : body.sessionKey;
    keyToInvalidate = hashKey(token);
  }

  invalidateAuthCache(keyToInvalidate);
  return NextResponse.json({ ok: true });
}
