import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  
  if (!token) {
    return NextResponse.json({ success: false, message: "No token found" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '7';
  
  try {
    const resp = await fetch(backendPath(`/analytics/login-stats/weekly?days=${days}`), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Error fetching weekly login stats:', error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch weekly login stats" },
      { status: 500 }
    );
  }
}