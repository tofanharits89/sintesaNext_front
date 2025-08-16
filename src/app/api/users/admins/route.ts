import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  
  if (!token) {
    return NextResponse.json(
      { success: false, message: "No token found" }, 
      { status: 401 }
    );
  }
  
  try {
    const resp = await fetch(backendPath("/users/admins"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await resp.json().catch(() => ({}));
    
    if (!resp.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || "Failed to fetch admin users",
          error: data.error 
        }, 
        { status: resp.status }
      );
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
