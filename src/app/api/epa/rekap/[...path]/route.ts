import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

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
    const url = new URL(backendPath(`/epa/rekap/${segments}`));
    const { searchParams } = new URL(request.url);
    for (const [k, v] of searchParams.entries()) url.searchParams.set(k, v);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error) {
    console.error("[EPA Rekap API] Proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
