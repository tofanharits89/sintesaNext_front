import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }
    const { path } = await params;
    const segments = (path || []).join("/");
    const url = new URL(backendPath(`/transfer-daerah/${segments}`));
    const { searchParams } = new URL(request.url);
    for (const [k, v] of searchParams.entries()) url.searchParams.set(k, v);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }
    const { path } = await params;
    const segments = (path || []).join("/");
    const url = new URL(backendPath(`/transfer-daerah/${segments}`));
    
    // Handle both JSON and FormData
    const contentType = request.headers.get("content-type") || "";
    let body;
    let headers: HeadersInit = { ...(cookie ? { cookie } : {}) };
    
    if (contentType.includes("multipart/form-data")) {
      // For FormData (file uploads)
      body = await request.formData();
    } else {
      // For JSON data
      body = JSON.stringify(await request.json().catch(() => ({})));
      headers["Content-Type"] = "application/json";
    }
    
    // Extract CSRF token from cookies
    const xsrfMatch = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    const csrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : "";
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
      headers["X-XSRF-Token"] = csrfToken;
    }

    const resp = await fetch(url.toString(), {
      method: "POST",
      headers,
      body,
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
