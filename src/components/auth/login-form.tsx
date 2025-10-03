"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
 
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { prefetchCsrf, getCookie } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";
import { dispatchAuthEvent } from "@/utils/auth-utils";
import Image from "next/image";
import { LoginLoading } from "@/components/ui/login-loading";
import { Loader2 } from "lucide-react";

const schema = z.object({
  username: z.string().min(1, "Wajib diisi"),
  password: z.string().min(1, "Wajib diisi"),
  captcha: z.string().min(4, "Captcha 4 digit").max(4, "Captcha 4 digit"),
});

export default function LoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [seed, setSeed] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Generate captcha seed only on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setSeed(Math.random().toString(36).slice(2));
  }, []);

  // Reset redirecting state if we are on the login page (prevents stuck overlay after redirects)
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname?.startsWith('/login')) {
      setIsRedirecting(false);
    }
  }, [pathname]);

  // Auto-regenerate captcha every 30 seconds
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setSeed(Math.random().toString(36).slice(2));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isClient]);

  const expectedCaptcha = useMemo(() => {
    if (!isClient || !seed) return "0000"; // Default value during SSR
    // Simple deterministic 4-digit based on seed
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    return ("0000" + (sum % 10000)).slice(-4);
  }, [seed, isClient]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", captcha: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    console.log('Login form submitted with values:', values);
    try {
      // Only clear auth state if user is not currently in a refresh operation
      // This prevents interrupting ongoing token refresh processes
      if (typeof window !== 'undefined') {
        // Check if there's an ongoing refresh operation
        const isRefreshing = localStorage.getItem('token_refresh_in_progress');

        if (!isRefreshing) {
          // Clear all auth-related cookies client-side
          document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (['accessToken', 'refreshToken', 'authToken', 'auth_token'].includes(name)) { // SECURITY FIX: Removed socketToken
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });

          // Clear local storage auth state
          localStorage.removeItem('auth_state');
          sessionStorage.clear();
        } else {
          console.log('Skipping cache clear due to ongoing refresh operation');
        }
      }

      // Clear any existing user cache before login to prevent stale data
      const { QueryClient } = await import("@tanstack/react-query");
      const queryClient = new QueryClient();
      queryClient.setQueryData(["current-user-profile"], undefined);

      // Ensure CSRF token cookie is present before POST
      await prefetchCsrf();
      
      // Get CSRF token from cookie
      const csrfToken = getCookie("XSRF-TOKEN");

      console.log('Sending login request with CSRF token:', csrfToken);
      console.log('Expected captcha:', expectedCaptcha, 'User captcha:', values.captcha);
      
      // Use same-origin Next.js API first to ensure correct cookie domain and CSRF
      let resp;
      try {
        console.log('Trying same-origin Next.js API for login...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        resp = await fetch(apiPath("/auth/login"), {
          method: "POST",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: JSON.stringify({ ...values, expectedCaptcha }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!resp.ok) {
          throw new Error(`Next API login failed: ${resp.status}`);
        }
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        console.log('Next API login failed:', errorMessage);
        
        // As a last resort, try direct backend only if env explicitly allows it
        const directUrl = process.env.NEXT_PUBLIC_BACKEND_URL
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '')}/auth/login`
          : null;
        
        if (directUrl) {
          try {
            console.log('Trying direct backend login as fallback...', directUrl);
            const directController = new AbortController();
            const directTimeoutId = setTimeout(() => directController.abort(), 5000);
            
            resp = await fetch(directUrl, {
              method: "POST",
              credentials: "include",
              headers: { 
                "Content-Type": "application/json",
                ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
              },
              body: JSON.stringify({ ...values, expectedCaptcha }),
              signal: directController.signal,
            });
            
            clearTimeout(directTimeoutId);
            
            if (!resp.ok) {
              throw new Error(`Direct login failed: ${resp.status}`);
            }
          } catch (directError) {
            console.log('Direct backend login failed:', directError);
            throw directError;
          }
        } else {
          throw apiError;
        }
      }
      
      console.log('Login response status:', resp.status);
      const data = await resp.json().catch(() => ({}));
      console.log('Login response data:', data);

      const success =
        data?.success ?? data?.ok ?? (resp.ok && resp.status === 200);
      if (success) {
        toast.success("Berhasil masuk");

        // No client-side token mirroring. Auth is carried by httpOnly cookies set by backend.
        // Optionally, keep a lightweight, non-sensitive user mirror if needed (omitted here for security).

        // Set flag to indicate user just logged in (for socket connection timing)
        sessionStorage.setItem('just_logged_in', 'true');

        // Dispatch auth login event for socket system
        dispatchAuthEvent("login", {
          user: data.data?.user,
          timestamp: new Date().toISOString(),
        });

        // Show loading state and redirect
        setIsRedirecting(true);
        
        // Use Next.js router for smooth client-side navigation - go directly to utama
        router.push("/dashboard/utama");
      } else {
        console.log('Login failed with data:', data);
        toast.error(data?.error || data?.message || "Login gagal. Periksa kredensial dan captcha");
        setSeed(Math.random().toString(36).slice(2));
        form.setValue("captcha", "");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      if (errorName === 'AbortError') {
        toast.error("Login timeout. Periksa koneksi server.");
      } else {
        toast.error("Terjadi kesalahan saat login");
      }
      setSeed(Math.random().toString(36).slice(2));
      form.setValue("captcha", "");
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <>
      <LoginLoading isVisible={isRedirecting} />
      <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              {/* Brand logo – CSS toggles by theme to avoid SSR mismatch and persist on refresh */}
              {/* Dark variant shown on light theme (default), hidden on dark */}
              <Image
                src={withBasePath("/snext_logoonly_dark.svg")}
                alt="sintesaNEXT"
                width={32}
                height={32}
                className="rounded dark:hidden"
                style={{ height: "auto" }}
              />
              {/* Light variant shown on dark theme */}
              <Image
                src={withBasePath("/snext_logoonly_light.svg")}
                alt="sintesaNEXT"
                width={32}
                height={32}
                className="rounded hidden dark:inline"
                style={{ height: "auto" }}
              />
              {/* Wordmark – dark version on light theme */}
              <Image
                src={withBasePath("/snext_typeonly_dark.svg")}
                alt="sintesaNEXT"
                width={120}
                height={24}
                className="dark:hidden"
                style={{ height: "auto" }}
              />
              {/* Wordmark – light version on dark theme */}
              <Image
                src={withBasePath("/snext_typeonly_light.svg")}
                alt="sintesaNEXT"
                width={120}
                height={24}
                className="hidden dark:inline"
                style={{ height: "auto" }}
              />
            </div>

            <CardDescription>
              Sistem Informasi Terpadu Pelaksanaan Anggaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="captcha">Captcha</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="captcha"
                    placeholder="4 digit"
                    maxLength={4}
                    {...form.register("captcha")}
                  />
                  <div
                    className={cn(
                      "select-none rounded-md border px-3 py-2 text-base tracking-widest font-mono bg-muted"
                    )}
                  >
                    {isClient ? expectedCaptcha : "0000"}
                  </div>
                </div>
                {form.formState.errors.captcha && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.captcha.message}
                  </p>
                )}
              </div>
              <Button 
                className="w-full" 
                type="submit"
                disabled={form.formState.isSubmitting || isRedirecting}
                onClick={(e) => {
                  console.log('Button clicked');
                  if (!form.formState.isValid) {
                    console.log('Form validation errors:', form.formState.errors);
                  }
                }}
              >
                {form.formState.isSubmitting || isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRedirecting ? "Redirecting..." : "Silahkan tunggu..."}
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
