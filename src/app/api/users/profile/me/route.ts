import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

// Helper function to extract auth token from cookies (same logic as auth-utils.ts)
function getAuthTokenFromCookies(request: NextRequest): string | null {
  // First check for the authState cookie (primary cookie set by backend)
  const authState = request.cookies.get("authState")?.value;
  if (authState && authState.trim()) {
    const parts = authState.split(".");
    if (parts.length === 3) {
      try {
        // Decode payload to check expiry
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          return authState;
        }
      } catch (decodeError) {
        // Continue to fallback options if authState is invalid
      }
    }
  }

  // Fallback: Try other possible cookie names
  const possibleTokenNames = [
    "accessToken",
    "access_token",
    "authToken",
    "auth_token",
    "token",
    "jwt",
    "authorization",
  ];

  for (const tokenName of possibleTokenNames) {
    const token = request.cookies.get(tokenName)?.value;

    if (token && token.trim()) {
      // Basic JWT format validation
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          // Decode payload to check expiry
          const payload = JSON.parse(atob(parts[1]));

          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            continue;
          }

          return token;
        } catch (decodeError) {
          continue;
        }
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromCookies(request);
  
  if (!token) {
    return NextResponse.json({ success: false, message: "No token found" }, { status: 401 });
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
    return NextResponse.json({ success: false, message: "No token found" }, { status: 401 });
  }
  
  const body = await request.json();
  
  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(body),
  });
  
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
}