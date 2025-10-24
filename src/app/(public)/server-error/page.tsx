"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { RetryActions } from "@/components/RetryActions";
import AutoRetry from "@/components/AutoRetry";
import { apiPath } from "@/lib/base-path";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServerErrorPage() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate that backend is actually unreachable
    // If backend is reachable, redirect to appropriate page
    const validateBackendDown = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(apiPath("/health"), {
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If backend responds successfully, redirect away
        if (response.ok) {
          console.log("[ServerError] Backend is up, redirecting to login");
          router.replace("/login");
          return;
        }

        // Check for IP block (403)
        if (response.status === 403) {
          try {
            const data = await response.json();
            if (data.code === 'IP_BLOCKED' || data.error?.includes('blocked')) {
              console.log("[ServerError] IP is blocked, redirecting to ip-blocked page");
              
              const expiresIn: number = typeof data.expiresIn === 'number' ? data.expiresIn : 3600;
              const expiresAt: number | undefined = typeof data.expiresAt === 'number' ? data.expiresAt : undefined;
              const serverBlockedAt: number | undefined = typeof data.blockedAt === 'number' ? data.blockedAt : undefined;
              const reason = data.blockReason || data.error || 'Access temporarily blocked';
              const DEFAULT_MS = 3600 * 1000;
              let finalBlockedAt: number;
              let finalDurationSec: number;
              if (typeof serverBlockedAt === 'number' && typeof expiresAt === 'number') {
                finalBlockedAt = serverBlockedAt;
                finalDurationSec = Math.max(1, Math.ceil((expiresAt - serverBlockedAt) / 1000));
              } else if (typeof expiresAt === 'number') {
                finalBlockedAt = expiresAt - DEFAULT_MS;
                finalDurationSec = 3600;
              } else {
                finalBlockedAt = Date.now() - ((3600 - expiresIn) * 1000);
                finalDurationSec = 3600;
              }
              
              const params = new URLSearchParams({
                duration: String(finalDurationSec),
                blockedAt: String(finalBlockedAt),
                reason,
              });
              
              router.replace(`/ip-blocked?${params.toString()}`);
              return;
            }
          } catch (jsonError) {
            // Failed to parse JSON, stay on server-error page
          }
        }

        // Backend is down (other status codes), stay on this page
        setIsValidating(false);
      } catch (error) {
        // Network error, backend is truly down, stay on this page
        console.log("[ServerError] Backend is down, staying on error page");
        setIsValidating(false);
      }
    };

    validateBackendDown();
  }, [router]);

  if (isValidating) {
    return (
      <div className="min-h-[100svh] w-full flex items-center justify-center bg-zinc-100 dark:bg-black p-6">
        <div className="max-w-xl w-full">
          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <Skeleton className="h-6 w-64 mx-auto" />
              <Skeleton className="h-4 w-72 mx-auto" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 text-sm leading-relaxed space-y-2">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end">
              <Skeleton className="h-9 w-28" />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-zinc-100 dark:bg-black p-6">
      <div className="max-w-xl w-full">
        <AutoRetry />
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">
              Tidak dapat terhubung ke server
            </CardTitle>
            <CardDescription>
              Sistem kami mengalami kendala saat menghubungkan ke backend. Ini
              biasanya bersifat sementara.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 text-sm leading-relaxed">
              <p className="mb-1 font-medium">Kemungkinan penyebab:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Server sedang pemeliharaan atau restart</li>
                <li>Koneksi internet Anda terputus</li>
                <li>Terjadi gangguan jaringan sementara</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end">
            <RetryActions />
          </CardFooter>
        </Card>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Butuh bantuan?{" "}
          <a
            className="underline hover:text-foreground"
            href="mailto:support@example.com"
          >
            Hubungi dukungan
          </a>
        </div>
      </div>
    </div>
  );
}
