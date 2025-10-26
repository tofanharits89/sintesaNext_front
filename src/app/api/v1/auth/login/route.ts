/**
 * Next.js API Route - Login
 * Forwards login requests to backend with cookie forwarding
 */

import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";
import { apiPath } from "@/lib/config/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(apiPath("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    const data = await response.json();

    // Forward Set-Cookie headers
    const nextResponse = NextResponse.json(data);
    forwardSetCookies(response, nextResponse);

    return nextResponse;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
