/**
 * Unified Authentication Hook
 * Combines user profile data with RBAC utilities
 */

import { useUserProfile } from './use-user-profile';
import { useAuthSessionStore } from '@/stores/session-store';
import type { User } from '@/stores/session-store';
import {
  hasPermission as rbacHasPermission,
  canAccessUserManagement as rbacCanAccessUserManagement,
  canEditRoleAndLocation as rbacCanEditRoleAndLocation,
  canManageUsers as rbacCanManageUsers,
  canAccessSettings as rbacCanAccessSettings,
  filterDataByRole as rbacFilterDataByRole,
  getRoleDisplayName as rbacGetRoleDisplayName,
  type MinimalUser,
} from '@/lib/rbac';

export interface UseUnifiedAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

/**
 * Main hook for authentication and user data
 */
export function useUnifiedAuth(): UseUnifiedAuthReturn {
  const { data: user, isLoading, error } = useUserProfile();
  const isAuthenticated = useAuthSessionStore((state) => state.isAuthenticated);

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    error: error as Error | null,
  };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: MinimalUser | null | undefined,
  module: Parameters<typeof rbacHasPermission>[1],
  action: string
): boolean {
  return rbacHasPermission(user, module, action);
}

/**
 * Check if user can access user management
 */
export function canAccessUserManagement(user: MinimalUser | null | undefined): boolean {
  return rbacCanAccessUserManagement(user);
}

/**
 * Check if user can edit roles and locations
 */
export function canEditRoleAndLocation(user: MinimalUser | null | undefined): boolean {
  return rbacCanEditRoleAndLocation(user);
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: MinimalUser | null | undefined): boolean {
  return rbacCanManageUsers(user);
}

/**
 * Check if user can access settings
 */
export function canAccessSettings(user: MinimalUser | null | undefined): boolean {
  return rbacCanAccessSettings(user);
}

/**
 * Filter data based on user role and location
 */
export function filterDataByRole<T extends { kdkanwil?: string; kdkppn?: string }>(
  user: MinimalUser | null | undefined,
  data: T[]
): T[] {
  return rbacFilterDataByRole(user, data);
}

/**
 * Get role display name with code
 */
export function getRoleDisplayName(role: MinimalUser["role"]): string {
  return rbacGetRoleDisplayName(role);
}

// Re-export types for convenience
export type { User, MinimalUser };
