import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const body = await request.json().catch(() => ({}));
  const csrfHeader =
    request.headers.get("x-csrf-token") ||
    request.headers.get("x-xsrf-token") ||
    undefined;
  const resp = await fetch(backendPath("/notifications"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(csrfHeader ? { "X-CSRF-Token": csrfHeader } : {}),
    },
    body: JSON.stringify(body),
  });
  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return proxyJsonOrNoContent(resp);
}
