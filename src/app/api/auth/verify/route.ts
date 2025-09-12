import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const auth = request.headers.get("authorization") || "";

    if (!cookie && !auth) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const headers: HeadersInit = {};
    if (cookie) (headers as any).cookie = cookie;
    if (auth) (headers as any).authorization = auth;

    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers,
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

