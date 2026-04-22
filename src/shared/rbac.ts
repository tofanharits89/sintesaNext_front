/**
 * Shared RBAC Types and Configuration
 * Single source of truth for permissions across frontend and backend
 */

export type Role =
  | "super_admin"
  | "co_admin"
  | "kantor_pusat"
  | "ditpa"
  | "kanwil_djpb"
  | "kppn"
  | "lainnya";

export type ModuleName = "users" | "profile" | "dashboard" | "settings" | "messages" | "notifications" | "analytics" | "nadine";
export type PermissionMap = Record<string, boolean>;
export type RolePermissions = Record<ModuleName, PermissionMap>;

// Define permissions for each role - UNIFIED IMPLEMENTATION
export const PERMISSIONS: Record<Role, RolePermissions> = {
  super_admin: {
    users: { view: true, create: true, edit: true, delete: true, editRole: true, editLocation: true },
    profile: { editOwn: true, editOthers: true, editRole: true, editLocation: true },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: true, edit: true },
    messages: { viewAll: true, send: true, delete: true },
    notifications: { viewAll: true, create: true, delete: true },
    analytics: { view: true, export: true },
    nadine: { view: true },
  },
  co_admin: {
    users: { view: true, create: true, edit: true, delete: true, editRole: true, editLocation: true },
    profile: { editOwn: true, editOthers: false, editRole: true, editLocation: true },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: true, edit: false },
    messages: { viewAll: false, send: true, delete: false },
    notifications: { viewAll: true, create: true, delete: false },
    analytics: { view: true, export: true },
    nadine: { view: true },
  },
  kantor_pusat: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
    analytics: { view: true, export: true },
    nadine: { view: false },
  },
  ditpa: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
    analytics: { view: true, export: true },
    nadine: { view: true },
  },
  kanwil_djpb: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
    analytics: { view: true, export: true },
    nadine: { view: false },
  },
  kppn: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: false, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
    analytics: { view: true, export: false },
    nadine: { view: false },
  },
  lainnya: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: false, viewKPPN: false, exportData: false },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: true, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
    analytics: { view: false, export: false },
    nadine: { view: false },
  },
};

// Shared types for user objects
export type MinimalUser = {
  role?: Role | string;
  kdkanwil?: string;
  kdkppn?: string;
};

/**
 * Check if user has permission - UNIFIED FUNCTION
 */
export const hasPermission = (userRole: Role | string, module: ModuleName | string, action: string): boolean => {
  if (!userRole || !module || !action) return false;
  const rolePermissions = PERMISSIONS[userRole as Role];
  if (!rolePermissions) return false;
  const modulePermissions = rolePermissions[module as ModuleName] as PermissionMap | undefined;
  if (!modulePermissions) return false;
  return modulePermissions[action] === true;
};

/**
 * Get role display name - UNIFIED FUNCTION
 */
export const getRoleDisplayName = (role: Role | string): string => {
  const roleNames: Record<string, string> = {
    super_admin: "Super Admin",
    co_admin: "Co-Admin",
    kantor_pusat: "Kantor Pusat",
    ditpa: "DIT PA",
    kanwil_djpb: "Kanwil DJPb",
    kppn: "KPPN",
    lainnya: "User Lainnya",
  };
  return roleNames[role] || (role as string);
};

/**
 * Get all available roles - UNIFIED FUNCTION
 */
export const getAllRoles = (): Array<{ value: Role; label: string }> => {
  return [
    { value: "super_admin", label: "Super Admin" },
    { value: "co_admin", label: "Co-Admin" },
    { value: "kantor_pusat", label: "Kantor Pusat" },
    { value: "ditpa", label: "DIT PA" },
    { value: "kanwil_djpb", label: "Kanwil DJPb" },
    { value: "kppn", label: "KPPN" },
    { value: "lainnya", label: "User Lainnya" },
  ];
};

/**
 * Normalize potential legacy role strings
 */
export const normalizeRole = (role: MinimalUser["role"]): Role | undefined => {
  if (!role) return undefined;
  const r = String(role).toLowerCase();
  if (r === "admin") return "super_admin";
  // If role matches our known union, keep it; otherwise return undefined to fail closed
  const known = [
    "super_admin",
    "co_admin",
    "kantor_pusat",
    "ditpa",
    "kanwil_djpb",
    "kppn",
    "lainnya",
  ] as const;
  return (known as readonly string[]).includes(r) ? (r as Role) : undefined;
};

/**
 * Helper function to check if user has permission - FRONTEND COMPATIBLE
 */
export function hasPermissionFrontend(
  user: MinimalUser | null | undefined,
  module: keyof typeof PERMISSIONS.super_admin,
  action: string
): boolean {
  if (!user || !user.role) return false;
  const effectiveRole = normalizeRole(user.role);
  if (!effectiveRole) return false;
  return hasPermission(effectiveRole, module, action);
}

/**
 * Check if user can access user management
 */
export function canAccessUserManagement(user: MinimalUser | null | undefined): boolean {
  return hasPermissionFrontend(user, "users", "view");
}

/**
 * Check if user can edit roles and locations
 */
export function canEditRoleAndLocation(user: MinimalUser | null | undefined): boolean {
  return hasPermissionFrontend(user, "profile", "editRole") && hasPermissionFrontend(user, "profile", "editLocation");
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: MinimalUser | null | undefined): boolean {
  return hasPermissionFrontend(user, "users", "create") ||
    hasPermissionFrontend(user, "users", "edit") ||
    hasPermissionFrontend(user, "users", "delete");
}

/**
 * Check if user can access settings
 */
export function canAccessSettings(user: MinimalUser | null | undefined): boolean {
  return hasPermissionFrontend(user, "settings", "view");
}

/**
 * Get filtered data based on user role and location
 */
export function filterDataByRole<T extends { kdkanwil?: string; kdkppn?: string }>(
  user: MinimalUser | null | undefined,
  data: T[]
): T[] {
  if (!user) return [];

  // Super Admin, Co-Admin, and Kantor Pusat can see all data
  if (user.role === "super_admin" || user.role === "co_admin" || user.role === "kantor_pusat" || user.role === "ditpa") {
    return data;
  }

  // Kanwil DJPb can only see data from their kanwil
  if (user.role === "kanwil_djpb" && user.kdkanwil) {
    return data.filter(item => item.kdkanwil === user.kdkanwil);
  }

  // KPPN can only see data from their KPPN
  if (user.role === "kppn" && user.kdkppn) {
    return data.filter(item => item.kdkppn === user.kdkppn);
  }

  // Others see no location-specific data
  return [];
}

/**
 * Get role display name with code - FRONTEND COMPATIBLE
 */
export function getRoleDisplayNameFrontend(role: MinimalUser["role"]): string {
  const roleNames = {
    super_admin: "Super Admin (X)",
    co_admin: "Co-Admin (0)",
    kantor_pusat: "Kantor Pusat (1)",
    ditpa: "DIT PA (1)",
    kanwil_djpb: "Kanwil DJPb (2)",
    kppn: "KPPN (3)",
    lainnya: "User Lainnya (4)",
  } as const;

  if (!role || typeof role !== "string") return "";
  const effectiveRole = normalizeRole(role);
  if (!effectiveRole) return role;
  return (roleNames as Record<string, string>)[effectiveRole] || effectiveRole;
}