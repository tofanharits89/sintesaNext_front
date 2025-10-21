import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiPath } from "@/lib/base-path";

export default async function Home() {
  // Server-side: forward cookies to backend for validation
  const c = await cookies();
  const cookieHeader = c
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const resp = await fetch(apiPath("/auth/session/validate"), {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    if (data?.success) {
      redirect("/dashboard/utama");
    }
  } catch {
    // ignore
  }

  redirect("/login");
}
