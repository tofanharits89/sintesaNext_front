"use client";

/**
 * Simplified Login Form - Uses new unified useAuth hook
 * Clean architecture with single source of truth
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
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
import { withBasePath } from "@/lib/config/base-path";
import { prefetchCsrf } from "@/lib/api/httpClient";
import Image from "next/image";

// Form validation schema
const schema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  captcha: z.string().min(4, "Captcha 4 digit").max(4, "Captcha 4 digit"),
  rememberMe: z.boolean().optional().default(false),
});
const CAPTCHA_REFRESH_SECONDS = 30;
const CAPTCHA_REFRESH_MS = CAPTCHA_REFRESH_SECONDS * 1000;
// Important: with exactOptionalPropertyTypes enabled, zod input/output differ
// - input type (before parsing) allows optional fields
// - output type (after parsing) applies defaults and makes fields required
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function SimplifiedLoginForm() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaTtlSeconds, setCaptchaTtlSeconds] = useState<number | null>(null);
  const [captchaFetchedAt, setCaptchaFetchedAt] = useState<number | null>(null);
  const [captchaNextRefreshAt, setCaptchaNextRefreshAt] = useState<number | null>(null);
  const [captchaCountdown, setCaptchaCountdown] = useState<number>(CAPTCHA_REFRESH_SECONDS);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const captchaFetched = useRef(false);
  const captchaFetchInFlight = useRef(false);

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
  // Skip redirect when arriving due to logout/session_expired to prevent dashboard flash
  useEffect(() => {
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const reason = params?.get('reason');
      const isLogoutFlow = reason === 'logout' || reason === 'session_expired' ||
        (typeof window !== 'undefined' && !!sessionStorage.getItem('sintesa_logout_in_progress'));

      if (!isLoading && user && !isLogoutFlow) {
        setIsRedirecting(true);
        router.push("/dashboard/utama");
      }
    } catch {
      // fall back to original behavior
      if (!isLoading && user) {
        setIsRedirecting(true);
        router.push("/dashboard/utama");
      }
    }
  }, [user, isLoading, router]);

  const form = useForm<FormInput, any, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      captcha: "",
      rememberMe: false,
    },
  });

  // Fetch server-generated captcha
  const fetchCaptcha = useCallback(async (reason: "auto" | "manual" | "error" = "manual") => {
    if (captchaFetchInFlight.current) return;
    captchaFetchInFlight.current = true;

    try {
      const fetchedAt = Date.now();
      const resp = await fetch("/api/v1/auth/captcha", { credentials: "include", cache: "no-store" });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.success && data?.data?.code) {
        setCaptchaCode(String(data.data.code));
        const ttl = Number(data?.data?.ttl);
        setCaptchaTtlSeconds(Number.isFinite(ttl) ? ttl : null);
        setCaptchaFetchedAt(fetchedAt);

        if (reason === "auto") {
          form.setValue("captcha", "");
        }
      } else {
        setCaptchaCode("");
        setCaptchaTtlSeconds(null);
        setCaptchaFetchedAt(null);
        // Show user-friendly message when captcha service is unavailable
        if (reason === "manual" && data?.error) {
          toast.error("Layanan captcha tidak tersedia. Silakan coba lagi sebentar.");
        }
      }
    } catch {
      setCaptchaCode("");
      setCaptchaTtlSeconds(null);
      setCaptchaFetchedAt(null);
      if (reason === "manual") {
        toast.error("Gagal memuat captcha. Silakan coba lagi.");
      }
    } finally {
      captchaFetchInFlight.current = false;
      const nextAt = Date.now() + CAPTCHA_REFRESH_MS;
      setCaptchaNextRefreshAt(nextAt);
      setCaptchaCountdown(CAPTCHA_REFRESH_SECONDS);
    }
  }, [form]);

  useEffect(() => {
    if (captchaFetched.current) return;
    captchaFetched.current = true;
    void fetchCaptcha("manual");
  }, [fetchCaptcha]);

  // Auto-refresh captcha every 30 seconds with countdown indicator
  useEffect(() => {
    if (!captchaNextRefreshAt) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const remainingMs = captchaNextRefreshAt - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setCaptchaCountdown(remainingSec);

      if (
        remainingMs <= 0 &&
        !captchaFetchInFlight.current &&
        !isSubmitting &&
        !isRedirecting
      ) {
        void fetchCaptcha("auto");
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [captchaNextRefreshAt, fetchCaptcha, isSubmitting, isRedirecting]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Prevent submitting expired captcha (common after idle)
      if (captchaFetchedAt && captchaTtlSeconds) {
        const ageMs = Date.now() - captchaFetchedAt;
        if (ageMs >= captchaTtlSeconds * 1000) {
          toast.error("Captcha sudah kedaluwarsa, silakan coba lagi");
          void fetchCaptcha("manual");
          form.setValue("captcha", "");
          return;
        }
      }

      // Use the new unified login method from useAuth hook
      const result = await login(data.username, data.password, data.rememberMe, data.captcha);

      if (result.success) {
        toast.success("Login berhasil");

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

        // Wait for auth to be loaded before redirecting
        // This ensures user data is available when dashboard mounts
        setIsRedirecting(true);
        
        // Poll for auth to be loaded (max 5 seconds)
        let attempts = 0;
        const maxAttempts = 50; // 50 * 100ms = 5 seconds
        
        const waitForAuth = setInterval(() => {
          attempts++;
          
          // Check if user data is loaded
          if (user && !isLoading) {
            clearInterval(waitForAuth);
            router.push("/dashboard/utama");
          } else if (attempts >= maxAttempts) {
            // Timeout - redirect anyway
            clearInterval(waitForAuth);
            router.push("/dashboard/utama");
          }
        }, 100);
      } else {
        throw new Error(result.error || "Login gagal");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Terjadi kesalahan saat login");

      // Regenerate captcha on error
      void fetchCaptcha("error");
      form.setValue("captcha", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshCaptcha = () => {
    void fetchCaptcha("manual");
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
                        {captchaCode || "----"}
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
                    <div className="mt-1 text-xs text-muted-foreground">
                      Auto refresh in {captchaCountdown}s
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
