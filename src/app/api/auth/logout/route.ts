import { NextResponse, NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

function extractCookie(cookiesHeader: string, name: string): string | null {
  if (!cookiesHeader) return null;
  const parts = cookiesHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return null;
  const value = match.split("=")[1] || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  // Forward incoming cookies and CSRF to backend
  const incomingCookie = req.headers.get("cookie") ?? "";
  const xsrfFromCookie = extractCookie(incomingCookie, "XSRF-TOKEN");
  // Also honor any explicit CSRF headers from the client
  const incomingCsrfHeader =
    req.headers.get("x-csrf-token") || req.headers.get("x-xsrf-token");

  const normalizeToken = (raw: string | null): string | null => {
    if (!raw) return null;
    // Some browsers combine duplicate headers as comma-separated list; take the last valid hex token
    const candidates = raw
      .split(",")
      .map((part) => part.trim())
      .filter((part): part is string => typeof part === "string" && part.length > 0);

    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const candidate = candidates[i] ?? "";
      if (/^[a-f0-9]{64}$/i.test(candidate)) {
        return candidate;
      }
    }

    // Fallback to last non-empty candidate even if format is unexpected
    const fallback = candidates.at(-1);
    return fallback ?? null;
  };

  const normalizedHeaderToken = normalizeToken(incomingCsrfHeader);
  const normalizedCookieToken = normalizeToken(xsrfFromCookie);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (incomingCookie) headers["cookie"] = incomingCookie;
  const csrf = incomingCsrfHeader || xsrfFromCookie;
  console.warn("[Logout API] CSRF forwarding diagnostic", {
    headerLength: incomingCsrfHeader?.length ?? 0,
    cookieLength: xsrfFromCookie?.length ?? 0,
    finalLength: csrf?.length ?? 0,
    normalizedHeaderLength: normalizedHeaderToken?.length ?? 0,
    normalizedCookieLength: normalizedCookieToken?.length ?? 0,
    headerPreview: incomingCsrfHeader
      ? `${incomingCsrfHeader.slice(0, 6)}...${incomingCsrfHeader.slice(-6)}`
      : null,
    cookiePreview: xsrfFromCookie
      ? `${xsrfFromCookie.slice(0, 6)}...${xsrfFromCookie.slice(-6)}`
      : null,
    normalizedHeaderPreview: normalizedHeaderToken
      ? `${normalizedHeaderToken.slice(0, 6)}...${normalizedHeaderToken.slice(-6)}`
      : null,
    normalizedCookiePreview: normalizedCookieToken
      ? `${normalizedCookieToken.slice(0, 6)}...${normalizedCookieToken.slice(-6)}`
      : null,
  });
  const tokenToForward =
    normalizedHeaderToken ?? normalizedCookieToken ?? csrf ?? null;
  if (tokenToForward) {
    headers["X-CSRF-Token"] = tokenToForward;
  }
  // Forward Authorization header if present so backend can hash and deactivate that session
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers["authorization"] = incomingAuth;

  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers,
    cache: "no-store",
    // Add credentials to ensure cookies are sent and received properly
    credentials: "include",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // CRITICAL: Forward ALL backend Set-Cookie headers first
  // The backend is responsible for clearing HttpOnly cookies
  forwardSetCookies(resp, res);

  // Signal to middleware that a logout is in progress to avoid any
  // authenticated redirects or dashboard flashes during the redirect window.
  // Use a short‑lived, non-HTTP-only cookie so it is included immediately
  // on the next navigation request.
  try {
    // Prefer cookie API when available (Next 15)
    // Fallback to manual header if needed
    (res.cookies as any)?.set?.("logout_in_progress", "true", {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 15, // seconds
    });
  } catch {
    res.headers.append(
      "Set-Cookie",
      "logout_in_progress=true; Max-Age=15; Path=/; SameSite=Lax"
    );
  }

  // Invalidate Next middleware auth cache immediately
  try {
    // Extract access token from cookies to invalidate specific session (prefer access_token)
    const accessToken =
      extractCookie(incomingCookie, "access_token") ||
      extractCookie(incomingCookie, "accessToken");
    const sessionKey = accessToken || incomingCookie || "*";

    // Build absolute URL for cache invalidation
    const protocol = req.nextUrl.protocol;
    const host = req.headers.get("host") || req.nextUrl.host;
    const invalidateUrl = `${protocol}//${host}/api/auth/invalidate-cache`;

    const bodyData = JSON.stringify({
      type: "logout",
      sessionKey: sessionKey,
      userId: (req as any).user?.id, // Pass user ID if available
    });

    // SECURITY FIX: Use centralized signature generation
    const { prepareCacheInvalidationHeaders } = await import(
      "@/utils/cache-signature"
    );
    const headers = await prepareCacheInvalidationHeaders(bodyData);

    await fetch(invalidateUrl, {
      method: "POST",
      headers,
      cache: "no-store",
      body: bodyData,
    });
  } catch (err) {
    // Silently fail - cache will expire naturally
    console.error("[Logout] Cache invalidation failed:", err);
  }

  return res;
}
