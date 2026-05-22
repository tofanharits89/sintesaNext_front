import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || `http://${process.env.BACKEND_HOST || "localhost"}:${process.env.BACKEND_PORT || process.env.NEXT_PUBLIC_BACKEND_PORT || "7777"}/api/v1`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUrl = body?.url;

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Forward to backend satudja-proxy with cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const backendUrl = `${BACKEND_URL}/satker/satudja-proxy?url=${encodeURIComponent(targetUrl)}&inline=true`;

    const resp = await fetch(backendUrl, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Backend error ${resp.status}` },
        { status: resp.status },
      );
    }

    const buffer = await resp.arrayBuffer();

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ error: "Empty response" }, { status: 400 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch PDF" },
      { status: 500 },
    );
  }
}
