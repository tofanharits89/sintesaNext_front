import { NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";

// GET /api/analytics/cache-metrics -> proxies to backend /analytics/cache-metrics
export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";

  // Minimal diagnostics (no sensitive values)
  console.log("[API /analytics/cache-metrics] Incoming cookies present:", !!cookie);
  console.log(
    "[API /analytics/cache-metrics] Has access token:",
    cookie.includes("access_token=") || cookie.includes("accessToken=")
  );

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(backendPath("/analytics/cache-metrics"));
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    console.log("[API /analytics/cache-metrics] Backend status:", resp.status);

    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    const res = await proxyJsonOrNoContent(resp);

    // Forward cache-related headers if present
    const cacheControl = resp.headers.get("cache-control");
    const etag = resp.headers.get("etag");
    if (cacheControl) res.headers.set("Cache-Control", cacheControl);
    if (etag) res.headers.set("ETag", etag);

    return res;
  } catch (e) {
    console.error("[API /analytics/cache-metrics] Proxy error:", e);
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}

