"use client";

import { useEffect, useRef } from "react";
import { backendPath } from "@/lib/backend";
import { withBasePath } from "@/lib/base-path";

export default function AutoRetry() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    function tick() {
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 2000);
      fetch(backendPath("/auth/health"), { cache: "no-store", signal: ac.signal })
        .then((res) => {
          clearTimeout(timeout);
          if (res.ok) {
            // Backend is up again, go to dashboard
            window.location.href = withBasePath("/dashboard");
          }
        })
        .catch(() => {
          // ignore; will try again on next interval
        });
    }

    // Start interval (every 30 seconds)
    intervalRef.current = window.setInterval(tick, 30000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}

