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

    const ifNoneMatch = request.headers.get("if-none-match") || undefined;
    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(ifNoneMatch ? { "if-none-match": ifNoneMatch } : {}),
      },
    });

    // If backend signals Not Modified, forward 304 with headers only
    if (resp.status === 304) {
      const notModified = new NextResponse(null, { status: 304 });
      const cacheControl304 = resp.headers.get("cache-control");
      const etag304 = resp.headers.get("etag");
      if (cacheControl304)
        notModified.headers.set("Cache-Control", cacheControl304);
      if (etag304) notModified.headers.set("ETag", etag304);
      return notModified;
    }

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

    // Create response with cache and validation headers forwarded
    const nextResponse = NextResponse.json(
      { ...data, _meta: meta },
      { status: resp.status }
    );

    const cacheControl = resp.headers.get("cache-control");
    const etag = resp.headers.get("etag");
    if (cacheControl) nextResponse.headers.set("Cache-Control", cacheControl);
    if (etag) nextResponse.headers.set("ETag", etag);

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
