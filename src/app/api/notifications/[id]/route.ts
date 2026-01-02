import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const { id } = await ctx.params;
  const resp = await fetch(backendPath(`/notifications/${id}`), {
    method: "DELETE",
    headers: { ...(cookie ? { cookie } : {}) },
  });

  const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
  return proxyJsonOrNoContent(resp);
}
