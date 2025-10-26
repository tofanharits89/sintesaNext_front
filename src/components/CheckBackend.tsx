"use client";

import { useEffect, useRef, useState } from "react";
import { apiPath } from "@/lib/config/base-path";
import { usePathname, useRouter } from "next/navigation";
import { withBasePath } from "@/lib/config/base-path";

interface HealthCheckState {
  attempts: number;
  lastCheck: number;
  isChecking: boolean;
}

export default function CheckBackend() {
  const pathname = usePathname();
  const router = useRouter();
  const [healthState, setHealthState] = useState<HealthCheckState>({
    attempts: 0,
    lastCheck: 0,
    isChecking: false,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkBackendHealth = async (attempt: number = 1): Promise<void> => {
    if (healthState.isChecking) return;

    setHealthState((prev) => ({
      ...prev,
      isChecking: true,
      attempts: attempt,
    }));

    // Cleanup previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const ac = new AbortController();
    abortControllerRef.current = ac;

    // Progressive timeout: 3s, 5s, 8s for attempts 1, 2, 3+
    const timeoutDuration = Math.min(3000 + (attempt - 1) * 2000, 8000);
    const timeout = setTimeout(() => ac.abort(), timeoutDuration);
    timeoutRef.current = timeout;

    try {
      const response = await fetch(apiPath("/health"), {
        cache: "no-store",
        signal: ac.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeout);

      // Check for IP blocking (403 status)
      if (response.status === 403) {
        console.log('[CheckBackend] 403 response detected, checking for IP block');
        
        try {
          const raw = await response.json();
          console.log('[CheckBackend] Response data:', raw);

          // Support nested payloads: { success:false, data: { ...fields } }
          const data: any = (raw && typeof raw === 'object' && 'data' in raw && typeof raw.data === 'object') ? raw.data : raw;
          
          const isIPBlocked = data?.code === 'IP_BLOCKED' || data?.error?.toLowerCase?.().includes('blocked');
          if (isIPBlocked) {
            console.log('[CheckBackend] IP blocked detected, redirecting to IP blocked page');
            
            const expiresIn: number = typeof data?.expiresIn === 'number' ? data.expiresIn : (typeof data?.expiresAt === 'number' ? Math.max(0, Math.ceil((data.expiresAt - Date.now())/1000)) : 3600);
            const expiresAt: number | undefined = typeof data?.expiresAt === 'number' ? data.expiresAt : undefined;
            const serverBlockedAt: number | undefined = typeof data?.blockedAt === 'number' ? data.blockedAt : undefined;
            const reason: string = data?.blockReason || data?.error || 'Access temporarily blocked due to suspicious activity';
            
            // Derive stable duration and blockedAt
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
            
            setHealthState({ attempts: 0, lastCheck: Date.now(), isChecking: false });
            router.replace(`/ip-blocked?${params.toString()}`);
            return;
          }
        } catch (jsonError) {
          // If JSON parsing fails, assume it's IP block (403 is most likely IP block)
          console.warn('[CheckBackend] Failed to parse 403 response, assuming IP block:', jsonError);
          
          const params = new URLSearchParams({
            duration: '3600',
            blockedAt: String(Date.now()),
            reason: 'Access temporarily blocked',
          });
          
          setHealthState({ attempts: 0, lastCheck: Date.now(), isChecking: false });
          router.replace(`/ip-blocked?${params.toString()}`);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`Backend unhealthy: ${response.status}`);
      }

      // Success - reset state
      setHealthState({
        attempts: 0,
        lastCheck: Date.now(),
        isChecking: false,
      });
    } catch (error) {
      clearTimeout(timeout);

      // Don't retry if aborted (component unmounting or new request)
      if (error instanceof Error && error.name === "AbortError") {
        setHealthState((prev) => ({ ...prev, isChecking: false }));
        return;
      }

      const maxRetries = 3;
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("fetch"));

      if (attempt < maxRetries && isNetworkError) {
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);

        console.warn(
          `Backend health check failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms:`,
          error
        );

        setTimeout(() => {
          if (!pathname?.includes("/server-error") && !pathname?.includes("/ip-blocked")) {
            checkBackendHealth(attempt + 1);
          }
        }, retryDelay);
      } else {
        // All retries exhausted or non-recoverable error
        console.error(
          `Backend health check failed after ${attempt} attempts:`,
          error
        );
        setHealthState({
          attempts: attempt,
          lastCheck: Date.now(),
          isChecking: false,
        });

        // Only redirect if we're not already on an error page
        if (!pathname?.includes("/server-error") && !pathname?.includes("/ip-blocked")) {
          router.replace("/server-error");
        }
      }
    }
  };

  useEffect(() => {
    if (!pathname) return;

    // Avoid loop on error pages and skip health check on IP blocked page
    if (pathname.includes("/server-error") || pathname.includes("/ip-blocked")) {
      setHealthState({ attempts: 0, lastCheck: 0, isChecking: false });
      return;
    }

    // Debounce health checks - don't check more than once every 5 seconds
    const now = Date.now();
    const timeSinceLastCheck = now - healthState.lastCheck;

    if (timeSinceLastCheck < 5000 && healthState.lastCheck > 0) {
      return;
    }

    // Start health check
    checkBackendHealth(1);

    return () => {
      // Cleanup on unmount or pathname change
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setHealthState((prev) => ({ ...prev, isChecking: false }));
    };
  }, [pathname, router]);

  return null;
}
