import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiPath } from "@/lib/config/base-path";
import { backendPath } from "@/lib/api/backend";
import { canAccessUserManagement } from "@/lib/security/rbac-client";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend using cookie forwarding (no bearer token required)
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");
  const hasAccessToken = Boolean(c.get("access_token")?.value) || Boolean(c.get("accessToken")?.value);
  if (!cookieHeader) {
    redirect("/login");
  }
  try {
    // Prefer local Next API proxy first (cookies are forwarded automatically in server components)
    let resp: Response | null = null;
    try {
      resp = await fetch(apiPath("/users/profile/me"), {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
    } catch {
      resp = null;
    }
    // Fallback: call backend directly with explicit cookie header
    if (!resp) {
      resp = await fetch(backendPath("/users/profile/me"), {
        method: "GET",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
    }

    if (resp.status === 401) {
      if (hasAccessToken) {
        redirect("/unauthorized?reason=user_management_access_denied");
      }
      redirect("/login");
    }

    if (!resp.ok) throw new Error("profile_failed");
    const data = await resp.json().catch(() => ({}));

    const user = data?.data?.user || data?.data;
    if (!user || !user.role) {
      redirect("/unauthorized?reason=user_management_access_denied");
    }

    if (!canAccessUserManagement(user.role)) {
      redirect("/unauthorized?reason=user_management_access_denied");
    }
  } catch (error) {
    if (hasAccessToken) {
      redirect("/unauthorized?reason=user_management_access_denied");
    }
    redirect("/login");
  }
  return children as React.ReactElement;
}
