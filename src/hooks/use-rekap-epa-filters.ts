import { useState, useCallback } from "react";
import type { RekapEpaFilters } from "@/types/epa-rekap";

export function useRekapEpaFilterState() {
  const [filters, setFilters] = useState<RekapEpaFilters>({
    tahun: null,
    triwulan: null,
    kddept: null,
    kdgbkpk: null,
  });

  const updateFilter = useCallback((key: keyof RekapEpaFilters, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      tahun: null,
      triwulan: null,
      kddept: null,
      kdgbkpk: null,
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
