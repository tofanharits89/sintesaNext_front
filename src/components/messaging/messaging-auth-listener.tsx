"use client";

import { useEffect } from "react";
import { useMessagingCleanup } from "@/utils/messaging-cleanup";

/**
 * Component that listens to auth events and cleans up messaging state
 * Should be mounted in the app layout or messaging pages
 */
export function MessagingAuthListener() {
  const { cleanupMessaging } = useMessagingCleanup();

  useEffect(() => {
    const handleAuthLogout = async () => {
      console.log("[MessagingAuthListener] Logout detected, cleaning up messaging state");
      await cleanupMessaging();
    };

    const handleAuthLogin = async () => {
      console.log("[MessagingAuthListener] Login detected, messaging state will be fresh");
      // On login, we might want to clear any stale state as well
      // in case the user is switching accounts
      await cleanupMessaging();
    };

    // Listen for auth events
    window.addEventListener("auth:logout", handleAuthLogout);
    window.addEventListener("auth:login", handleAuthLogin);

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
      window.removeEventListener("auth:login", handleAuthLogin);
    };
  }, [cleanupMessaging]);

  // This component doesn't render anything
  return null;
}