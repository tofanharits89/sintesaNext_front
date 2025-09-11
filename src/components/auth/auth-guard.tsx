import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  // Server-side guard: verify via backend by forwarding cookies (cookie-only auth)
  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  if (!cookieHeader) {
    redirect("/login");
  }

  try {
    const resp = await fetch(backendPath("/auth/verify-fast"), {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      // Strategic caching: 30s TTL for auth verification (industry standard)
      cache: "force-cache",
      next: { revalidate: 30 },
    });
    if (!resp.ok) {
      redirect("/login");
    }
    const data = await resp.json();
    if (!data?.success) {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
