"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    console.log("[Login Page Debug] Checking authentication:", {
      hasToken: !!token,
      tokenLength: token?.length,
    });

    if (token) {
      console.log(
        "[Login Page Debug] User already authenticated, redirecting to dashboard"
      );
      router.replace("/dashboard");
    }
  }, [router]);

  return <LoginForm />;
}
