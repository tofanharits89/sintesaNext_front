import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

// Helper function to extract auth token from cookies with preference for backend-issued accessToken
function getAuthTokenFromCookies(request: NextRequest): string | null {
  // Helper: decode JWT payload safely in Node
  const decodePayload = (token: string): any | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const json = Buffer.from(parts[1], "base64").toString("utf8");
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  // Prefer httpOnly backend cookie first (kept fresh on refresh), then fall back to legacy/client mirrors
  const candidateNames = [
    "accessToken", // backend httpOnly (preferred)
    "token", // Next login httpOnly fallback
    "access_token",
    "authToken",
    "auth_token",
    "jwt",
    "authorization",
    "socket_token",
    "authState", // last to avoid stale token overriding fresh accessToken
  ];

  for (const name of candidateNames) {
    const token = request.cookies.get(name)?.value;
    if (!token || !token.trim()) continue;

    const payload = decodePayload(token);
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      // expired
      continue;
    }
    return token;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromCookies(request);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "No token found" },
      { status: 401 }
    );
  }

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: resp.status }
    );
  }

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const token = getAuthTokenFromCookies(request);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "No token found" },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
}
