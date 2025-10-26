import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "../_shared";
import { config } from "@/lib/config/config";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kdsatker: string }> }
) {
  const { kdsatker } = await context.params;
  const cookie = request.headers.get("cookie") || "";

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
    );
  }

  try {
    const resp = await fetch(`${config.apiUrl}/carisatker/${kdsatker}`, {
      headers: { ...(cookie ? { cookie } : {}) },
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to fetch satker details",
          error: data.error,
        },
        { status: resp.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[api/satker/[kdsatker]] Error fetching satker details:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
