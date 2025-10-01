"use client";

import { useSessionValidator } from '@/hooks/useSessionValidator';
import GlobalAuthCheck from './GlobalAuthCheck';

/**
 * Session monitoring component
 * Combines GlobalAuthCheck with periodic session validation
 * 
 * NOTE: Periodic validation temporarily disabled to prevent redirect loops
 * Relying on Socket.IO session:expired events for real-time detection
 */
export default function SessionMonitor() {
  // TEMPORARILY DISABLED: Periodic validation causes redirect loops
  // when cookies remain after session expiration
  // useSessionValidator();

  // Only run GlobalAuthCheck for initial page load validation
  return <GlobalAuthCheck />;
}
