import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const resp = await fetch(backendPath("/messaging/unread-count"), {
    headers: { ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  });
  const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
  return proxyJsonOrNoContent(resp, { forwardCookies: true });
}
