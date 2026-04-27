export const monevKkpKeys = {
  all: ["monev-kkp"] as const,
  dashboard: (year: string, triwulan: string) =>
    [...monevKkpKeys.all, "dashboard", year, triwulan] as const,
};
