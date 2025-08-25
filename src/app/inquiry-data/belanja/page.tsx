"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { DynamicFiltersCard } from "@/components/inquiry-data/dynamic-filters-card";

export default function BelanjaPage() {
  // State for managing which filters are active (cutOff is always active)
  const [activeFilters, setActiveFilters] = useState<string[]>(["cutOff"]);

  // State for filter values (initialize cutOff with current month)
  const getCurrentMonth = () => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0');
  };
  
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    cutOff: {
      selection: getCurrentMonth(),
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode",
    },
  });

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
    // Prevent removing cutOff as it's mandatory
    if (filterKey === "cutOff") {
      return;
    }
    
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    // Clear the filter value when removing the filter
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  // Function to clear all filters (except mandatory cutOff)
  const clearAllFilters = () => {
    setActiveFilters(["cutOff"]);
    // Keep cutOff filter value, clear others
    setFilterValues((prev) => {
      const cutOffValue = prev.cutOff;
      return cutOffValue ? { cutOff: cutOffValue } : {};
    });
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
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}
