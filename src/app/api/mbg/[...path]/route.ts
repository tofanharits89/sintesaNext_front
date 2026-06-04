import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 },
      );
    }

    const { path } = await ctx.params;
    const segments = (path || []).join("/");
    const url = new URL(backendPath(`/mbg/${segments}`));
    const { searchParams } = new URL(request.url);
    for (const [k, v] of searchParams.entries()) url.searchParams.set(k, v);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    const contentType = resp.headers.get("content-type") || "";

    // If backend returns a binary file (Excel, etc.), stream it directly
    if (
      contentType.includes("spreadsheetml") ||
      contentType.includes("octet-stream") ||
      contentType.includes("application/zip")
    ) {
      const headers = new Headers();
      headers.set("Content-Type", contentType);
      const disposition = resp.headers.get("content-disposition");
      if (disposition) headers.set("Content-Disposition", disposition);
      const cacheControl = resp.headers.get("cache-control");
      if (cacheControl) headers.set("Cache-Control", cacheControl);

      return new NextResponse(resp.body, {
        status: resp.status,
        headers,
      });
    }

    // Otherwise, treat as JSON (default for all other API responses)
    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 },
    );
  }
}

