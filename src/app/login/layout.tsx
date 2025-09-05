import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already authenticated, redirect to dashboard
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
  const token = (candidateNames
    .map((n) => c.get(n)?.value)
    .find((v) => typeof v === "string" && v.trim()) || null) as string | null;

  if (token) {
    try {
      const resp = await fetch(backendPath("/auth/verify"), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data?.success) {
          redirect("/dashboard");
        }
      }
    } catch {
      // Invalid or not verified, let them access login page
    }
  }

  // No token or invalid token, show login page
  return <>{children}</>;
}
