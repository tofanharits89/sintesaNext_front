import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server-side AuthGuard fallback: if middleware doesn't run, enforce auth here.
// Checks for presence of the "accessToken" httpOnly cookie and redirects to /login when missing.
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const accessToken = c.get("access_token")?.value?.trim();

  // If no access token cookie, redirect to login
  if (!accessToken) {
    redirect("/login");
  }

  // Otherwise, render children. RBAC/extra checks can be done in section-specific layouts.
  return <>{children}</>;
}
