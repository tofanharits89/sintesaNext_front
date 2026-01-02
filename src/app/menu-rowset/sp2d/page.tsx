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
import { useAuth } from "@/hooks/useAuth";
import type { FilterValue, SavedQuery } from "@/types/saved-queries";
import { Settings, Keyboard, RefreshCw, Database } from "lucide-react";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";

export default function Sp2dPage() {
  // State for query management modal
  const [isQueryManagementOpen, setIsQueryManagementOpen] = useState(false);

  // Ref for query management refresh function
  const queryManagementRefreshRef = useRef<(() => void) | null>(null);

  // State for managing which filters are active
  const [activeFilters, setActiveFilters] = useState<string[]>(["kementerian"]);

  // State for filter values
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(
    {}
  );

  // State for report selection with defaults
  const currentYear = new Date().getFullYear();
  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(), // Default to current year
    tipeLaporan: "spm_sp2d", // Default to SPM/SP2D
    pembulatan: "satuan", // Default to Satuan
    jenisAkumulasi: "non_akumulatif", // Default to Non-Akumulatif
  });

  // Query loader hook for managing query loading functionality
  const queryLoader = useQueryLoader({
    onStateChange: useCallback((newState: QueryBuilderState) => {
      console.log("[Sp2dPage] onStateChange called with:", {
        activeFilters: newState.activeFilters,
        filterValues: Object.entries(newState.filterValues).map(
          ([key, value]) => ({
            [key]: { selection: value.selection },
          })
        ),
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
    scope: "sp2d", // Set scope for sp2d page
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
      // Ctrl+M or Cmd+M to open query management
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        setIsQueryManagementOpen(true);
      }

      // Escape to close query management
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
  const { user: currentUser } = useAuth();

  // Function to save current query state
  const saveCurrentQuery = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      // Generate a default name based on current timestamp
      const timestamp = new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const defaultName = `Query ${timestamp}`;

      const queryData = {
        name: defaultName,
        description: "Query disimpan otomatis sebelum memuat query lain",
        reportParams,
        activeFilters,
        filterValues,
        scope: "sp2d" as const, // Mark this as a sp2d query
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
    // Reset to original state if available
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
      // Reset to default state
      setActiveFilters([]);
      setFilterValues({});
      setReportParams({
        tahun: currentYear.toString(),
        tipeLaporan: "spm_sp2d",
        pembulatan: "satuan",
        jenisAkumulasi: "non_akumulatif",
      });
    }

    // Reset change detection
    queryLoader.resetChangeDetection();
  }, [queryLoader, currentYear]);

  // Unsaved changes warning system
  const unsavedChangesWarning = useUnsavedChangesWarning({
    hasUnsavedChanges: queryLoader.hasUnsavedChanges,
    onSaveCurrentQuery: saveCurrentQuery,
    onLoadQuery: stableLoadQuery,
    onDiscardChanges: discardCurrentChanges,
  });

  // Function to handle query loading with unsaved changes check
  const handleLoadQuery = useCallback(
    async (query: SavedQuery) => {
      try {
        await unsavedChangesWarning.attemptLoadQuery(query);
      } catch (error) {
        console.error("Error in handleLoadQuery:", error);
        // Ensure UI is not left in a blocked state
        setTimeout(() => {
          // Force close any open modals if there's an error
          if (unsavedChangesWarning.isWarningOpen) {
            unsavedChangesWarning.closeWarningModal();
          }
        }, 100);
      }
    },
    [unsavedChangesWarning]
  );

  // Note: Avoid manual DOM cleanup of Radix overlays/backdrops here.
  // React/Radix manage their own lifecycles; manual removal can conflict
  // with Next.js/React error boundaries and cause NotFoundError.

  // Create stable queryLoader object for DynamicFiltersCard
  const stableQueryLoader = useMemo(
    () => ({
      hasUnsavedChanges: queryLoader.hasUnsavedChanges,
      loadQuery: handleLoadQuery,
      validateQueryCompatibility: queryLoader.validateQueryCompatibility,
    }),
    [
      queryLoader.hasUnsavedChanges,
      handleLoadQuery,
      queryLoader.validateQueryCompatibility,
    ]
  );

  // Function to remove a specific filter
  const removeFilter = (filterKey: string) => {
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    // Clear the filter value when removing the filter
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterValues({});
  };

  // Function to handle filter value changes
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

  // Convert filterValues to the stricter type expected by DynamicFiltersCard
  const normalizedFilterValues = useMemo(() => {
    const normalized: Record<
      string,
      import("@/hooks/use-inquiry-data-api").FilterValue
    > = {};

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
          <h1 className="text-2xl font-semibold tracking-tight">
            Rowset SP2D
          </h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data SPM/SP2D dengan filter parameter yang dapat
            disesuaikan
          </p>
        </div>

        {/* Query Management Access */}
        <div className="flex items-center gap-2">
          {/* Muat Query dropdown placed before Kelola Query */}
          <QueryLoaderButton
            onLoadQuery={handleLoadQuery}
            onOpenQueryManagement={() => setIsQueryManagementOpen(true)}
            hasUnsavedChanges={queryLoader.hasUnsavedChanges}
            scope="sp2d"
          />

          <Button
            variant="outline"
            onClick={() => setIsQueryManagementOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-card hover:bg-zinc-200"
          >
            <Settings className="w-4 h-4" />
            Kelola Query
          </Button>

          {/* Keyboard shortcut hint */}
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
          mode="sp2d"
        />

        {/* 2. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          scope="sp2d"
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
            scope="sp2d" // Pass scope for query differentiation
            queryLoader={stableQueryLoader}
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
      <Dialog
        open={isQueryManagementOpen}
        onOpenChange={setIsQueryManagementOpen}
      >
        <DialogContent
          className="max-w-7xl w-full max-h-[90vh] overflow-hidden sm:max-w-7xl"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-amber-600" />
                <div>
                  <DialogTitle>Kelola Query Tersimpan</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kelola dan gunakan kembali query yang telah Anda simpan
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
                    setIsQueryManagementOpen(false); // Close modal after loading
                  }}
                  currentUserId={currentUser?.id || ""}
                  scope="sp2d" // Pass scope to filter queries
                  onRefreshReady={(refreshFn) => {
                    queryManagementRefreshRef.current = refreshFn;
                  }}
                />
              </Suspense>
            </QueryErrorBoundary>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-24"
              onClick={() => setIsQueryManagementOpen(false)}
            >
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
