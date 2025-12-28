"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sp2dReportParamsCard,
  Sp2dFilterParametersCard,
  Sp2dDynamicFiltersCard,
  type Sp2dFilterValue,
} from "@/components/menu-rowset/sp2d";
import {
  Settings,
  Keyboard,
  RefreshCw,
  Database,
} from "lucide-react";

export default function Sp2dPage() {
  // State for report parameters
  const [reportParams, setReportParams] = useState({
    tahun: new Date().getFullYear().toString(),
    jenlap: "1",
    pembulatan: "satuan",
  });

  // State for managing which filters are active
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for filter values
  const [filterValues, setFilterValues] = useState<
    Record<string, Sp2dFilterValue>
  >({});

  // Function to remove a specific filter
  const removeFilter = (filterKey: string) => {
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  // Function to handle filter value changes
  const handleFilterChange = useCallback(
    (filterKey: string, field: string, value: string) => {
      setFilterValues((prev) => ({
        ...prev,
        [filterKey]: {
          ...(prev[filterKey] || {
            selection: "",
            kondisiCode: "",
            mengandungKata: "",
            jenisTampilan: "kode",
          }),
          [field]: value,
        },
      }));
    },
    []
  );

  // Initialize filter with defaults when activated
  useEffect(() => {
    // This would normally seed default values for newly activated filters
  }, [activeFilters]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rowset SP2D</h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data SP2D dengan filter parameter yang dapat
            disesuaikan
          </p>
        </div>
      </div>

      {/* Main Content - Three Cards Layout */}
      <div className="space-y-6">
        {/* 1. Report Parameters Card */}
        <Sp2dReportParamsCard
          reportParams={reportParams}
          setReportParams={setReportParams}
        />

        {/* 2. Filter Parameters Card */}
        <Sp2dFilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
        />

        {/* 3. Dynamic Filters and Actions Card */}
        <Sp2dDynamicFiltersCard
          activeFilters={activeFilters}
          filterValues={filterValues}
          onRemoveFilter={removeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Results Area Placeholder */}
      <div className="bg-white dark:bg-card rounded-xl p-6 min-h-[200px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-muted-foreground text-center">
          Hasil query akan ditampilkan di sini
        </p>
      </div>
    </div>
  );
}
