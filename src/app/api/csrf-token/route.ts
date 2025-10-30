// Deprecated: CSRF tokens are now handled by the backend directly
// This route is kept for backward compatibility but should not be used
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { 
      error: "CSRF token endpoint deprecated. Tokens are now handled by backend authentication flow." 
    },
    { status: 410 } // Gone
  );
}
