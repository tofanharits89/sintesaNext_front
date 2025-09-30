import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

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

export async function GET(request: NextRequest) {
  // Forward client cookies to backend; rely on backend to read httpOnly cookies
  const cookie = request.headers.get("cookie") || "";

  // Frontend safeguard: if refresh token cookie is absent, treat as logged out
  if (!hasCookie(cookie, "refreshToken") && !hasCookie(cookie, "refresh_token")) {
    return NextResponse.json(
      { success: false, data: null, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const resp = await fetch(backendPath("/auth/me"), {
    method: "GET",
    headers: cookie ? { cookie, ...pickDeviceHeaders(request) } : { ...pickDeviceHeaders(request) },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));

  // Propagate backend status (e.g., 401/403) and disable caching
  if (!resp.ok || !data?.success) {
    const res = NextResponse.json(
      { success: false, data: null, message: data?.message || "Unauthorized" },
      { status: resp.status || 401 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const user = data.data?.user || data.data;
  const res = NextResponse.json({ success: true, data: user }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
