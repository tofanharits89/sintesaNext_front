import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";


// GET /v3/next/api/saved-queries -> proxies to backend GET /api/v1/saved-queries
export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const dbgSrc = request.headers.get("x-debug-source");
  const dbgScope = request.headers.get("x-debug-scope");
  const dbgTs = request.headers.get("x-debug-ts");
  console.log("[API /saved-queries] Incoming cookies present:", !!cookie);
  if (dbgSrc || dbgScope || dbgTs) {
    console.log("[API /saved-queries] Debug headers:", { src: dbgSrc, scope: dbgScope, ts: dbgTs });
  }
  console.log(
    "[API /saved-queries] Has access token:",
    cookie.includes("access_token=") || cookie.includes("accessToken=")
  );
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
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

  let resp = await fetch(url.toString(), {
    method: "GET",
    headers: { ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  });
  // Do not perform server-side refresh here; let client interceptors handle 401s
  // This avoids concurrent refresh races and unintended logout cascades
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) {
    // Important: do not forward Set-Cookie on 401 here; let client refresh preserve cookies
    return NextResponse.json(data, { status: 401 });
  }
  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return await proxyJsonOrNoContent(resp, { forwardCookies: true });
}

// POST /v3/next/api/saved-queries -> proxies to backend POST /api/v1/saved-queries
export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 }
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
