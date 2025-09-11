import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const { conversationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const before = searchParams.get("before");

    const url = new URL(
      backendPath(
        `/messaging/conversations/${encodeURIComponent(
          conversationId
        )}/messages`
      )
    );
    if (page) url.searchParams.set("page", page);
    if (limit) url.searchParams.set("limit", limit);
    if (before) url.searchParams.set("before", before);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
