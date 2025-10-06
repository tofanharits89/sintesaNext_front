"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { PageSpinner } from "@/components/ui/spinner";

function IPBlockedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get block duration from URL params (in seconds) or default to 1 hour
  const initialDuration = parseInt(searchParams?.get('duration') || '3600');
  const initialBlockedAt = parseInt(searchParams?.get('blockedAt') || Date.now().toString());
  const reason = searchParams?.get('reason') || 'Suspicious activity detected';
  
  const [blockDuration, setBlockDuration] = useState(initialDuration);
  const [blockedAt, setBlockedAt] = useState(initialBlockedAt);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isExpired, setIsExpired] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // Sync with backend to get real TTL from Redis and validate actual block
  useEffect(() => {
    let hasValidated = false;
    
    const syncWithBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:88/api/v1';
        const response = await fetch(`${backendUrl}/auth/me`, {
          credentials: 'include',
        });
        
        if (response.status === 403) {
          const data = await response.json();
          if (data.code === 'IP_BLOCKED' && data.expiresIn) {
            // Got real TTL from Redis, recalculate blockedAt
            const realExpiresIn = data.expiresIn;
            const realBlockedAt = Date.now() - ((3600 - realExpiresIn) * 1000);
            
            console.log('[IPBlocked] Synced with backend, real TTL:', realExpiresIn);
            setBlockDuration(3600);
            setBlockedAt(realBlockedAt);
            setTimeRemaining(realExpiresIn);
            setIsValidating(false);
          } else {
            // 403 but not IP_BLOCKED - redirect to login
            console.log('[IPBlocked] 403 but not IP blocked, redirecting to login');
            router.replace('/login');
          }
        } else if (response.ok) {
          // Block has been lifted or never existed!
          console.log('[IPBlocked] Not blocked, redirecting to login');
          if (!hasValidated) {
            // First validation - redirect to login
            router.replace('/login');
          } else {
            // Subsequent checks - block has been lifted
            setIsExpired(true);
          }
        } else {
          // Other errors (500, etc.) - assume backend is down
          console.log('[IPBlocked] Backend error, redirecting to server-error');
          router.replace('/server-error');
        }
      } catch (error) {
        console.log('[IPBlocked] Failed to sync with backend:', error);
        // Network error - assume backend is down
        if (!hasValidated) {
          router.replace('/server-error');
        }
      }
      
      hasValidated = true;
    };

    // Sync immediately on mount (handles browser restart and direct access)
    syncWithBackend();

    // Sync every 30 seconds to stay accurate
    const syncInterval = setInterval(syncWithBackend, 30000);

    return () => clearInterval(syncInterval);
  }, [router]);

  useEffect(() => {
    // Calculate actual time remaining based on when block started
    const calculateTimeRemaining = () => {
      const elapsed = Math.floor((Date.now() - blockedAt) / 1000);
      const remaining = Math.max(0, blockDuration - elapsed);
      return remaining;
    };

    // Update immediately
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);
    
    if (remaining === 0) {
      setIsExpired(true);
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
        console.log('[IPBlocked] Block expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockDuration, blockedAt]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleContactSupport = () => {
    // You can customize this to your support email or page
    window.location.href = 'mailto:support@example.com?subject=IP Blocked - Need Assistance';
  };

  if (isValidating) {
    return <PageSpinner text="Validating block status..." />;
  }

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-gradient-to-b from-background to-muted/40 p-6">
      <div className="max-w-xl w-full">
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">
              Akses Diblokir Sementara
            </CardTitle>
            <CardDescription>
              IP address Anda telah diblokir sementara karena aktivitas mencurigakan
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Countdown Timer */}
            <div className="rounded-md bg-muted p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Waktu tersisa:</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono tabular-nums">
                  {isExpired ? (
                    <span className="text-green-600">Blokir Berakhir!</span>
                  ) : (
                    <span className={timeRemaining < 60 ? "text-destructive" : ""}>
                      {formatTime(timeRemaining)}
                    </span>
                  )}
                </div>
                {!isExpired && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeRemaining < 60 
                      ? "Hampir selesai..." 
                      : `Sekitar ${Math.ceil(timeRemaining / 60)} menit lagi`}
                  </p>
                )}
              </div>
            </div>

            {/* Information */}
            <div className="rounded-md bg-muted p-4 text-sm leading-relaxed">
              <p className="mb-1 font-medium">Alasan pemblokiran:</p>
              <p className="text-muted-foreground mb-3">{reason}</p>
              
              <p className="mb-1 font-medium">Kemungkinan penyebab:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-3">
                <li>Terlalu banyak percobaan login yang gagal</li>
                <li>Terlalu banyak permintaan dalam waktu singkat</li>
                <li>Aktivitas yang terdeteksi sebagai tidak normal</li>
              </ul>
              
              <p className="mb-1 font-medium">Apa yang harus dilakukan?</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Tunggu hingga waktu blokir berakhir</li>
                <li>Pastikan Anda menggunakan kredensial yang benar</li>
                <li>Jika masalah berlanjut, hubungi tim dukungan</li>
              </ul>
            </div>
          </CardContent>
          
          {isExpired && (
            <CardFooter className="flex items-center justify-end">
              <Button onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Butuh bantuan?{" "}
          <button
            onClick={handleContactSupport}
            className="underline hover:text-foreground"
          >
            Hubungi dukungan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IPBlockedPage() {
  return (
    <Suspense fallback={<PageSpinner text="Loading..." />}>
      <IPBlockedContent />
    </Suspense>
  );
}
