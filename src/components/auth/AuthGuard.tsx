import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server-side AuthGuard fallback: if middleware doesn't run, enforce auth here.
// Checks for presence of the single-session "sid" cookie and redirects to /login when missing.
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const sid = c.get("sid")?.value?.trim();

  // If no access token cookie, redirect to login
  if (!sid) {
    redirect("/login");
  }

  // Otherwise, render children. RBAC/extra checks can be done in section-specific layouts.
  return <>{children}</>;
}
