import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies, createCookieHeader } from "@/lib/utils/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookieHeader = createCookieHeader(request);
  const hasSid = request.cookies.get('sid')?.value || /(?:^|;\s*)sid=/.test(cookieHeader);
  if (!hasSid) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }
  const resp = await fetch(backendPath("/auth/me"), {
    method: "GET",
    headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
    credentials: "include",
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  forwardSetCookies(resp, res);
  return res;
}
