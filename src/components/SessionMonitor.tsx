"use client";

import { useUnifiedAuth } from '@/lib/auth';

/**
 * Simplified Session Monitoring Component
 * Uses unified auth hook for all authentication and session management
 * Single source of truth for auth state
 */
export default function SessionMonitor() {
  // SSOT auth management handles everything
  const { validateSession } = useUnifiedAuth();
  
  // Optional: Auto-validate session periodically if you want continuous monitoring
  // validateSession();

  return null; // No additional components needed
}
