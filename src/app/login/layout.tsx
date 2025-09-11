import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendPath } from "@/lib/backend";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check is now handled by middleware - no need for additional checks

  // No token or invalid token, show login page
  return <>{children}</>;
}
