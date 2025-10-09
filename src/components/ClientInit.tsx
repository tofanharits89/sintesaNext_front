"use client";

import { useEffect } from "react";
import { performanceMonitor } from "@/utils/performance-monitor";
import { preloadOnIdle } from "@/utils/chunk-preloader";

/**
 * Client-side initialization component
 * Handles performance monitoring and chunk preloading
 * Ensures socket connections only happen on client-side
 */
export function ClientInit() {
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === "undefined") return;

    // Initialize performance monitoring
    performanceMonitor.measurePageLoad();

    // Preload common chunks on idle
    preloadOnIdle(() => import("@/components/ui/data-table"));
    preloadOnIdle(() => import("@/components/messaging/chat-window"));

    // Prevent WebSocket connections during hydration
    const timer = setTimeout(() => {
      // Mark client as initialized and dispatch event
      (
        window as Window & { __clientInitialized?: boolean }
      ).__clientInitialized = true;
      window.dispatchEvent(new CustomEvent("client-initialized"));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
