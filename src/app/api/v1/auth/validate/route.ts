import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies, createCookieHeader } from "@/lib/utils/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookieHeader = createCookieHeader(request);
  const hasSid = request.cookies.get('sid')?.value || /(?:^|;\s*)sid=/.test(cookieHeader);
  const includeParam = request.nextUrl?.searchParams?.get("include");
  if (!hasSid) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }
  const path = includeParam ? `/auth/validate?include=${encodeURIComponent(includeParam)}` : "/auth/validate";
  const resp = await fetch(backendPath(path), {
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
