import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  // Server-side guard: verify via backend
  const c = await cookies();
  const token = c.get("token")?.value;
  
  if (!token) {
    redirect("/login");
  }
  
  try {
    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      // Avoid caching SSR verification
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
