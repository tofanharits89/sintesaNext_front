import { useAuth } from "@/hooks/useAuth";
import { useQuickStats } from "@/hooks/useQuickStats";
import { useRealisasiPerJenisBelanja } from "@/hooks/useRealisasiPerJenisBelanja";
import { useRealisasiKLPaguTerbesar } from "@/hooks/useRealisasiKLPaguTerbesar";
import { useRealisasiKLPaguProgramTerbesar } from "@/hooks/useRealisasiKLPaguProgramTerbesar";
import { useTrenRealisasiBulananPerJenisBelanja } from "@/hooks/useTrenRealisasiBulananPerJenisBelanja";
import { usePersentaseRealisasiKL } from "@/hooks/usePersentaseRealisasiKL";
import { useRealisasiKLPerFungsi } from "@/hooks/useRealisasiKLPerFungsi";

import type { QuickStatsData } from "@/types/dashboard";

export interface DashboardDataHooks {
  quickStats: {
    data: import("@/hooks/useQuickStats").QSReturn | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  realisasiJenisBelanjaData: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  klPaguTerbesarData: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  realisasiKLPaguProgramTerbesarData: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  trenRealisasiBulananData: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  persentaseKLData: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
  realisasiKLPerFungsi: {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };
}

export const useDashboardData = (selectedKanwil: string, selectedYear: string): DashboardDataHooks => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  // Only enable queries when authenticated AND auth is not loading
  // User object can be null initially but will be populated by React Query
  const queriesEnabled = isAuthenticated && !isAuthLoading;

  const filters = selectedKanwil !== "semua"
    ? { kanwil: selectedKanwil, year: selectedYear }
    : { year: selectedYear };

  const quickStats = useQuickStats({
    ...filters,
    enabled: queriesEnabled,
  });

  const realisasiJenisBelanjaData = useRealisasiPerJenisBelanja({
    ...filters,
    enabled: queriesEnabled,
  });

  const klPaguTerbesarData = useRealisasiKLPaguTerbesar({
    ...filters,
    enabled: queriesEnabled,
  });

  const realisasiKLPaguProgramTerbesarData = useRealisasiKLPaguProgramTerbesar({
    ...filters,
    enabled: queriesEnabled,
  });

  const trenRealisasiBulananData = useTrenRealisasiBulananPerJenisBelanja({
    ...filters,
    enabled: queriesEnabled,
  });

  const persentaseKLData = usePersentaseRealisasiKL({
    ...filters,
    enabled: queriesEnabled,
  });

  const realisasiKLPerFungsi = useRealisasiKLPerFungsi({
    ...filters,
    enabled: queriesEnabled,
  });

  return {
    quickStats,
    realisasiJenisBelanjaData,
    klPaguTerbesarData,
    realisasiKLPaguProgramTerbesarData,
    trenRealisasiBulananData,
    persentaseKLData,
    realisasiKLPerFungsi,
  };
};
