/**
 * Role-Based Access Control utilities for Satker search
 */

import type { User } from "@/hooks/useAuth";

interface SatkerItem {
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
  kdkanwil: string;
}

/**
 * Filter satker data based on user's role and kdkanwil
 * @param satkerData - Array of satker items
 * @param user - Current user object
 * @returns Filtered array of satker items based on user's access level
 */
export function filterSatkerByUserAccess(
  satkerData: SatkerItem[],
  user: User | null | undefined
): SatkerItem[] {
  // If no user is authenticated, return empty array
  if (!user) {
    return [];
  }

  // Super admin and co-admin can see all satkers
  if (user.role === "super_admin" || user.role === "co_admin") {
    return satkerData;
  }

  // Kantor pusat and DIT PA can see all satkers
  if (user.role === "kantor_pusat" || user.role === "ditpa") {
    return satkerData;
  }

  // Kanwil DJPb can only see satkers within their kdkanwil
  if (user.role === "kanwil_djpb" && user.kdkanwil) {
    return satkerData.filter(satker => satker.kdkanwil === user.kdkanwil);
  }

  // KPPN can only see satkers within their kdkppn (more restrictive than kdkanwil)
  if (user.role === "kppn" && user.kdkppn) {
    return satkerData.filter(satker => satker.kdkppn === user.kdkppn);
  }

  // Other roles (lainnya) have no access to satker data
  return [];
}

/**
 * Check if user has access to a specific satker
 * @param satker - Satker item to check access for
 * @param user - Current user object
 * @returns Boolean indicating if user has access to the satker
 */
export function hasAccessToSatker(
  satker: SatkerItem,
  user: User | null | undefined
): boolean {
  if (!user || !satker) {
    return false;
  }

  // Super admin and co-admin can access all satkers
  if (user.role === "super_admin" || user.role === "co_admin") {
    return true;
  }

  // Kantor pusat and DIT PA can access all satkers
  if (user.role === "kantor_pusat" || user.role === "ditpa") {
    return true;
  }

  // Kanwil DJPb can only access satkers within their kdkanwil
  if (user.role === "kanwil_djpb" && user.kdkanwil) {
    return satker.kdkanwil === user.kdkanwil;
  }

  // KPPN can only access satkers within their kdkppn (more restrictive)
  if (user.role === "kppn" && user.kdkppn) {
    return satker.kdkppn === user.kdkppn;
  }

  // Other roles have no access
  return false;
}

/**
 * Get user access level description for UI display
 * @param user - Current user object
 * @returns String describing the user's access level
 */
export function getUserAccessDescription(user: User | null | undefined): string {
  if (!user) {
    return "Tidak ada akses";
  }

  switch (user.role) {
    case "super_admin":
    case "co_admin":
      return "Akses ke semua satker";
    case "kantor_pusat":
      return "Akses ke semua satker";
    case "kanwil_djpb":
      return user.kdkanwil
        ? `Akses terbatas pada Kanwil ${user.kdkanwil} (${user.nmkanwil || 'Tidak diketahui'})`
        : "Akses terbatas (Kanwil tidak terdefinisi)";
    case "kppn":
      return user.kdkppn
        ? `Akses terbatas pada KPPN ${user.kdkppn} (${user.nmkppn || 'Tidak diketahui'})`
        : "Akses terbatas (KPPN tidak terdefinisi)";
    case "lainnya":
    default:
      return "Tidak ada akses ke data satker";
  }
}
