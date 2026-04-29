import https from "node:https";
import nodeFetch from "node-fetch";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Internal server uses a self-signed / internal CA cert — bypass TLS verification
// for this trusted internal host only.
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

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
    return NextResponse.json(
      { error: "Failed to fetch PDF", detail: String(err) },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Upstream error ${response.status} ${response.statusText}` },
      { status: response.status },
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "application/pdf";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
