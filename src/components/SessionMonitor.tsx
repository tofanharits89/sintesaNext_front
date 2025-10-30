"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Simplified Session Monitoring Component
 * Legacy component - no longer needed with new useAuth hook
 *
 * The new useAuth hook manages session state automatically,
 * so this component can be safely removed from your component tree.
 */
export default function SessionMonitor() {
  const { refetch } = useAuth();

  // Optional: Auto-refetch session if needed
  // refetch();

  return null; // No additional components needed
}
