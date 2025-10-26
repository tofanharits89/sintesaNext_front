import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

function extractCookie(name: string, cookieHeader: string): string | undefined {
  try {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === name) return decodeURIComponent(rest.join("="));
    }
  } catch {}
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    console.log("[API /messaging/conversations] Incoming cookies present:", !!cookie);
    console.log("[API /messaging/conversations] Has access token:", cookie.includes("access_token=") || cookie.includes("accessToken="));
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
    if (resp.status === 401) {
      try {
        const xsrf = extractCookie("XSRF-TOKEN", cookie);
        const refresh = await fetch(backendPath("/auth/refresh"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookie ? { cookie } : {}),
            ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
          },
          cache: "no-store",
        });
        console.log("[API /messaging/conversations] Refresh status:", refresh.status);
        if (refresh.ok) {
          const retry = await fetch(url.toString(), {
            method: "GET",
            headers: { ...(cookie ? { cookie } : {}) },
            cache: "no-store",
          });
          const retryData = await retry.json().catch(() => ({}));
          const retryRes = NextResponse.json(retryData, { status: retry.status });
          forwardSetCookies(refresh, retryRes);
          forwardSetCookies(retry, retryRes);
          return retryRes;
        }
      } catch {}
    }
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

