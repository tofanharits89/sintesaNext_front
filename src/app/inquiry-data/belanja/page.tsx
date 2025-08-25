"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { DynamicFiltersCard } from "@/components/inquiry-data/dynamic-filters-card";

export default function BelanjaPage() {
  // State for managing which filters are active
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for report selection with defaults
  const currentYear = new Date().getFullYear();
  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(), // Default to current year
    tipeLaporan: "pagu_realisasi", // Default to Pagu Realisasi
    pembulatan: "satuan", // Default to Satuan
    jenisAkumulasi: "non_akumulatif", // Default to Non-Akumulatif
  });

  // Function to remove a specific filter
  const removeFilter = (filterKey: string) => {
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inquiry Data Belanja
          </h1>
          <p className="text-sm text-muted-foreground">
            Query builder untuk data belanja dengan filter parameter yang dapat
            disesuaikan
          </p>
        </div>
      </div>

      {/* Main Content - Three Cards Layout */}
      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
        />

        {/* 2. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
        />

        {/* 3. Dynamic Filters and Actions Card */}
        <DynamicFiltersCard
          activeFilters={activeFilters}
          reportParams={reportParams}
          onRemoveFilter={removeFilter}
          onClearAllFilters={clearAllFilters}
        />
      </div>
    </div>
  );
}
