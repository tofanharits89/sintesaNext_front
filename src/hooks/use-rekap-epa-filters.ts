import { useState, useCallback } from "react";
import type { RekapEpaFilters } from "@/types/epa-rekap";

export function useRekapEpaFilterState() {
  const [filters, setFilters] = useState<RekapEpaFilters>({
    tahun: "all",
    triwulan: "all",
    kddept: "all",
    kdgbkpk: "all",
  });

  const updateFilter = useCallback((key: keyof RekapEpaFilters, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || "all",
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      tahun: "all",
      triwulan: "all",
      kddept: "all",
      kdgbkpk: "all",
    });
  }, []);

  const setAllFilters = useCallback((newFilters: RekapEpaFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    setAllFilters,
  };
}
