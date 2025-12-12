import { NextRequest, NextResponse } from "next/server";

// Allow long-running RAG calls (up to 180s)
export const maxDuration = 180;
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_BASE =
  process.env.API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  `http://localhost:${process.env.BACKEND_PORT || process.env.NEXT_PUBLIC_BACKEND_PORT || "88"}/api/v1`;

export async function POST(req: NextRequest) {
  // Abort after 180s to match backend/Python timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    // Ensure we keep any /api/v1 prefix from BACKEND_BASE
    const backendUrl = `${BACKEND_BASE.replace(/\/$/, "")}/rag/chat`;
    const body = await req.text();

    // Forward headers, especially cookies & content-type
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() === "host") return;
      headers.set(key, value);
    });

    const resp = await fetch(backendUrl, {
      method: "POST",
      body,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const hopByHop = new Set([
      "content-encoding",
      "content-length",
      "transfer-encoding",
      "connection",
      "keep-alive",
    ]);

    const resHeaders = new Headers();
    resp.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      // Drop hop-by-hop & encoding headers; Next.js will handle compression/length
      if (hopByHop.has(k)) return;
      if (k === "set-cookie") {
        resHeaders.append("set-cookie", value);
      } else {
        resHeaders.set(key, value);
      }
    });

    const text = await resp.text();
    // Try to return JSON if possible, else plain text
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(text);
        resHeaders.set("content-type", "application/json");
        return NextResponse.json(json, {
          status: resp.status,
          headers: resHeaders,
        });
      } catch {
        // fall through to plain text
      }
    }

    return new NextResponse(text, {
      status: resp.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    const message = error?.name === "AbortError"
      ? "RAG request aborted after 180s"
      : error?.message || "Failed to proxy RAG request";
    return NextResponse.json({ success: false, error: message }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
