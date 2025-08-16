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
    const resp = await fetch(backendPath("/users"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to fetch users",
          error: data.error,
        },
        { status: resp.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const body = await request.json();
  const resp = await fetch(backendPath("/users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(
    { data: data?.data ?? null },
    { status: resp.ok ? 200 : 400 }
  );
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const body = await request.json();
  const id = body?.id;
  const resp = await fetch(backendPath(`/users/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(
    { data: data?.data ?? null },
    { status: resp.ok ? 200 : 400 }
  );
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const ids = url.searchParams.getAll("ids");
  let status = 400;
  let payload: any = { ok: false };
  if (id) {
    const resp = await fetch(backendPath(`/users/${id}`), {
      method: "DELETE",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    status = resp.ok ? 200 : 400;
    payload = { ok: resp.ok };
  } else if (ids?.length) {
    // batch delete not implemented on backend; delete sequentially
    let deleted = 0;
    for (const uid of ids) {
      const resp = await fetch(backendPath(`/users/${uid}`), {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (resp.ok) deleted++;
    }
    status = 200;
    payload = { deleted };
  }
  return NextResponse.json(payload, { status });
}
