import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// Fetch via Next API proxy to preserve browser cookies reliably
import { apiPath } from "@/lib/base-path";
import { canAccessSettings } from "@/lib/rbac-client";
import { backendPath } from "@/lib/backend";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend to align with new auth/session
  // Forward full cookie header to backend verify (do not rely on bearer token)
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");
  const hasAccessToken = Boolean(c.get("accessToken")?.value);
  if (!cookieHeader) {
    redirect("/login");
  }

  // Verify token with backend and check RBAC permissions
  // 1) Try via local Next API proxy (cookies are forwarded automatically)
  let resp: Response | null = null;
  try {
    resp = await fetch(apiPath("/users/profile/me"), {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    resp = null;
  }

  // 2) If local proxy errored, retry directly to backend with explicit cookie header
  if (!resp) {
    try {
      resp = await fetch(backendPath("/users/profile/me"), {
        method: "GET",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
    } catch {
      // Both attempts failed at network level
      redirect("/unauthorized?reason=settings_exception_fetch");
    }
  }

  if (resp.status === 401) {
    // If a session cookie exists but backend rejects, prefer unauthorized over login
    if (hasAccessToken) {
      redirect("/unauthorized?reason=settings_profile_401");
    }
    redirect("/login");
  }

  if (!resp.ok) {
    redirect("/unauthorized?reason=settings_profile_not_ok");
  }
  const data = await resp.json().catch(() => ({}));

  const user = data?.data;
  if (!user || !user.role) {
    // Authenticated but cannot resolve role – treat as unauthorized to avoid login bounce
    redirect("/unauthorized?reason=settings_no_role");
  }

  if (!canAccessSettings(user.role)) {
    redirect("/unauthorized?reason=settings_rbac_denied");
  }
  return children as React.ReactElement;
}
