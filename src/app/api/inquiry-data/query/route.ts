import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    // Forward CSRF headers if present so backend CSRF middleware can validate
    const csrfHeader = request.headers.get("x-csrf-token");
    const xsrfHeader = request.headers.get("x-xsrf-token");
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(backendPath("/inquiry-data/query"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrfHeader ? { "X-CSRF-Token": csrfHeader } : {}),
        ...(xsrfHeader ? { "X-XSRF-TOKEN": xsrfHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("text/csv")) {
      return new NextResponse(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });
    }

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const resp = await fetch(backendPath("/inquiry-data/query"), {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
