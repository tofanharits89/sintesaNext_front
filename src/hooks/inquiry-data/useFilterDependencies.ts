"use client";

import { useEffect } from "react";

// Dependency graph: when a filter changes, which dependent filters should be cleared
const DEPENDENCY_GRAPH: Record<string, string[]> = {
  kementerian: ["eselonI", "program", "satker", "outputKro", "subOutputRo"],
  eselonI: ["program", "outputKro", "subOutputRo"],
  provinsi: ["kanwil", "kppn", "kabkota", "satker"],
  kanwil: ["kppn", "satker"],
  fungsi: ["subFungsi"],
  program: ["kegiatan", "outputKro", "subOutputRo"],
  kegiatan: ["outputKro", "subOutputRo"],
  outputKro: ["subOutputRo"],
  jenisPn: ["programPrioritas", "kegiatanPrioritas", "proyekPrioritas"],
  programPrioritas: ["kegiatanPrioritas", "proyekPrioritas"],
  kegiatanPrioritas: ["proyekPrioritas"],
};

interface UseFilterDependenciesProps {
  filterKey: string;
  filterValue: string;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  skipFirstRun?: boolean;
}

export function useFilterDependencies({
  filterKey,
  filterValue,
  onFilterChange,
  skipFirstRun = false,
}: UseFilterDependenciesProps) {
  useEffect(() => {
    // Skip the first run if specified (useful when hydrating from saved queries)
    if (skipFirstRun) {
      skipFirstRun = false as any; // This is a workaround for the closure
      return;
    }

    const dependentFilters = DEPENDENCY_GRAPH[filterKey];

    if (!dependentFilters || !filterValue) {
      return;
    }

    // Clear dependent filters when parent changes
    dependentFilters.forEach((dependentFilter) => {
      onFilterChange(dependentFilter, "selection", "all");
    });
  }, [filterKey, filterValue, onFilterChange]);

  // Helper to check if a filter should be invalidated
  const shouldInvalidateFilter = (filterKeyToCheck: string, currentValue: string): boolean => {
    // Check if this filter depends on any other filter that's set to "all"
    for (const [parentFilter, dependents] of Object.entries(DEPENDENCY_GRAPH)) {
      if (dependents.includes(filterKeyToCheck)) {
        // If parent filter has a non-"all" value, we should keep this filter
        // If parent filter has "all" value, we should invalidate
        return currentValue !== "all";
      }
    }
    return false;
  };

  return { shouldInvalidateFilter };
}
