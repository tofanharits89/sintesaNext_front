"use client";

import LoginForm from "@/components/auth/LoginFormSimplified";

/**
 * Simplified Login Page - Trusts middleware for authentication
 *
 * Authentication flow:
 * 1. Middleware handles all auth logic (token validation, redirects)
 * 2. Login page only renders the form
 * 3. No client-side auth checking needed (prevents race conditions)
 */
export default function LoginPage() {
  // Simply render the login form
  // All authentication logic is handled by middleware.ts
  return <LoginForm />;
}
