import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

// Force dynamic, no caching at the route-handler level
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function pickDeviceHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  const copy = (n: string) => { const v = req.headers.get(n); if (v) out[n] = v; };
  [
    "user-agent",
    "accept-language",
    "sec-ch-ua",
    "sec-ch-ua-platform",
    "x-device-id",
    "x-device-timezone",
    "x-device-locale",
    "x-device-platform",
  ].forEach(copy);
  return out;
}

function hasCookie(cookiesHeader: string, name: string): boolean {
  if (!cookiesHeader) return false;
  const parts = cookiesHeader.split(";").map((c) => c.trim());
  return parts.some((c) => c.startsWith(`${encodeURIComponent(name)}=`));
}

function setNoStoreHeaders(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Vary", "Cookie, Authorization, X-Device-Id");
}

export async function GET(request: NextRequest) {
  // Forward client cookies to backend; rely on backend to read httpOnly cookies
  const cookie = request.headers.get("cookie") || "";

  // Frontend safeguard: require at least one auth cookie (access or refresh). Do not force 401 if refresh is absent.
  const hasAccess = hasCookie(cookie, "accessToken") || hasCookie(cookie, "access_token") || hasCookie(cookie, "authToken") || hasCookie(cookie, "auth_token");
  const hasRefresh = hasCookie(cookie, "refreshToken") || hasCookie(cookie, "refresh_token");
  if (!hasAccess && !hasRefresh) {
    const res = NextResponse.json(
      { success: false, data: null, message: "Unauthorized" },
      { status: 401 }
    );
    setNoStoreHeaders(res);
    return res;
  }

  // Add a cache-buster to ensure no intermediary caches this request
  const url = new URL(backendPath("/auth/me"));
  url.searchParams.set("_t", Date.now().toString());

  let backendOk = false;
  let status = 401;
  let body: any = {};

  try {
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: cookie ? { cookie, ...pickDeviceHeaders(request) } : { ...pickDeviceHeaders(request) },
      cache: "no-store",
    });
    status = resp.status;
    body = await resp.json().catch(() => ({}));
    backendOk = resp.ok && Boolean(body?.success);
  } catch (e) {
    backendOk = false;
    status = 503;
    body = { message: "Auth service unavailable" };
  }

  // STRICT MODE: Only return 200 when backend explicitly returns 200 AND success:true
  if (!backendOk) {
    const res = NextResponse.json(
      { success: false, data: null, message: body?.message || "Unauthorized" },
      { status: status || 401 }
    );
    setNoStoreHeaders(res);
    return res;
  }

  const user = body.data?.user || body.data;
  const res = NextResponse.json({ success: true, data: user }, { status: 200 });
  setNoStoreHeaders(res);
  return res;
}
