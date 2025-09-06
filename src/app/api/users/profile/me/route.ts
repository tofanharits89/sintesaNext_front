import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

// Deprecated: cookie-only flow now forwards Cookie header to backend. Keep stub to avoid import errors.
function getAuthTokenFromCookies(_request: NextRequest): string | null {
  return null;
}

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "GET",
    headers: { ...(cookie ? { cookie } : {}) },
  });

  if (!resp.ok) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: resp.status }
    );
  }

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
}
