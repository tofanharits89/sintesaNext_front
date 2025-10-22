import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
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

export const useDashboardData = (selectedKanwil: string): DashboardDataHooks => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useUnifiedAuth();
  
  // Only enable queries when authenticated AND user profile is loaded (not loading)
  const queriesEnabled = isAuthenticated && !isAuthLoading && !!user;
  
  const kanwilFilter = selectedKanwil !== "semua" ? { kanwil: selectedKanwil } : {};

  const quickStats = useQuickStats({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const realisasiJenisBelanjaData = useRealisasiPerJenisBelanja({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const klPaguTerbesarData = useRealisasiKLPaguTerbesar({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const realisasiKLPaguProgramTerbesarData = useRealisasiKLPaguProgramTerbesar({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const trenRealisasiBulananData = useTrenRealisasiBulananPerJenisBelanja({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const persentaseKLData = usePersentaseRealisasiKL({
    ...kanwilFilter,
    enabled: queriesEnabled,
  });

  const realisasiKLPerFungsi = useRealisasiKLPerFungsi({
    ...kanwilFilter,
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