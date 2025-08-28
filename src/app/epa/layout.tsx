import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export default async function EPALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend to align with new auth/session
  const c = await cookies();
  const token = c.get("token")?.value;
  if (!token) {
    redirect("/login");
  }
  try {
    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
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
