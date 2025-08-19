import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { getToken } from "../_shared";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kdsatker: string }> }
) {
  const { kdsatker } = await context.params;
  const token = getToken(request);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "No token found" },
      { status: 401 }
    );
  }

  try {
    const resp = await fetch(backendPath(`/carisatker/${kdsatker}`), {
      headers: { Authorization: `Bearer ${token}` },
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
    console.error("Error fetching satker details:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
