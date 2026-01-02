import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";

export async function PUT(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const resp = await fetch(backendPath(`/notifications/read/all`), {
    method: "PUT",
    headers: { ...(cookie ? { cookie } : {}) },
  });
  const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
  return proxyJsonOrNoContent(resp);
}
