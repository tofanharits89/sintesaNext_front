import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";

function extractCookie(name: string, cookieHeader: string): string | undefined {
  try {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === name) return decodeURIComponent(rest.join("="));
    }
  } catch {}
  return undefined;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "User ID is required" },
      { status: 400 }
    );
  }

  const xsrf = extractCookie("XSRF-TOKEN", cookie);

  try {
    const resp = await fetch(backendPath(`/users/${id}`), {
      method: "DELETE",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
      },
    });

    // Forward the backend response (handles 204 automatically)
    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp, { forwardCookies: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "User ID is required" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const xsrf = extractCookie("XSRF-TOKEN", cookie);

  try {
    const resp = await fetch(backendPath(`/users/${id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
      },
      body: JSON.stringify(body),
    });

    // Forward the backend response (handles 204 automatically)
    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp, { forwardCookies: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const resp = await fetch(backendPath(`/users/${id}`), {
      headers: cookie ? { cookie } : {},
    });

    const data = await resp.json().catch(() => ({}));
    const response = NextResponse.json(
      resp.ok
        ? data
        : {
            success: false,
            message: data.message || "Failed to fetch user",
            error: data.error,
          },
      { status: resp.ok ? 200 : resp.status }
    );

    // Forward any Set-Cookie headers
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
