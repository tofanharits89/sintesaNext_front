import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(_request: NextRequest) {
  const cookie = _request.headers.get("cookie") || "";
  let csrfToken: string | undefined;
  try {
    const t = await fetch(backendPath("/auth/csrf"), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      credentials: "include",
      cache: "no-store",
    });
    const tj = await t.json().catch(() => ({} as any));
    csrfToken = tj?.data?.csrfToken || tj?.csrfToken;
  } catch {}

  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: { ...(cookie ? { cookie } : {}), ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) },
    credentials: "include",
    cache: "no-store",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));
  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });
  forwardSetCookies(resp, res);
  return res;
}

