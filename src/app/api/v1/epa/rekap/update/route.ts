import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";

// Proxy: /api/v1/epa/rekap/update -> backend /epa/rekap/update
export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const resp = await fetch(backendPath("/epa/rekap/update"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      resp.ok
        ? data
        : {
            success: false,
            message: (data as any).message || "Failed to update rekap EPA",
            error: (data as any).error,
          },
      { status: resp.ok ? 200 : resp.status },
    );
  } catch (error) {
    console.error("Error updating rekap EPA:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
