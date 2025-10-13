import { NextResponse } from "next/server";

export async function GET() {
  console.log("=== TEST API ROUTE CALLED ===");
  return NextResponse.json({
    message: "Test API route is working",
    timestamp: new Date().toISOString(),
    success: true
  });
}
