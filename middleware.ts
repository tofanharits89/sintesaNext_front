import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next";

async function verifyTokenViaBackend(token?: string) {
  if (!token) return false;
  try {
    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return false;
    const data = await resp.json().catch(() => ({}));
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function isBackendHealthy() {
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 1500);
    const resp = await fetch(backendPath("/auth/health"), {
      method: "GET",
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return false;
    const data = await resp.json().catch(() => ({}));
    return Boolean(data?.success || data?.status === "healthy");
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize path without basePath for checks
  const relPath = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length) || "/"
    : pathname;

  // Treat all API routes as pass-through (auth handled inside API handlers)
  const isApiRoute = relPath.startsWith("/api/");
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Determine public routes (still show 500 when backend is down)
  const isPublicPath =
    relPath === "/login" ||
    relPath.startsWith("/login") ||
    relPath.startsWith("/api/auth");

  // Early: Skip health check for static assets and the server-error page itself
  const isStatic =
    relPath.startsWith("/_next") ||
    relPath.startsWith("/favicon.ico") ||
    relPath.startsWith("/api/public") ||
    relPath.startsWith("/images") ||
    relPath.startsWith("/icons") ||
    relPath.startsWith("/server-error");

  // Early: If backend is unhealthy, redirect to server-error page
  if (!isStatic) {
    const healthyEarly = await isBackendHealthy();
    if (!healthyEarly) {
      const url = request.nextUrl.clone();
      // Set path relative to current base path. Do NOT prepend BASE_PATH here,
      // because Next middleware will apply basePath automatically.
      url.pathname = `/server-error`;
      return NextResponse.redirect(url);
    }
  }

  // Check multiple cookie names - this might be the issue!
  const tokenCookie = request.cookies.get("token")?.value;
  const authStateCookie = request.cookies.get("authState")?.value;
  const socketTokenCookie = request.cookies.get("socket_token")?.value;
  const authUserCookie = request.cookies.get("auth_user")?.value;

  // Try the primary token first, then fallbacks
  const token =
    tokenCookie || authStateCookie || socketTokenCookie || authUserCookie;

  console.log("[Middleware Debug] Cookie analysis:", {
    path: pathname,
    relPath,
    tokenCookie: tokenCookie ? "present" : "missing",
    authStateCookie: authStateCookie ? "present" : "missing",
    socketTokenCookie: socketTokenCookie ? "present" : "missing",
    authUserCookie: authUserCookie ? "present" : "missing",
    finalToken: token ? "present" : "missing",
    allCookies: request.cookies.getAll().map((c) => c.name),
  });

  const isAuth = await verifyTokenViaBackend(token);

  // Debug logging (remove in production)
  console.log(
    "[Middleware] Path:",
    pathname,
    "RelPath:",
    relPath,
    "IsPublic:",
    isPublicPath,
    "IsAuth:",
    isAuth
  );

  // Handle root path: redirect to appropriate base path
  if (relPath === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `${BASE_PATH}${isAuth ? "/dashboard" : "/login"}`;
    return NextResponse.redirect(url);
  }

  if (!isAuth && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = `${BASE_PATH}/login`;
    return NextResponse.redirect(url);
  }

  if (isAuth && relPath.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = `${BASE_PATH}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Pass through, set request header for route visibility, and ensure no caching on protected pages
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-public-route", isPublicPath ? "1" : "0");
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!isPublicPath) {
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export const config = {
  matcher: ["/", "/((?!_next|favicon.ico|api/public).*)"],
};
