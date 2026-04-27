export const monevKkpKeys = {
  all: ["monev-kkp"] as const,
  dashboard: (year: string, triwulan: string, role?: string, locationId?: string) =>
    [...monevKkpKeys.all, "dashboard", year, triwulan, role, locationId] as const,
};
