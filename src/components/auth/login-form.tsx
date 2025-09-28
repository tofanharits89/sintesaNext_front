"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { prefetchCsrf } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";
import { dispatchAuthEvent } from "@/utils/auth-utils";
import Image from "next/image";

const schema = z.object({
  username: z.string().min(1, "Wajib diisi"),
  password: z.string().min(1, "Wajib diisi"),
  captcha: z.string().regex(/^\d{4}$/g, "Captcha 4 digit"),
});

// Test accounts for RBAC demonstration
const testAccounts = [
  {
    username: "superadmin",
    password: "admin123",
    role: "Super Admin (X)",
    description: "Full system access",
  },
  {
    username: "coadmin",
    password: "admin123",
    role: "Co-Admin (0)",
    description: "User management",
  },
  {
    username: "kantorpusat",
    password: "user123",
    role: "Kantor Pusat (1)",
    description: "View all data",
  },
  {
    username: "kanwil",
    password: "user123",
    role: "Kanwil DJPb (2)",
    description: "View kanwil data",
  },
  {
    username: "kppn",
    password: "user123",
    role: "KPPN (3)",
    description: "View KPPN data",
  },
  {
    username: "user",
    password: "user123",
    role: "User Lainnya (4)",
    description: "Basic access",
  },
];

export default function LoginForm() {
  const router = useRouter();
  const [seed, setSeed] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Generate captcha seed only on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setSeed(Math.random().toString(36).slice(2));
  }, []);

  // Auto-regenerate captcha every 30 seconds
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setSeed(Math.random().toString(36).slice(2));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isClient]);

  const expectedCaptcha = useMemo(() => {
    if (!seed) return "0000"; // Default value during SSR
    // Simple deterministic 4-digit based on seed
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
    return ("0000" + (sum % 10000)).slice(-4);
  }, [seed]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", captcha: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      // Clear any existing user cache before login to prevent stale data
      const { QueryClient } = await import("@tanstack/react-query");
      const queryClient = new QueryClient();
      queryClient.setQueryData(["current-user-profile"], undefined);

      // Ensure CSRF token cookie is present before POST
      await prefetchCsrf();

      // Post to Next API proxy so cookies/CSRF are handled and Set-Cookie is forwarded
      const resp = await fetch(apiPath("/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, expectedCaptcha }),
      });
      const data = await resp.json().catch(() => ({}));

      const success =
        data?.success ?? data?.ok ?? (resp.ok && resp.status === 200);
      if (success) {
        toast.success("Berhasil masuk");

        // No client-side token mirroring. Auth is carried by httpOnly cookies set by backend.
        // Optionally, keep a lightweight, non-sensitive user mirror if needed (omitted here for security).

        // Dispatch auth login event for socket system
        dispatchAuthEvent("login", {
          user: data.data?.user,
          timestamp: new Date().toISOString(),
        });

        // Small delay to ensure cookies are written before redirect
        await new Promise((resolve) => setTimeout(resolve, 250));

        // Force a hard refresh to ensure fresh user data is loaded
        window.location.href = "/dashboard";
      } else {
        toast.error("Login gagal. Periksa kredensial dan captcha");
        setSeed(Math.random().toString(36).slice(2));
        form.setValue("captcha", "");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Terjadi kesalahan saat login");
      setSeed(Math.random().toString(36).slice(2));
      form.setValue("captcha", "");
    }
  }

  const handleQuickLogin = (username: string, password: string) => {
    form.setValue("username", username);
    form.setValue("password", password);
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
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
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
              <Button className="w-full" type="submit">
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Accounts Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-5 w-5" />
              Akun Testing RBAC
            </CardTitle>
            <CardDescription>
              Klik pada akun untuk auto-fill form login
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testAccounts.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() =>
                  handleQuickLogin(account.username, account.password)
                }
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{account.role}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Username:{" "}
                      <span className="font-mono">{account.username}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Password:{" "}
                      <span className="font-mono">{account.password}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {account.description}
                  </div>
                </div>
              </button>
            ))}
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Sistem RBAC membatasi akses berdasarkan role. Super Admin &
                Co-Admin dapat mengelola user. User lain hanya dapat mengubah
                profil dasar mereka.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
