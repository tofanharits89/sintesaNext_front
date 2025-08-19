import type { NextRequest } from "next/server";

export function getToken(req: NextRequest): string | null {
  const candidateNames = [
    "token",
    "accessToken",
    "authState",
    "authToken",
    "access_token",
    "auth_token",
  ];
  for (const name of candidateNames) {
    const v = req.cookies.get(name)?.value;
    if (v && v.trim()) return v;
  }
  return null;
}

