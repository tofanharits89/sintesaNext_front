/**
 * Consolidated Auth Module - Simplified
 * Single entry point for all authentication functionality
 *
 * Now using the new unified useAuth hook from @/hooks/useAuth
 */

// Client exports
export {
  AuthClient,
  authClient,
  type User as AuthUser,
} from "./client";

// Main hook export
export { useAuth } from "@/hooks/useAuth";
export type { User, UseAuthReturn } from "@/hooks/useAuth";

// Default export
export { useAuth as default } from "@/hooks/useAuth";
