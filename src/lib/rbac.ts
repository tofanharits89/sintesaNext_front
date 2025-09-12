import { User } from "./users-store";

// Define a minimal user shape for RBAC checks to improve compatibility with different user sources
export type MinimalUser = {
  role?: User["role"] | string;
  kdkanwil?: string;
  kdkppn?: string;
};

// Define permissions for each role
export const PERMISSIONS = {
  // Super Admin - has all permissions
  super_admin: {
    // User Management
    users: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      editRole: true,
      editLocation: true,
    },
    // Profile Management
    profile: {
      editOwn: true,
      editOthers: true,
      editRole: true,
      editLocation: true,
    },
    // Dashboard Access
    dashboard: {
      viewAll: true,
      viewKanwil: true,
      viewKPPN: true,
      exportData: true,
    },
    // System Settings
    settings: {
      view: true,
      edit: true,
    },
  },
  
  // Co-Admin - almost all permissions except system settings
  co_admin: {
    users: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      editRole: true,
      editLocation: true,
    },
    profile: {
      editOwn: true,
      editOthers: false,
      editRole: true,
      editLocation: true,
    },
    dashboard: {
      viewAll: true,
      viewKanwil: true,
      viewKPPN: true,
      exportData: true,
    },
    settings: {
      view: true,
      edit: false,
    },
  },
  
  // Kantor Pusat - can view all data but NO user management
  kantor_pusat: {
    users: {
      view: false,  // Changed to false - no access to user management
      create: false,
      edit: false,
      delete: false,
      editRole: false,
      editLocation: false,
    },
    profile: {
      editOwn: true,
      editOthers: false,
      editRole: false,
      editLocation: false,
    },
    dashboard: {
      viewAll: true,
      viewKanwil: true,
      viewKPPN: true,
      exportData: true,
    },
    settings: {
      view: false,
      edit: false,
    },
  },
  
  // Kanwil DJPb - can view own kanwil data
  kanwil_djpb: {
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      editRole: false,
      editLocation: false,
    },
    profile: {
      editOwn: true,
      editOthers: false,
      editRole: false,
      editLocation: false,
    },
    dashboard: {
      viewAll: false,
      viewKanwil: true, // Only own kanwil
      viewKPPN: true,   // KPPNs under own kanwil
      exportData: true,
    },
    settings: {
      view: false,
      edit: false,
    },
  },
  
  // KPPN - can view own KPPN data
  kppn: {
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      editRole: false,
      editLocation: false,
    },
    profile: {
      editOwn: true,
      editOthers: false,
      editRole: false,
      editLocation: false,
    },
    dashboard: {
      viewAll: false,
      viewKanwil: false,
      viewKPPN: true, // Only own KPPN
      exportData: true,
    },
    settings: {
      view: false,
      edit: false,
    },
  },
  
  // User Lainnya - basic user with minimal permissions
  lainnya: {
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      editRole: false,
      editLocation: false,
    },
    profile: {
      editOwn: true,
      editOthers: false,
      editRole: false,
      editLocation: false,
    },
    dashboard: {
      viewAll: false,
      viewKanwil: false,
      viewKPPN: false,
      exportData: false,
    },
    settings: {
      view: false,
      edit: false,
    },
  },
} as const;

// Helper function to check if user has permission
export function hasPermission(
  user: MinimalUser | null | undefined,
  module: keyof typeof PERMISSIONS.super_admin,
  action: string
): boolean {
  if (!user || !user.role) return false;
  
  const rolePermissions = (PERMISSIONS as any)[user.role];
  if (!rolePermissions) return false;
  
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;
  
  return (modulePermissions as any)[action] === true;
}

// Check if user can access user management
export function canAccessUserManagement(user: MinimalUser | null | undefined): boolean {
  return hasPermission(user, "users", "view");
}

// Check if user can edit roles and locations
export function canEditRoleAndLocation(user: MinimalUser | null | undefined): boolean {
  return hasPermission(user, "profile", "editRole") && hasPermission(user, "profile", "editLocation");
}

// Check if user can manage other users
export function canManageUsers(user: MinimalUser | null | undefined): boolean {
  return hasPermission(user, "users", "create") || 
         hasPermission(user, "users", "edit") || 
         hasPermission(user, "users", "delete");
}

// Check if user can access settings
export function canAccessSettings(user: MinimalUser | null | undefined): boolean {
  return hasPermission(user, "settings", "view");
}

// Get filtered data based on user role and location
export function filterDataByRole<T extends { kdkanwil?: string; kdkppn?: string }>(
  user: MinimalUser | null | undefined,
  data: T[]
): T[] {
  if (!user) return [];
  
  // Super Admin, Co-Admin, and Kantor Pusat can see all data
  if (user.role === "super_admin" || user.role === "co_admin" || user.role === "kantor_pusat") {
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

// Get role display name with code
export function getRoleDisplayName(role: MinimalUser["role"]): string {
  const roleNames = {
    super_admin: "Super Admin (X)",
    co_admin: "Co-Admin (0)",
    kantor_pusat: "Kantor Pusat (1)",
    kanwil_djpb: "Kanwil DJPb (2)",
    kppn: "KPPN (3)",
    lainnya: "User Lainnya (4)",
  } as const;
  
  if (!role || typeof role !== "string") return "";
  return (roleNames as any)[role] || role;
}
