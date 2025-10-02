"use client";

import { useEffect } from "react";
import { useMessagingCleanup } from "@/utils/messaging-cleanup";
import { logger } from "@/lib/logger";

/**
 * Component that listens to auth events and cleans up messaging state
 * Should be mounted in the app layout or messaging pages
 */
export function MessagingAuthListener() {
  const { cleanupMessaging } = useMessagingCleanup();

  useEffect(() => {
    const handleAuthLogout = async (event: any) => {
      logger.info("[MessagingAuthListener] Handling auth logout event", {
        reason: event.detail?.reason,
        timestamp: event.detail?.timestamp
      });

      try {
        await cleanupMessaging();
        logger.info("[MessagingAuthListener] Messaging cleanup completed successfully");
      } catch (error) {
        logger.error("[MessagingAuthListener] Error during messaging cleanup:", error);
      }
    };

    const handleAuthLogin = async (event: any) => {
      logger.info("[MessagingAuthListener] Handling auth login event", {
        timestamp: event.detail?.timestamp
      });

      try {
        // On login, we might want to clear any stale state as well
        // in case the user is switching accounts
        await cleanupMessaging();
        logger.info("[MessagingAuthListener] Login cleanup completed successfully");
      } catch (error) {
        logger.error("[MessagingAuthListener] Error during login cleanup:", error);
      }
    };

    const handleAuthStateChange = (event: any) => {
      logger.info("[MessagingAuthListener] Handling auth state change", {
        authenticated: event.detail?.authenticated,
        user: event.detail?.user ? 'present' : 'absent'
      });

      // If user becomes unauthenticated, trigger cleanup
      if (!event.detail?.authenticated) {
        handleAuthLogout({ detail: { reason: "auth_state_change" } });
      }
    };

    // Listen for auth events
    window.addEventListener("auth:logout", handleAuthLogout);
    window.addEventListener("auth:login", handleAuthLogin);
    window.addEventListener("auth:state-change", handleAuthStateChange);

    logger.info("[MessagingAuthListener] Auth event listeners attached");

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
      window.removeEventListener("auth:login", handleAuthLogin);
      window.removeEventListener("auth:state-change", handleAuthStateChange);
      logger.info("[MessagingAuthListener] Auth event listeners detached");
    };
  }, [cleanupMessaging]);

  // This component doesn't render anything
  return null;
}