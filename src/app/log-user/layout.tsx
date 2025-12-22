import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/config/config";
import { apiPath } from "@/lib/config/base-path";

export default async function LogUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication via backend using cookie forwarding and enforce admin-only access
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");
  const hasSid = Boolean(c.get("sid")?.value) || /(?:^|;\s*)sid=/.test(cookieHeader);
  if (!hasSid) {
    redirect("/login");
  }

  // 1) Try via local Next API proxy (cookies auto-forwarded in server components)
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

  // 2) If local proxy errored, retry directly to backend with explicit cookie header
  if (!resp) {
    try {
      resp = await fetch(backendPath("/users/profile/me"), {
        method: "GET",
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
    } catch {
      redirect("/unauthorized?reason=log_user_exception_fetch");
    }
  }

  if (resp.status === 401) {
    redirect("/login");
  }

  if (!resp.ok) {
    redirect("/unauthorized?reason=log_user_profile_not_ok");
  }

  const data = await resp.json().catch(() => ({}));
  const user = data?.data?.user || data?.data;
  const role = user?.role as string | undefined;
  if (!role) {
    redirect("/unauthorized?reason=log_user_no_role");
  }

  const allowed = role === "super_admin" || role === "co_admin";
  if (!allowed) {
    redirect("/unauthorized?reason=log_user_rbac_denied");
  }

  return children as React.ReactElement;
}
