import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

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
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

// DELETE /v3/next/api/saved-queries/[id] -> proxies to backend DELETE /api/v1/saved-queries/:id
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const cookie = request.headers.get("cookie") || "";
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
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}