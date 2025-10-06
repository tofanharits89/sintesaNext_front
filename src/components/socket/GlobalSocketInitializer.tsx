"use client";
import { useEffect } from "react";
import { socketClient } from "@/lib/SocketClient";
import { usePathname } from "next/navigation";

/**
 * Global Socket Initializer Component
 *
 * This component ensures socket connection is established for all authenticated pages.
 * It handles multiple scenarios:
 * - Post-login connection establishment
 * - Page refresh on any authenticated page
 * - Navigation between pages
 * - Socket reconnection if disconnected
 *
 * The socket will NOT connect on public pages like /login, /unauthorized, /server-error
 */
export function GlobalSocketInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't connect socket on public/auth pages
    const publicPages = [
      "/login",
      "/unauthorized",
      "/server-error",
      "/not-found",
    ];
    const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));

    if (isPublicPage) {
      console.log(
        "[GlobalSocketInitializer] Skipping socket connection on public page:",
        pathname
      );
      return;
    }

    console.log(
      "[GlobalSocketInitializer] Initializing socket connection for:",
      pathname
    );

    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem("just_logged_in");

    // Check current socket state
    const currentState = socketClient.getState();
    console.log(
      "[GlobalSocketInitializer] Current socket state:",
      currentState
    );
    console.log("[GlobalSocketInitializer] Just logged in flag:", justLoggedIn);

    // Clear the just_logged_in flag if present
    if (justLoggedIn === "true") {
      console.log(
        "[GlobalSocketInitializer] Detected fresh login, clearing flag"
      );
      sessionStorage.removeItem("just_logged_in");
    }

    // Check if logout is in progress - prevent reconnection
    // Check both window and sessionStorage for persistence across redirect
    const isLoggingOut =
      (typeof window !== "undefined" && (window as any).__isLoggingOut) ||
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("__isLoggingOut") === "true");

    console.log("[GlobalSocketInitializer] Logout flag check:", {
      isLoggingOut,
      pathname,
      windowFlag:
        typeof window !== "undefined"
          ? (window as any).__isLoggingOut
          : undefined,
      sessionStorageFlag:
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("__isLoggingOut")
          : undefined,
    });

    if (isLoggingOut) {
      console.log(
        "[GlobalSocketInitializer] Logout in progress, skipping socket connection"
      );
      return;
    }

    // Attempt to connect if not already connected
    // This handles: page refresh, direct navigation, and post-login scenarios
    if (currentState === "disconnected" || currentState === "error") {
      console.log("[GlobalSocketInitializer] Attempting to connect socket...");

      // Add a small delay for post-login scenarios to ensure cookies are set
      const connectionDelay = justLoggedIn === "true" ? 1000 : 0;

      setTimeout(() => {
        // Double-check logout flag before connecting
        const isLoggingOutNow =
          (typeof window !== "undefined" && (window as any).__isLoggingOut) ||
          (typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("__isLoggingOut") === "true");

        if (isLoggingOutNow) {
          console.log(
            "[GlobalSocketInitializer] Logout detected during connection delay, aborting"
          );
          return;
        }

        socketClient
          .connect()
          .then(() => {
            const newState = socketClient.getState();
            console.log(
              "[GlobalSocketInitializer] Socket connection successful, new state:",
              newState
            );
          })
          .catch((error) => {
            console.error(
              "[GlobalSocketInitializer] Socket connection failed:",
              error
            );

            // Retry connection after a delay if first attempt fails
            setTimeout(() => {
              // Check logout flag before retry
              const isLoggingOutRetry =
                (typeof window !== "undefined" &&
                  (window as any).__isLoggingOut) ||
                (typeof sessionStorage !== "undefined" &&
                  sessionStorage.getItem("__isLoggingOut") === "true");

              if (isLoggingOutRetry) {
                console.log(
                  "[GlobalSocketInitializer] Logout detected before retry, aborting"
                );
                return;
              }

              console.log(
                "[GlobalSocketInitializer] Retrying socket connection..."
              );
              socketClient
                .connect()
                .then(() => {
                  const retryState = socketClient.getState();
                  console.log(
                    "[GlobalSocketInitializer] Socket retry connection successful, state:",
                    retryState
                  );
                })
                .catch((retryError) => {
                  console.error(
                    "[GlobalSocketInitializer] Socket retry connection failed:",
                    retryError
                  );
                });
            }, 2000);
          });
      }, connectionDelay);
    } else if (currentState === "connected") {
      console.log("[GlobalSocketInitializer] Socket already connected");
    }

    // Cleanup on unmount
    return () => {
      console.log(
        "[GlobalSocketInitializer] Cleanup - socket will remain connected for other pages"
      );
    };
  }, [pathname]); // Re-run when pathname changes to handle navigation

  // This component doesn't render anything visible
  return null;
}
