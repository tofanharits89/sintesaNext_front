import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

// PUT /v3/next/api/saved-queries/[id] -> proxies to backend PUT /api/v1/saved-queries/:id
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const csrf = request.headers.get("x-csrf-token");
  const body = await request.json().catch(() => ({}));

  const { id } = await ctx.params;
  const resp = await fetch(backendPath(`/saved-queries/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(body),
  });
  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return await proxyJsonOrNoContent(resp, { forwardCookies: true });
}

// DELETE /v3/next/api/saved-queries/[id] -> proxies to backend DELETE /api/v1/saved-queries/:id
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookie = request.headers.get("cookie") || "";
  const hdrSource = request.headers.get("x-debug-source");
  const hdrTrace = request.headers.get("x-debug-trace");
  console.log("[API /saved-queries/:id DELETE] Incoming cookies present:", !!cookie);
  if (hdrSource || hdrTrace) {
    console.log("[API /saved-queries/:id DELETE] Debug headers:", { source: hdrSource, trace: hdrTrace });
  }
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const csrf = request.headers.get("x-csrf-token");

  const { id: delId } = await ctx.params;
  const resp = await fetch(backendPath(`/saved-queries/${delId}`), {
    method: "DELETE",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
  });

  console.log("[API /saved-queries/:id DELETE] Backend status:", resp.status);

  // Handle 204 No Content responses properly
  if (resp.status === 204) {
    const res = NextResponse.json({ success: true, id: delId }, { status: 200 });
    forwardSetCookies(resp, res);
    return res;
  }

  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return await proxyJsonOrNoContent(resp, { forwardCookies: true });
}
