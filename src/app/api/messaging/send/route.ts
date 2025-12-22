import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";


export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Extract CSRF token from incoming cookies (set by backend as XSRF-TOKEN)
    const xsrfMatch = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    const csrfToken = decodeURIComponent(xsrfMatch?.[1] ?? "");

    const resp = await fetch(backendPath("/messaging/send"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrfToken
          ? { "X-CSRF-Token": csrfToken, "X-XSRF-Token": csrfToken }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp, { forwardCookies: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
