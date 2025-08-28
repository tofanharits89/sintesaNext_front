import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { backendPath } from "@/lib/backend";

export default async function Home() {
  // Server-side check at root: send to dashboard if authenticated, else to login
  const c = await cookies();
  const token = c.get("token")?.value;
  if (token) {
    try {
      const resp = await fetch(backendPath("/auth/verify"), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data?.success) {
          redirect("/dashboard");
        }
      }
    } catch {
      // fall through to login
    }
  }
  redirect("/login");
}
