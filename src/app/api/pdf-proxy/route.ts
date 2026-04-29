import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import nodeFetch from "node-fetch";

// Internal server uses a self-signed / internal CA cert - bypass TLS verification
// for this trusted internal host only.
const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  // Only allow fetching from trusted domain
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const allowedHostname = "sintesa.kemenkeu.go.id";
  if (parsedUrl.hostname !== allowedHostname) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  let response: Awaited<ReturnType<typeof nodeFetch>>;
  try {
    response = await nodeFetch(url, {
      agent: insecureAgent,
      redirect: "follow",
    });
  } catch (err: unknown) {
    console.error("PDF proxy fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch PDF", detail: String(err) },
      { status: 502 },
    );
  }

  if (!response.ok) {
    console.error("PDF proxy upstream error:", response.status, response.statusText);
    return NextResponse.json(
      { error: `Upstream error ${response.status} ${response.statusText}` },
      { status: response.status },
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "application/pdf";
  
  // Check if content is actually PDF
  if (!contentType.includes("pdf") && !contentType.includes("application/octet-stream")) {
    console.error("PDF proxy invalid content type:", contentType);
    return NextResponse.json(
      { error: "Invalid content type, expected PDF" },
      { status: 400 },
    );
  }

  try {
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Empty PDF content" },
        { status: 400 },
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err: unknown) {
    console.error("PDF proxy buffer error:", err);
    return NextResponse.json(
      { error: "Failed to process PDF content", detail: String(err) },
      { status: 500 },
    );
  }
}
