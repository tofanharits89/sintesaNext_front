import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import nodeFetch from "node-fetch";

// Internal server uses a self-signed / internal CA cert - bypass TLS verification
// for this trusted internal host only.
const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function proxyPdf(url: string, origin: string, incomingHost: string, request?: NextRequest) {
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    if (url.startsWith("/api/v1/")) {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:7777/api/v1";
      parsedUrl = new URL(url.replace("/api/v1", backendUrl));
    } else if (url.startsWith("/")) {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        origin = origin.replace("https://", "http://");
      }
      parsedUrl = new URL(url, origin);
    } else {
      parsedUrl = new URL(url);
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const allowedHostname = "sintesa.kemenkeu.go.id";
  const isLocalhost = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
  const isSameHost = parsedUrl.hostname === incomingHost;

  if (parsedUrl.hostname !== allowedHostname && !isLocalhost && !isSameHost) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  // Forward incoming session cookies / headers for auth
  const headers: Record<string, string> = {};
  if (request) {
    const cookie = request.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;
    const auth = request.headers.get("authorization");
    if (auth) headers["authorization"] = auth;
  }

  let response: Awaited<ReturnType<typeof nodeFetch>>;
  const isHttps = parsedUrl.protocol === "https:";
  try {
    response = await nodeFetch(parsedUrl.toString(), {
      headers,
      ...(isHttps ? { agent: insecureAgent } : {}),
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
        "Access-Control-Allow-Methods": "GET, POST",
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");
  return proxyPdf(url || "", request.nextUrl.origin, request.nextUrl.hostname, request);
}

export async function POST(request: NextRequest) {
  let url = "";
  try {
    const body = await request.json();
    url = body.url || "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return proxyPdf(url, request.nextUrl.origin, request.nextUrl.hostname, request);
}
