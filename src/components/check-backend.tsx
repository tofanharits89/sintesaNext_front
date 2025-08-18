"use client";

import { useEffect } from "react";
import { backendPath } from "@/lib/backend";
import { usePathname, useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

export default function CheckBackend() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    // Avoid loop on 500 page
    if (pathname.includes("/500")) return;

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 1500);

    fetch(backendPath("/auth/health"), { cache: "no-store", signal: ac.signal })
      .then((res) => {
        clearTimeout(timeout);
        if (!res.ok) throw new Error("unhealthy");
      })
      .catch(() => {
        // If backend is down, navigate to the 500 page (basePath-aware)
        router.replace("/500");
      });

    return () => {
      clearTimeout(timeout);
      ac.abort();
    };
  }, [pathname, router]);

  return null;
}
