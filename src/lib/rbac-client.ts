// Client-side RBAC utilities for frontend permission checks

// Types matching backend RBAC
export type Role =
  | "super_admin"
  | "co_admin"
  | "kantor_pusat"
  | "kanwil_djpb"
  | "kppn"
  | "lainnya";

export type ModuleName = "users" | "profile" | "dashboard" | "settings" | "messages" | "notifications";
export type PermissionMap = Record<string, boolean>;
export type RolePermissions = Record<ModuleName, PermissionMap>;

// Define permissions for each role (matching backend exactly)
export const PERMISSIONS: Record<Role, RolePermissions> = {
  super_admin: {
    users: { view: true, create: true, edit: true, delete: true, editRole: true, editLocation: true },
    profile: { editOwn: true, editOthers: true, editRole: true, editLocation: true },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: true, edit: true },
    messages: { viewAll: true, send: true, delete: true },
    notifications: { viewAll: true, create: true, delete: true },
  },
  co_admin: {
    users: { view: true, create: true, edit: true, delete: true, editRole: true, editLocation: true },
    profile: { editOwn: true, editOthers: false, editRole: true, editLocation: true },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: true, edit: false },
    messages: { viewAll: false, send: true, delete: false },
    notifications: { viewAll: true, create: true, delete: false },
  },
  kantor_pusat: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: true, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
  },
  kanwil_djpb: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: true, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
  },
  kppn: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: false, viewKPPN: true, exportData: true },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: false, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
  },
  lainnya: {
    users: { view: false, create: false, edit: false, delete: false, editRole: false, editLocation: false },
    profile: { editOwn: true, editOthers: false, editRole: false, editLocation: false },
    dashboard: { viewAll: false, viewKanwil: false, viewKPPN: false, exportData: false },
    settings: { view: false, edit: false },
    messages: { viewAll: false, send: true, delete: false },
    notifications: { viewAll: false, create: false, delete: false },
  },
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole: Role | string, module: ModuleName | string, action: string): boolean => {
  if (!userRole || !module || !action) return false;
  const rolePermissions = (PERMISSIONS as any)[userRole];
  if (!rolePermissions) return false;
  const modulePermissions = rolePermissions[module as ModuleName] as PermissionMap | undefined;
  if (!modulePermissions) return false;
  return modulePermissions[action] === true;
};

/**
 * Check if user can access settings
 */
export const canAccessSettings = (userRole: Role | string): boolean => {
  return hasPermission(userRole, "settings", "view");
};

/**
 * Check if user can edit settings
 */
export const canEditSettings = (userRole: Role | string): boolean => {
  return hasPermission(userRole, "settings", "edit");
};

/**
 * Check if user can access user management
 */
export const canAccessUserManagement = (userRole: Role | string): boolean => {
  return hasPermission(userRole, "users", "view");
};

/**
 * Check if user can edit roles and locations
 */
export const canEditRoleAndLocation = (userRole: Role | string): boolean => {
  return hasPermission(userRole, "profile", "editRole") && hasPermission(userRole, "profile", "editLocation");
};

/**
 * Get role display name with code
 */
export const getRoleDisplayName = (role: Role | string): string => {
  const roleNames: Record<string, string> = {
    super_admin: "Super Admin (X)",
    co_admin: "Co-Admin (0)",
    kantor_pusat: "Kantor Pusat (1)",
    kanwil_djpb: "Kanwil DJPb (2)",
    kppn: "KPPN (3)",
    lainnya: "User Lainnya (4)",
  };
  return roleNames[role] || (role as string);
};