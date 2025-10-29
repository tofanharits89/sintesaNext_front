import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(_request: NextRequest) {
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));
  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });
  forwardSetCookies(resp, res);
  return res;
}

