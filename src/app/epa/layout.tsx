import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiPath } from "@/lib/base-path";
import { backendPath } from "@/lib/backend";

export default async function EPALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend using cookies (aligned with new auth/session)
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");
  const hasAccessToken = Boolean(c.get("accessToken")?.value);

  if (!cookieHeader) {
    redirect("/login");
  }

  // 1) Try via local Next API proxy (cookies forwarded automatically on server components)
  let resp: Response | null = null;
  try {
    resp = await fetch(apiPath("/users/profile/me"), {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    resp = null;
  }

  // 2) If proxy failed, call backend directly with explicit cookie header
  if (!resp) {
    try {
      resp = await fetch(backendPath("/users/profile/me"), {
        method: "GET",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
    } catch {
      redirect("/unauthorized?reason=epa_exception_fetch");
    }
  }

  if (resp.status === 401) {
    // If session cookie exists but backend rejects, avoid login bounce
    if (hasAccessToken) {
      redirect("/unauthorized?reason=epa_profile_401");
    }
    redirect("/login");
  }

  if (!resp.ok) {
    redirect("/unauthorized?reason=epa_profile_not_ok");
  }

  // Authenticated; no special RBAC required for EPA summary layout itself
  return children as React.ReactElement;
}
