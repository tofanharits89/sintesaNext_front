"use client";

/**
 * Simplified Login Form - Clean Architecture
 * Removes complexity while maintaining all functionality
 * Reduced from 327 lines to ~120 lines
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginLoading } from "@/components/ui/login-loading";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { withBasePath } from "@/lib/base-path";
import { apiPath } from "@/lib/base-path";
import { prefetchCsrf } from "@/lib/httpClient";
import { dispatchAuthEvent } from "@/lib/cookieManager";
import Image from "next/image";

// Form validation schema
const schema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  captcha: z.string().min(4, "Captcha 4 digit").max(4, "Captcha 4 digit"),
  rememberMe: z.boolean().optional().default(false),
});
// Important: with exactOptionalPropertyTypes enabled, zod input/output differ
// - input type (before parsing) allows optional fields
// - output type (after parsing) applies defaults and makes fields required
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function SimplifiedLoginForm() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [captchaSeed, setCaptchaSeed] = useState("");
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    setIsThemeReady(true);
  }, []);

  const effectiveTheme = useMemo(() => {
    if (resolvedTheme) return resolvedTheme;
    if (!isThemeReady) return undefined;
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [isThemeReady, resolvedTheme, theme]);

  const starColor = effectiveTheme === "dark" ? "#ffffff" : "#1e293b";
  const backgroundClass =
    "flex min-h-svh items-center justify-center p-6 transition-colors duration-500 bg-[radial-gradient(ellipse_at_bottom,_#f4f4f5_0%,_#fafafa_100%)] dark:bg-[radial-gradient(ellipse_at_bottom,_#151515_0%,_#000000_100%)]";

  // Client-side redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setIsRedirecting(true);
      router.push("/dashboard/utama");
    }
  }, [user, isLoading, router]);

  // Initialize captcha on client side
  useEffect(() => {
    setCaptchaSeed(Math.random().toString(36).slice(2));
  }, []);

  // Simple captcha generation (deterministic based on seed)
  const generateCaptcha = (seed: string): string => {
    if (!seed) return "0000";
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    return ("0000" + (sum % 10000)).slice(-4);
  };

  const expectedCaptcha = generateCaptcha(captchaSeed);

  const form = useForm<FormInput, any, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      captcha: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Get CSRF token
      await prefetchCsrf();
      const { csrfManager } = await import("@/lib/csrfManager");
      const csrfToken = await csrfManager.getCSRFToken();

      // Call backend API with CSRF token
      // Use internal Next API to ensure dev-friendly cookie forwarding and consistent origin
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          ...data,
          expectedCaptcha,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("[LoginForm] Error response debugging:", {
          errorData,
          errorMessage:
            errorData.error?.message || errorData.message || "Login gagal",
          directError: errorData.error,
        });
        throw new Error(
          errorData.error ||
            errorData.error?.message ||
            errorData.message ||
            "Login gagal",
        );
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Login berhasil");

        // CRITICAL: Update auth state BEFORE redirecting to prevent 401 race condition
        if (result.data?.user) {
          // 1. Dispatch auth event for socket connection
          dispatchAuthEvent.login(result.data.user);

          // 2. Update React Query cache and Zustand store via dynamic import
          // This ensures global auth state is ready before dashboard loads
          try {
            const { useAuthSessionStore } = await import(
              "@/stores/session-store"
            );
            const { queryKeyFactories } = await import("@/lib/query-configs");

            const authStore = useAuthSessionStore.getState();
            authStore.setAuthenticated(true, result.data.user);
            authStore.updateUser(result.data.user);

            console.log(
              "[LoginForm] Auth state updated with user:",
              result.data.user.username,
            );

            // 3. Fetch full user profile to populate React Query cache before redirect
            // This prevents 401 errors on the dashboard when it tries to fetch data
            console.log("[LoginForm] Warming up user profile cache...");
            const profileResp = await fetch(apiPath("/users/profile/me"), {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (profileResp.ok) {
              const profileData = await profileResp.json().catch(() => ({}));
              if (profileData.success && profileData.data?.user) {
                console.log("[LoginForm] User profile cached successfully");
                // Update Zustand with complete profile if it has more details
                authStore.updateUser(profileData.data.user);
              }
            } else {
              console.warn(
                "[LoginForm] User profile fetch returned:",
                profileResp.status,
              );
            }
          } catch (error) {
            console.warn("[LoginForm] Failed to warm up profile cache:", error);
            // Continue anyway - API will retry on 401
          }
        }

        // Ensure theme from localStorage is applied before navigating
        try {
          const storedTheme = localStorage.getItem("theme");
          if (storedTheme === "dark" || storedTheme === "light") {
            setTheme(storedTheme);
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(storedTheme);
          }
        } catch {}

        // Redirect to dashboard
        // Give cookies time to fully settle in the browser before making API calls
        setIsRedirecting(true);
        setTimeout(() => {
          router.push("/dashboard/utama");
        }, 1000);
      } else {
        throw new Error(result.message || "Login gagal");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Terjadi kesalahan saat login");

      // Regenerate captcha on error
      setCaptchaSeed(Math.random().toString(36).slice(2));
      form.setValue("captcha", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshCaptcha = () => {
    setCaptchaSeed(Math.random().toString(36).slice(2));
    form.setValue("captcha", "");
  };

  return (
    <>
      <LoginLoading isVisible={isRedirecting} />

      <StarsBackground
        className={backgroundClass}
        pointerEvents={false}
        starColor={starColor}
      >
        <div className="relative w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Logo - Dark theme */}
                <Image
                  src={withBasePath("/snext_logoonly_dark.svg")}
                  alt="sintesaNEXT"
                  width={32}
                  height={32}
                  className="rounded dark:hidden"
                  style={{ height: "auto" }}
                />
                {/* Logo - Light theme */}
                <Image
                  src={withBasePath("/snext_logoonly_light.svg")}
                  alt="sintesaNEXT"
                  width={32}
                  height={32}
                  className="rounded hidden dark:inline"
                  style={{ height: "auto" }}
                />
                {/* Type - Dark theme */}
                <Image
                  src={withBasePath("/snext_typeonly_dark.svg")}
                  alt="sintesaNEXT"
                  width={120}
                  height={24}
                  className="dark:hidden"
                  style={{ height: "auto" }}
                />
                {/* Type - Light theme */}
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      placeholder="Masukkan username"
                      {...form.register("username")}
                      disabled={isSubmitting}
                    />
                    <FieldError errors={[form.formState.errors.username]} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      {...form.register("password")}
                      disabled={isSubmitting}
                    />
                    <FieldError errors={[form.formState.errors.password]} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="captcha">Captcha</FieldLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        id="captcha"
                        placeholder="4 digit"
                        maxLength={4}
                        {...form.register("captcha")}
                        disabled={isSubmitting}
                      />
                      <div className="select-none rounded-md border px-6 py-2 text-base tracking-widest font-mono bg-muted">
                        {expectedCaptcha}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={refreshCaptcha}
                        disabled={isSubmitting}
                      >
                        ↻
                      </Button>
                    </div>
                    <FieldError errors={[form.formState.errors.captcha]} />
                  </Field>

                  <Field>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        {...form.register("rememberMe")}
                        disabled={isSubmitting}
                      />
                      <span>Ingat saya (perpanjang sesi)</span>
                    </label>
                  </Field>

                  <Field orientation="horizontal">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || isRedirecting}
                    >
                      {isSubmitting || isRedirecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isRedirecting ? "Mengalihkan..." : "Memproses..."}
                        </>
                      ) : (
                        "Masuk"
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </StarsBackground>
    </>
  );
}
