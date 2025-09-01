export const mbgKeys = {
  all: ["mbg"] as const,
  quickStats: () => [...mbgKeys.all, "quick-stats"] as const,
  rankings: () => [...mbgKeys.all, "rankings"] as const,
  mapStats: (scope: "national" | "province" | "regency", id?: string) =>
    [...mbgKeys.all, "map-stats", scope, id ?? "all"] as const,
  chartsReady: () => [...mbgKeys.all, "charts-ready"] as const,
};
