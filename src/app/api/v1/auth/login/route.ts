/**
 * Next.js API Route - Login
 * Forwards login requests to backend with cookie forwarding
 */

import { NextRequest, NextResponse } from "next/server";
import { forwardSetCookies } from "@/lib/cookie-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
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