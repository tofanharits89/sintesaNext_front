import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";
import { canAccessSettings } from "@/lib/rbac-client";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: verify via backend to align with new auth/session
  // Check for token in cookies (multiple possible names)
  const c = await cookies();
  const candidateNames = [
    "accessToken",
    "token",
    "authState",
    "access_token",
    "authToken",
    "auth_token",
    "socket_token",
  ];
  const authToken = (candidateNames
    .map((n) => c.get(n)?.value)
    .find((v) => typeof v === "string" && v.trim()) || null) as string | null;

  if (!authToken) {
    redirect("/login");
  }

  // Verify token with backend and check RBAC permissions
  try {
    const resp = await fetch(backendPath("/auth/verify"), {
      method: "GET",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      cache: "no-store",
    });
    if (!resp.ok) throw new Error("verify failed");
    const data = await resp.json().catch(() => ({}));
    if (!data?.success) throw new Error("invalid");

    // Check RBAC permissions for settings access
    const user = data?.data?.user;
    if (!user || !user.role) {
      throw new Error("user role not found");
    }

    // Verify user has settings access permission
    if (!canAccessSettings(user.role)) {
      redirect("/unauthorized?reason=settings_access_denied");
    }
  } catch (error: any) {
    if (
      error.message === "user role not found" ||
      error.message.includes("settings_access_denied")
    ) {
      redirect("/unauthorized?reason=settings_access_denied");
    }
    redirect("/login");
  }
  return children as React.ReactElement;
}
