import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

// Proxy: /api/v1/users -> backend /users
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }
  try {
    const resp = await fetch(backendPath("/users"), {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      resp.ok
        ? data
        : {
            success: false,
            message: (data as any).message || "Failed to fetch users",
            error: (data as any).error,
          },
      { status: resp.ok ? 200 : resp.status },
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
