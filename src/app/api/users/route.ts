import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";

function extractCookie(name: string, cookieHeader: string): string | undefined {
  try {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === name) return decodeURIComponent(rest.join("="));
    }
  } catch { }
  return undefined;
}

export async function GET(request: NextRequest) {
  // Forward cookies to backend, let backend auth middleware read httpOnly cookies
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  try {
    const resp = await fetch(backendPath("/users"), {
      headers: cookie ? { cookie } : {},
    });

    const data = await resp.json().catch(() => ({}));
    // Build response and forward any Set-Cookie headers
    const response = NextResponse.json(
      resp.ok
        ? data
        : {
          success: false,
          message: data.message || "Failed to fetch users",
          error: data.error,
        },
      { status: resp.ok ? 200 : resp.status }
    );
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    return response;
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const body = await request.json();
  // Read CSRF token emitted by backend into a readable cookie
  const xsrf = extractCookie("XSRF-TOKEN", cookie);
  const resp = await fetch(backendPath("/users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
    },
    body: JSON.stringify(body),
  });
  const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
  return proxyJsonOrNoContent(resp, { forwardCookies: true });
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
  const id = body?.id;
  const xsrf = extractCookie("XSRF-TOKEN", cookie);
  const resp = await fetch(backendPath(`/users/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
    },
    body: JSON.stringify(body),
  });
  const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
  return proxyJsonOrNoContent(resp);
}

export async function DELETE(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ids = url.searchParams.getAll("ids");
  let status = 400;
  let payload: any = { ok: false };
  const xsrf = extractCookie("XSRF-TOKEN", cookie);
  if (id) {
    const resp = await fetch(backendPath(`/users/${id}`), {
      method: "DELETE",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
      },
    });
    status = resp.ok ? 200 : 400;
    payload = { ok: resp.ok };
  } else if (ids?.length) {
    // batch delete not implemented on backend; delete sequentially
    let deleted = 0;
    for (const uid of ids) {
      const resp = await fetch(backendPath(`/users/${uid}`), {
        method: "DELETE",
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
        },
      });
      if (resp.ok) deleted++;
    }
    status = 200;
    payload = { deleted };
  }
  const response = NextResponse.json(payload, { status });
  // In case backend rotated cookies on DELETE
  // Note: in looped deletes we can't aggregate set-cookie from each response
  // but single delete may set one.
  // If needed, consider batch endpoint in backend.
  // For now, forward last observed set-cookie only.
  // (No change to behavior if none.)
  // setCookie is undefined here because we don't keep reference; safe to skip.
  return response;
}
