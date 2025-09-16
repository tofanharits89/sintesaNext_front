import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

// PUT /v3/next/api/saved-queries/[id] -> proxies to backend PUT /api/v1/saved-queries/:id
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const csrf = request.headers.get("x-csrf-token");
  const body = await request.json().catch(() => ({}));

  const resp = await fetch(backendPath(`/saved-queries/${params.id}`), {
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const csrf = request.headers.get("x-csrf-token");

  const resp = await fetch(backendPath(`/saved-queries/${params.id}`), {
    method: "DELETE",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}