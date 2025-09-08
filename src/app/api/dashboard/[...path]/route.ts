import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

// Catch-all proxy for dashboard endpoints
// Forwards cookies and query string to backend so httpOnly auth cookies are used
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const { path } = await ctx.params;
    const segments = (path || []).join("/");
    const url = new URL(backendPath(`/dashboard/${segments}`));
    const { searchParams } = new URL(request.url);
    // Forward all query params
    for (const [k, v] of searchParams.entries()) url.searchParams.set(k, v);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    const asOfJakarta = resp.headers.get("x-as-of-jakarta") || null;
    const cacheExpiresAtUtc =
      resp.headers.get("x-cache-expires-at-utc") || null;
    const cacheMaxAge = resp.headers.get("x-cache-maxage");
    const meta = {
      asOfJakarta,
      cacheExpiresAtUtc,
      cacheMaxAgeSeconds: cacheMaxAge ? Number(cacheMaxAge) : undefined,
    } as const;
    return NextResponse.json({ ...data, _meta: meta }, { status: resp.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
