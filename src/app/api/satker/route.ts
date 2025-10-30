import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { config } from "@/lib/config/config";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }

  try {
    // Build the API path with query parameters
    let apiPath = "/carisatker";
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.append("search", search);
    }

    if (queryParams.toString()) {
      apiPath += `?${queryParams.toString()}`;
    }

    const headers: Record<string, string> = {};
    if (cookie) headers["cookie"] = cookie;

    const resp = await fetch(`${config.apiUrl}${apiPath}`, {
      headers,
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to fetch satker data",
          error: data.error,
        },
        { status: resp.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching satker data:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
