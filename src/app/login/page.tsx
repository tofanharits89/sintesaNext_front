"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { backendPath } from "@/lib/backend";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        // Rely on httpOnly cookies: ask backend directly
        const resp = await fetch(backendPath("/auth/session/validate"), {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await resp.json().catch(() => ({}));
        console.log("[Login Page Debug] Backend session validate:", data);
        if (!cancelled && data?.success) {
          router.replace("/dashboard");
        }
      } catch (e) {
        // ignore; show login form
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <LoginForm />;
}
