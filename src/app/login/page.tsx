"use client";

import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  // Removed client-side auth check since middleware handles redirects
  // This prevents redirect loops between login and dashboard
  return <LoginForm />;
}
