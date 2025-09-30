"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side auth check as fallback if middleware fails
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard/utama');
        }
      } catch (error) {
        // User is not authenticated, stay on login page
        console.debug('Auth check failed, staying on login page');
      }
    };

    checkAuth();
  }, [router]);

  return <LoginForm />;
}
