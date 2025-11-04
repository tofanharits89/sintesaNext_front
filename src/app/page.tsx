import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiPath } from "@/lib/config/base-path";

export default async function Home() {
  // Server-side: forward cookies to backend for validation
  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const resp = await fetch(apiPath("/auth/session"), {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data?.success && data?.data?.authenticated) {
      redirect("/dashboard/utama");
    }
  } catch {
    // ignore network failures and fallback to login redirect below
  }

  redirect("/login");
}
