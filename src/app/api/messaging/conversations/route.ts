import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

function extractCookie(name: string, cookieHeader: string): string | undefined {
  try {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === name) return decodeURIComponent(rest.join("="));
    }
  } catch { }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    console.log("[API /messaging/conversations] Incoming cookies present:", !!cookie);
    console.log("[API /messaging/conversations] Has sid:", /(?:^|;\s*)sid=/.test(cookie));
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = searchParams.get("limit");

    const url = new URL(backendPath("/messaging/conversations"));
    if (cursor) url.searchParams.set("cursor", cursor);
    if (limit) url.searchParams.set("limit", limit);

    let resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    console.log("[API /messaging/conversations] Backend status:", resp.status);
    // 401: let client handle redirect to login
    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    forwardSetCookies(resp, res);
    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}

