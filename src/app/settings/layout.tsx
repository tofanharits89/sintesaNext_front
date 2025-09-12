import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";
import { apiPath } from "@/lib/base-path";
import { canAccessSettings } from "@/lib/rbac-client";

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
  try {
    // Fetch profile via backend using cookies to identify user session
    const resp = await fetch(apiPath("/users/profile/me"), {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (resp.status === 401) {
      // If a session cookie exists but backend rejects, prefer unauthorized over login
      if (hasAccessToken) {
        redirect("/unauthorized?reason=settings_access_denied");
      }
      redirect("/login");
    }

    if (!resp.ok) throw new Error("profile_failed");
    const data = await resp.json().catch(() => ({}));

    const user = data?.data;
    if (!user || !user.role) {
      // Authenticated but cannot resolve role – treat as unauthorized to avoid login bounce
      redirect("/unauthorized?reason=settings_access_denied");
    }

    if (!canAccessSettings(user.role)) {
      redirect("/unauthorized?reason=settings_access_denied");
    }
  } catch (error: any) {
    if (hasAccessToken) {
      redirect("/unauthorized?reason=settings_access_denied");
    }
    redirect("/login");
  }
  return children as React.ReactElement;
}
