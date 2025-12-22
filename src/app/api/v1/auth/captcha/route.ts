import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const resp = await fetch(backendPath("/auth/captcha"), {
    method: "GET",
    headers: { ...(cookie ? { cookie } : {}) },
    credentials: "include",
    cache: "no-store",
  });

  const body = await resp.json().catch(() => ({}));
  const res = NextResponse.json(body, { status: resp.status });
  forwardSetCookies(resp, res);
  return res;
}
