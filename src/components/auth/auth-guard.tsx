import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  // Server-side guard: verify via backend by forwarding cookies (cookie-only auth)
  const c = await cookies();
  // Only forward accessToken to backend to prevent legacy cookie names from faking auth
  const accessToken = c.get("accessToken")?.value?.trim();
  const cookieHeader = accessToken ? `accessToken=${accessToken}` : "";
  if (!cookieHeader) {
    redirect("/login");
  }

  try {
    const resp = await fetch(backendPath("/auth/verify-fast"), {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      // Disable caching to avoid stale auth state after token expiry
      cache: "no-store",
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
