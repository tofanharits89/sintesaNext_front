"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { QueryLoaderButton } from "@/components/inquiry-data/query-loader-button";
import { UnsavedChangesModal } from "@/components/inquiry-data/modals/unsaved-changes-modal";
import { DynamicFiltersCard, QueryManagement } from "@/components/lazy";
import { Suspense } from "react";
import { FilterCardSkeleton, GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import {
  useQueryLoader,
  type QueryBuilderState,
} from "@/hooks/use-query-loader";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useUnifiedAuth } from "@/lib/auth";
import type { FilterValue, SavedQuery } from "@/types/saved-queries";
import { Settings, Keyboard, RefreshCw, Database } from "lucide-react";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";

export default function PenerimaaanPnbpPage() {
  // Helper function to get current month
  const getCurrentMonth = () => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, "0");
    };

  // State for query management modal
  const [isQueryManagementOpen, setIsQueryManagementOpen] = useState(false);

  // Ref for query management refresh function
  const queryManagementRefreshRef = useRef<(() => void) | null>(null);

  // State for managing which filters are active (cutOff is always active)
  const [activeFilters, setActiveFilters] = useState<string[]>(["cutOff"]);

  // State for filter values (initialize cutOff with current month)
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({
    cutOff: {
      selection: getCurrentMonth(),
      kondisiCode: "equals",
      mengandungKata: "",
      jenisTampilan: "kode",
    },
  });

  // State for report selection with defaults
  const currentYear = new Date().getFullYear();
  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    // Default Penerimaan PNBP report type
    tipeLaporan: "detil_penerimaan_pnbp",
    pembulatan: "satuan",
    // keep for compatibility even if penerimaan_pnbp may not use it directly
    jenisAkumulasi: "non_akumulatif",
  });

  // Query loader hook for managing query loading functionality
  const queryLoader = useQueryLoader({
    onStateChange: useCallback((newState: QueryBuilderState) => {
      console.log("[PenerimaaanPnbpPage] onStateChange:", {
        activeFilters: newState.activeFilters,
        filterValues: Object.entries(newState.filterValues).map(([key, value]) => ({
          [key]: { selection: value.selection },
        })),
      });

      // Update states simultaneously - React will batch these updates
      setActiveFilters(newState.activeFilters);
      setFilterValues(newState.filterValues);
      setReportParams({
        tahun: newState.reportParams.tahun,
        tipeLaporan: newState.reportParams.tipeLaporan,
        pembulatan: newState.reportParams.pembulatan,
        jenisAkumulasi: newState.reportParams.jenisAkumulasi || "non_akumulatif",
      });
    }, []),
    getCurrentState: useCallback(
      (): QueryBuilderState => ({
        activeFilters,
        filterValues,
        reportParams,
      }),
      [activeFilters, filterValues, reportParams]
    ),
    scope: "penerimaan_pnbp",
  });

  // Create stable references for queryLoader functions to prevent unnecessary re-renders
  const stableLoadQuery = useCallback(
    async (query: any) => {
      return queryLoader.loadQuery(query);
    },
    [queryLoader.loadQuery]
  );

  // Update change detection when state changes
  const updateChangeDetectionRef = useRef(queryLoader.updateChangeDetection);
  updateChangeDetectionRef.current = queryLoader.updateChangeDetection;

  useEffect(() => {
    updateChangeDetectionRef.current();
  }, [activeFilters, filterValues, reportParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        setIsQueryManagementOpen(true);
      }
      if (event.key === "Escape" && isQueryManagementOpen) {
        event.preventDefault();
        setIsQueryManagementOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isQueryManagementOpen]);

  // Saved queries hook for creating new queries
  const { createQuery, isCreating } = useSavedQueries();

  // Get current user for query management
  const { user: currentUser } = useUnifiedAuth();

  // Function to save current query state
  const saveCurrentQueryReal = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const timestamp = new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const defaultName = `Query Penerimaan PNBP ${timestamp}`;

      const queryData = {
        name: defaultName,
        description: "Query Penerimaan PNBP disimpan otomatis sebelum memuat query lain",
        reportParams,
        activeFilters,
        filterValues,
        scope: "penerimaan_pnbp" as const,
      };

      await createQuery(queryData);
      return { success: true };
    } catch (error) {
      console.error("Error saving current query:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan query",
      };
    }
  }, [reportParams, activeFilters, filterValues, createQuery]);

  // Function to discard current changes
  const discardCurrentChanges = useCallback(() => {
    if (queryLoader.originalState) {
      setActiveFilters(queryLoader.originalState.activeFilters);
      setFilterValues(queryLoader.originalState.filterValues);
      setReportParams({
        tahun: queryLoader.originalState.reportParams.tahun,
        tipeLaporan: queryLoader.originalState.reportParams.tipeLaporan,
        pembulatan: queryLoader.originalState.reportParams.pembulatan,
        jenisAkumulasi: queryLoader.originalState.reportParams.jenisAkumulasi || "non_akumulatif",
      });
    } else {
      const currentMonth = getCurrentMonth();
      setActiveFilters(["cutOff"]);
      setFilterValues({
        cutOff: {
          selection: currentMonth,
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
      });
      setReportParams({
        tahun: currentYear.toString(),
        tipeLaporan: "detil_penerimaan_pnbp",
        pembulatan: "satuan",
        jenisAkumulasi: "non_akumulatif",
      });
    }
    queryLoader.resetChangeDetection();
  }, [queryLoader, currentYear, getCurrentMonth]);

  // Unsaved changes warning system
  const unsavedChangesWarning = useUnsavedChangesWarning({
    hasUnsavedChanges: queryLoader.hasUnsavedChanges,
    onSaveCurrentQuery: saveCurrentQueryReal,
    onLoadQuery: stableLoadQuery,
    onDiscardChanges: discardCurrentChanges,
  });

  // Handle query loading with unsaved changes check
  const handleLoadQuery = useCallback(
    async (query: SavedQuery) => {
      try {
        await unsavedChangesWarning.attemptLoadQuery(query);
      } catch (error) {
        console.error("Error in handleLoadQuery:", error);
        setTimeout(() => {
          if (unsavedChangesWarning.isWarningOpen) {
            unsavedChangesWarning.closeWarningModal();
          }
        }, 100);
      }
    },
    [unsavedChangesWarning]
  );

  // Remove a specific filter
  const removeFilter = (filterKey: string) => {
    if (filterKey === "cutOff") return;
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    setFilterValues((prev) => {
      const newValues = { ...prev } as Record<string, FilterValue>;
      delete (newValues as any)[filterKey];
      return newValues;
    });
  };

  // Clear all filters except cutOff
  const clearAllFilters = () => {
    setActiveFilters(["cutOff"]);
    setFilterValues((prev) => {
      const cutOffValue = prev.cutOff;
      return cutOffValue
        ? { cutOff: cutOffValue }
        : {
            cutOff: {
              selection: getCurrentMonth(),
              kondisiCode: "equals",
              mengandungKata: "",
              jenisTampilan: "kode",
            },
          };
    });
  };

  // Handle filter value changes
  const handleFilterChange = (
    filterKey: string,
    field: string,
    value: string
  ) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [field]: value,
      },
    }));
  };

  // Normalize filter values type for DynamicFiltersCard
  const normalizedFilterValues = useMemo(() => {
    const normalized: Record<string, import("@/hooks/use-inquiry-data-api").FilterValue> = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      normalized[key] = {
        selection: value.selection || "",
        kondisiCode: value.kondisiCode || "",
        mengandungKata: value.mengandungKata || "",
        jenisTampilan: value.jenisTampilan || "kode",
        akunType: (value as any).akunType,
      } as any;
    });
    return normalized;
  }, [filterValues]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inquiry Data Penerimaan PNBP</h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data penerimaan PNBP dengan filter parameter yang dapat disesuaikan
          </p>
        </div>

        {/* Query Management Access */}
        <div className="flex items-center gap-2">
          <QueryLoaderButton
            onLoadQuery={handleLoadQuery}
            onOpenQueryManagement={() => setIsQueryManagementOpen(true)}
            hasUnsavedChanges={queryLoader.hasUnsavedChanges}
            scope="penerimaan_pnbp"
          />

          <Button
            variant="outline"
            onClick={() => setIsQueryManagementOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-card hover:bg-zinc-200"
          >
            <Settings className="w-4 h-4" />
            Kelola Query
          </Button>

          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <Keyboard className="w-3 h-3" />
            <span>Ctrl+M</span>
          </div>
        </div>
      </div>

      {/* Main Content - Three Cards Layout */}
      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          mode="penerimaan_pnbp"
        />

        {/* 2. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={["cutOff"]}
          scope="penerimaan_pnbp"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 3. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton /> }>
          <DynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={reportParams}
            onRemoveFilter={removeFilter}
            onClearAllFilters={clearAllFilters}
            filterValues={normalizedFilterValues}
            onFilterChange={handleFilterChange}
            scope="penerimaan_pnbp"
          />
        </Suspense>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal
        open={unsavedChangesWarning.isWarningOpen}
        onOpenChange={unsavedChangesWarning.closeWarningModal}
        onAction={unsavedChangesWarning.handleWarningAction}
        queryToLoad={unsavedChangesWarning.queryToLoad}
        isLoading={unsavedChangesWarning.isProcessing || isCreating}
      />

      {/* Query Management Modal */}
      <Dialog open={isQueryManagementOpen} onOpenChange={setIsQueryManagementOpen}>
        <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-hidden sm:max-w-7xl" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-amber-600" />
                <div>
                  <DialogTitle>Kelola Query Penerimaan PNBP Tersimpan</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kelola dan gunakan kembali query Penerimaan PNBP yang telah Anda simpan
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (queryManagementRefreshRef.current) {
                    queryManagementRefreshRef.current();
                  }
                }}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
            <QueryErrorBoundary>
              <Suspense fallback={<GenericCardSkeleton showHeader contentLines={10} /> }>
                <QueryManagement
                  onLoadQuery={(query) => {
                    handleLoadQuery(query);
                    setIsQueryManagementOpen(false);
                  }}
                  currentUserId={currentUser?.id || ""}
                  scope="penerimaan_pnbp"
                  onRefreshReady={(refreshFn) => {
                    queryManagementRefreshRef.current = refreshFn;
                  }}
                />
              </Suspense>
            </QueryErrorBoundary>
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-24" onClick={() => setIsQueryManagementOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
