"use client";

import { useEffect, useRef } from "react";
import LoginForm from "@/components/auth/login-form-simplified";

export default function LoginPage() {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Determine if we arrived here from a middleware redirect or session expiration
    let fromRedirect = false;
    let reason = "";
    try {
      const params = new URLSearchParams(window.location.search);
      fromRedirect = params.has("from_redirect");
      reason = params.get("reason") || "";
    } catch {}

    // CRITICAL: Skip auth check if:
    // 1. Coming from a middleware redirect
    // 2. Coming due to session expiration (prevents loop after logout)
    // 3. Already checked (prevents duplicate checks)
    if (
      fromRedirect ||
      hasCheckedRef.current ||
      reason === "session_expired" ||
      reason === "logged_in_elsewhere"
    ) {
      console.debug(
        "[LoginPage] Skipping auth check - redirect loop prevention (reason:",
        reason,
        ")",
      );
      return;
    }

    hasCheckedRef.current = true;

    // Minimal cookie check first - don't make API calls if no cookies
    const hasAccessToken =
      document.cookie.includes("accessToken=") &&
      !document.cookie.includes("accessToken=;") &&
      !document.cookie.includes("accessToken=deleted");

    if (!hasAccessToken) {
      console.debug(
        "[LoginPage] No access token cookie found, staying on login page",
      );
      return;
    }

    // Brief delay to let middleware complete its check first
    const timeoutId = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId2 = setTimeout(() => controller.abort(), 2000); // Short timeout

        const response = await fetch("/api/auth/me", {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId2);

        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data?.success) {
            console.debug(
              "[LoginPage] User is authenticated, redirecting to dashboard",
            );
            // Use window.location for immediate redirect to avoid React state conflicts
            window.location.replace("/dashboard/utama");
          }
        }
      } catch (error) {
        // Auth check failed or timed out, stay on login page
        console.debug(
          "[LoginPage] Auth check failed/timeout, staying on login page",
        );
      }
    }, 100); // Brief delay

    return () => clearTimeout(timeoutId);
  }, []);

  return <LoginForm />;
}
