import { NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";

export async function PUT(
  request: Request,
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
    const body = await request.json().catch(() => ({}));

    // Extract CSRF token from incoming cookies (set by backend as XSRF-TOKEN)
    const xsrfMatch = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    const csrfToken = decodeURIComponent(xsrfMatch?.[1] ?? "");

    const resp = await fetch(
      backendPath(
        `/messaging/conversations/${encodeURIComponent(conversationId)}/read`
      ),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { cookie } : {}),
          ...(csrfToken
            ? { "X-CSRF-Token": csrfToken, "X-XSRF-Token": csrfToken }
            : {}),
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store",
      }
    );

    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
