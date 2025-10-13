import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

// GET /v3/next/api/saved-queries -> proxies to backend GET /api/v1/saved-queries
export async function GET(request: Request) {
  console.log("=== SAVED QUERIES API ROUTE CALLED ===");
  console.log("[API /saved-queries] Request URL:", request.url);
  console.log("[API /saved-queries] Request method:", request.method);

  const cookie = request.headers.get("cookie") || "";
  const dbgSrc = request.headers.get("x-debug-source");
  const dbgScope = request.headers.get("x-debug-scope");
  const dbgTs = request.headers.get("x-debug-ts");
  console.log("[API /saved-queries] Incoming cookies present:", !!cookie);
  console.log("[API /saved-queries] Cookie content:", cookie);
  if (dbgSrc || dbgScope || dbgTs) {
    console.log("[API /saved-queries] Debug headers:", {
      src: dbgSrc,
      scope: dbgScope,
      ts: dbgTs,
    });
  }
  console.log(
    "[API /saved-queries] Has access token:",
    cookie.includes("access_token=") || cookie.includes("accessToken="),
  );
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const search = searchParams.get("search");
  const scope = searchParams.get("scope");

  const url = new URL(backendPath("/saved-queries"));
  if (page) url.searchParams.set("page", page);
  if (limit) url.searchParams.set("limit", limit);
  if (search) url.searchParams.set("search", search);
  if (scope) url.searchParams.set("scope", scope);

  console.log("[API /saved-queries] Fetching from backend:", url.toString());

  let resp = await fetch(url.toString(), {
    method: "GET",
    headers: { ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  });

  console.log("[API /saved-queries] Backend response status:", resp.status);
  console.log(
    "[API /saved-queries] Backend response headers:",
    Object.fromEntries(resp.headers.entries()),
  );
  // Do not perform server-side refresh here; let client interceptors handle 401s
  // This avoids concurrent refresh races and unintended logout cascades
  if (resp.status === 401) {
    // Important: do not forward Set-Cookie on 401 here; let client refresh preserve cookies
    const data = await resp.json().catch(() => ({}));
    console.log("[API /saved-queries] Returning 401 response:", data);
    return NextResponse.json(data, { status: 401 });
  }

  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  console.log(
    "[API /saved-queries] About to call proxyJsonOrNoContent with response:",
    resp.status,
  );
  const result = await proxyJsonOrNoContent(resp, { forwardCookies: true });
  console.log(
    "[API /saved-queries] proxyJsonOrNoContent result type:",
    typeof result,
  );
  console.log("[API /saved-queries] Final response being sent");
  return result;
}

// POST /v3/next/api/saved-queries -> proxies to backend POST /api/v1/saved-queries
export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }

  const csrf = request.headers.get("x-csrf-token");
  const body = await request.json().catch(() => ({}));

  const resp = await fetch(backendPath("/saved-queries"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return await proxyJsonOrNoContent(resp, { forwardCookies: true });
}
