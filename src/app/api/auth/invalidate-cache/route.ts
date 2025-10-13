export const runtime = "edge";

import { NextResponse, NextRequest } from "next/server";
import { verifyCacheInvalidationSignature } from "@/utils/cache-signature";
import { hashKey, invalidateAuthCache } from "@/utils/auth-cache";

function extractAccessFromCookieStr(s: string): string | null {
  const m = /(?:^|;\s*)(access_token|accessToken)=([^;]+)/.exec(s || "");
  const v = m && typeof m[2] === "string" ? m[2] : undefined;
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
      ? extractAccessFromCookieStr(body.sessionKey) || body.sessionKey
      : body.sessionKey;
    keyToInvalidate = hashKey(token);
  }

  invalidateAuthCache(keyToInvalidate);
  return NextResponse.json({ ok: true });
}
