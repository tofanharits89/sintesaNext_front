import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

// GET /v3/next/api/saved-queries -> proxies to backend GET /api/v1/saved-queries
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
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

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: { ...(cookie ? { cookie } : {}) },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

// POST /v3/next/api/saved-queries -> proxies to backend POST /api/v1/saved-queries
export async function POST(request: NextRequest) {
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
  return NextResponse.json(data, { status: resp.status });
}