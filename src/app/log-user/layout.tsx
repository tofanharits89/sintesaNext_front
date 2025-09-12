import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";
import { apiPath } from "@/lib/base-path";

export default async function LogUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication via backend using cookie forwarding and enforce admin-only access
  const c = await cookies();
  const cookiePairs = c.getAll().map(({ name, value }) => `${name}=${value}`);
  const cookieHeader = cookiePairs.join("; ");
  const hasAccessToken = Boolean(c.get("accessToken")?.value);
  if (!cookieHeader) {
    redirect("/login");
  }

  try {
    // Fetch profile via backend using cookies
    const resp = await fetch(apiPath("/users/profile/me"), {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (resp.status === 401) {
      if (hasAccessToken) {
        redirect("/unauthorized?reason=log_user_access_denied");
      }
      redirect("/login");
    }

    if (!resp.ok) throw new Error("profile_failed");
    const data = await resp.json().catch(() => ({}));

    const user = data?.data;
    const role = user?.role as string | undefined;
    if (!role) {
      redirect("/unauthorized?reason=log_user_access_denied");
    }

    const allowed = role === "super_admin" || role === "co_admin";
    if (!allowed) {
      redirect("/unauthorized?reason=log_user_access_denied");
    }
  } catch {
    if (hasAccessToken) {
      redirect("/unauthorized?reason=log_user_access_denied");
    }
    redirect("/login");
  }

  return children as React.ReactElement;
}
