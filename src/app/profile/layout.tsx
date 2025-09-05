import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend to align with new auth/session
  const c = await cookies();
  const candidateNames = [
    "accessToken",
    "token",
    "authState",
    "access_token",
    "authToken",
    "auth_token",
    "socket_token",
  ];
  const token = (candidateNames
    .map((n) => c.get(n)?.value)
    .find((v) => typeof v === "string" && v.trim()) || null) as string | null;
  if (!token) {
    redirect("/login");
  }
  try {
    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!resp.ok) throw new Error("verify failed");
    const data = await resp.json().catch(() => ({}));
    if (!data?.success) throw new Error("invalid");
  } catch {
    redirect("/login");
  }
  return children as React.ReactElement;
}
