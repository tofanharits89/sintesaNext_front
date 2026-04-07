"use client";

import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { UnsavedChangesModal } from "@/components/inquiry-data/modals/unsaved-changes-modal";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { QueryLoaderButton } from "@/components/inquiry-data/query-loader-button";
import {
  RevisiDipaMandatoryFilters,
  REVISI_DIPA_MANDATORY_FILTERS,
} from "@/components/inquiry-data/revisi-dipa-mandatory-filters";
import { DynamicFiltersCard, QueryManagement } from "@/components/lazy";
import { Button } from "@/components/ui/button";
import {
  FilterCardSkeleton,
  GenericCardSkeleton,
} from "@/components/ui/dashboard-skeletons";
import { QueryBuilderState, useQueryLoader } from "@/hooks/use-query-loader";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useAuth } from "@/hooks/useAuth";
import { FilterValue, SavedQuery } from "@/types/saved-queries";
import { Database, Keyboard, RefreshCw, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { QueryErrorBoundary } from "@/components/ui/query-error-boundary";

export default function RevisiDipaPage() {
  // State for query management modal
  const [isQueryManagementOpen, setIsQueryManagementOpen] = useState(false);

  // Ref for query management refresh func
  const queryManagementRefreshRef = useRef<(() => void) | null>(null);

  // Keys for filters that are always mandatory on this page
  const MANDATORY_FILTER_KEYS = REVISI_DIPA_MANDATORY_FILTERS.map((f) => f.key);

  // State management of active filters (mandatory filters always included)
  const [activeFilters, setActiveFilters] = useState<string[]>([
    "kementerian",
    ...MANDATORY_FILTER_KEYS,
  ]);

  // State management for filter's value (mandatory filters pre-initialized)
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(
    {
      kewenanganRevisi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
      jenisRevisi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    },
  );

  // State for report selection
  const currentYear = new Date().getFullYear();
  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    tipeLaporan: "revisi_dipa",
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
  });

  const queryLoader = useQueryLoader({
    onStateChange: useCallback((newState: QueryBuilderState) => {
      console.log("[RevisiDipaPage] onStateChange:", {
        activeFilters: newState.activeFilters,
        filterValues: Object.entries(newState.filterValues).map(
          ([key, value]) => ({
            [key]: { selection: value.selection },
          }),
        ),
      });

      // Update states simultaneously - React will batch these updates
      setActiveFilters(newState.activeFilters);
      setFilterValues(newState.filterValues);
      setReportParams({
        tahun: newState.reportParams.tahun,
        tipeLaporan: newState.reportParams.tipeLaporan,
        pembulatan: newState.reportParams.pembulatan,
        jenisAkumulasi:
          newState.reportParams.jenisAkumulasi || "non_akumulatif",
      });
    }, []),

    getCurrentState: useCallback(
      (): QueryBuilderState => ({
        activeFilters,
        filterValues,
        reportParams,
      }),
      [activeFilters, filterValues, reportParams],
    ),
    scope: "revisi_dipa",
  });

  const stableLoadQuery = useCallback(
    async (query: any) => {
      return queryLoader.loadQuery(query);
    },
    [queryLoader.loadQuery],
  );

  const updateChangeDetectionRef = useRef(queryLoader.updateChangeDetection);
  updateChangeDetectionRef.current = queryLoader.updateChangeDetection;

  useEffect(() => {
    updateChangeDetectionRef.current();
  }, [activeFilters, filterValues, reportParams]);

  // Set up keyboard shortcut
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

  // Saved queries hook
  const { createQuery, isCreating } = useSavedQueries();

  // Get current user for query management
  const { user: currentUser } = useAuth();

  const saveCurrentQueryReal = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const timestamp = new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const defaultName = `Query Revisi DIPA ${timestamp}`;

      const queryData = {
        name: defaultName,
        description:
          "Query Revisi DIPA disimpan otomatis sebelum memuat query lain",
        reportParams,
        activeFilters,
        filterValues,
        scope: "revisi_dipa" as const,
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

  // Discard function
  const discardCurrentChanges = useCallback(() => {
    if (queryLoader.originalState) {
      setActiveFilters(queryLoader.originalState.activeFilters);
      setFilterValues(queryLoader.originalState.filterValues);
      setReportParams({
        tahun: queryLoader.originalState.reportParams.tahun,
        tipeLaporan: queryLoader.originalState.reportParams.tipeLaporan,
        pembulatan: queryLoader.originalState.reportParams.pembulatan,
        jenisAkumulasi:
          queryLoader.originalState.reportParams.jenisAkumulasi ||
          "non_akumulatif",
      });
    } else {
      setActiveFilters(["kementerian", ...MANDATORY_FILTER_KEYS]);
      setFilterValues({
        kementerian: {
          selection: "",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
        kewenanganRevisi: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
        jenisRevisi: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
      });
      setReportParams({
        tahun: currentYear.toString(),
        tipeLaporan: "revisi_dipa",
        pembulatan: "satuan",
        jenisAkumulasi: "non_akumulatif",
      });
    }
    queryLoader.resetChangeDetection();
  }, [queryLoader, currentYear]);

  const unsavedChangesWarning = useUnsavedChangesWarning({
    hasUnsavedChanges: queryLoader.hasUnsavedChanges,
    onSaveCurrentQuery: saveCurrentQueryReal,
    onLoadQuery: stableLoadQuery,
    onDiscardChanges: discardCurrentChanges,
  });

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
    [unsavedChangesWarning],
  );

  // Remove a specific filter (mandatory filters cannot be removed)
  const removeFilter = (filterKey: string) => {
    if (filterKey === "kementerian") return;
    if ((MANDATORY_FILTER_KEYS as string[]).includes(filterKey)) return;
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    setFilterValues((prev) => {
      const newValues = { ...prev } as Record<string, FilterValue>;
      delete (newValues as any)[filterKey];
      return newValues;
    });
  };

  // Reset only the mandatory filter values to their defaults
  const resetMandatoryFilterValues = () => {
    setFilterValues((prev) => ({
      ...prev,
      kewenanganRevisi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
      jenisRevisi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    }));
  };

  // Clear all optional filters, preserving kementerian and mandatory filters
  const clearAllFilters = () => {
    setActiveFilters(["kementerian", ...MANDATORY_FILTER_KEYS]);
    setFilterValues((prev) => {
      const kementerianValue = prev.kementerian;
      return {
        kementerian: kementerianValue ?? {
          selection: "",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
        kewenanganRevisi: prev.kewenanganRevisi ?? {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode",
        },
        jenisRevisi: prev.jenisRevisi ?? {
          selection: "all",
          kondisiCode: "",
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
    value: string,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inquiry Data Revisi DIPA
          </h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data Revisi DIPA dengan filter parameter yang
            dapat disesuaikan
          </p>
        </div>
        {/* Query Management Access */}
        <div className="flex items-center gap-2">
          <QueryLoaderButton
            onLoadQuery={handleLoadQuery}
            onOpenQueryManagement={() => setIsQueryManagementOpen(true)}
            hasUnsavedChanges={queryLoader.hasUnsavedChanges}
            scope="revisi_dipa"
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
          mode="revisi_dipa"
          hideJenisAkumulasi={true}
        />

        {/* 2. Mandatory Filters Card */}
        <RevisiDipaMandatoryFilters
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onResetFilters={resetMandatoryFilterValues}
        />

        {/* 3. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={["cutOff", ...MANDATORY_FILTER_KEYS]}
          scope="revisi_dipa"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 4. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <DynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={reportParams}
            onRemoveFilter={removeFilter}
            onClearAllFilters={clearAllFilters}
            filterValues={normalizedFilterValues}
            onFilterChange={handleFilterChange}
            scope="revisi_dipa"
            hiddenFilterKeys={MANDATORY_FILTER_KEYS}
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
                  <DialogTitle>Kelola Query Revisi DIPA Tersimpan</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kelola dan gunakan kembali query Revisi DIPA yang telah Anda
                    simpan
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
              <Suspense
                fallback={<GenericCardSkeleton showHeader contentLines={10} />}
              >
                <QueryManagement
                  onLoadQuery={(query) => {
                    handleLoadQuery(query);
                    setIsQueryManagementOpen(false);
                  }}
                  currentUserId={currentUser?.id || ""}
                  scope="revisi_dipa"
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
