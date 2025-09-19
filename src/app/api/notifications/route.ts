import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const resp = await fetch(backendPath("/notifications"), {
    headers: { ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie)
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );

  const body = await request.json().catch(() => ({}));
  // Forward CSRF headers from client to backend to satisfy csurf
  const csrfHeader =
    request.headers.get("x-csrf-token") ||
    request.headers.get("x-xsrf-token") ||
    request.headers.get("x-csrf-token" as any) ||
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
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
