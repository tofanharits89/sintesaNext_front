"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { APBDDynamicFiltersCard } from "@/components/apbd/apbd-dynamic-filters-card";
import { FilterCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import { MapPin } from "lucide-react";

const APBD_TIPE_LAPORAN = [
  { value: "apbd_pagu_real", label: "Pagu Realisasi" },
  { value: "apbd_real_inflasi", label: "Real Inflasi" },
  { value: "apbd_real_stunting", label: "Real Stunting" },
  { value: "apbd_real_kemiskinan", label: "Real Kemiskinan" },
];

export default function APBDBelanjaPage() {
  const currentYear = new Date().getFullYear();

  const [activeFilters, setActiveFilters] = useState<string[]>(["provinsi"]);

  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(
    {
      provinsi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    },
  );

  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    tipeLaporan: "apbd_pagu_real",
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
  });

  const removeFilter = (filterKey: string) => {
    setActiveFilters((prev) => prev.filter((key) => key !== filterKey));
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterValues({});
  };

  const handleFilterChange = useCallback(
    (filterKey: string, field: string, value: string) => {
      setFilterValues((prev) => {
        const existing = prev[filterKey] ?? {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode" as const,
        };
        const updated: FilterValue = {
          ...existing,
          [field]: value,
        } as FilterValue;
        return { ...prev, [filterKey]: updated };
      });
    },
    [],
  );

  const normalizedFilterValues = useMemo(() => {
    const normalized: Record<string, FilterValue> = {};
    Object.entries(filterValues).forEach(([key, value]) => {
      normalized[key] = {
        ...value,
        selection: value.selection || "all",
        kondisiCode: value.kondisiCode || "",
        mengandungKata: value.mengandungKata || "",
        jenisTampilan: value.jenisTampilan || "kode",
      };
    });
    return normalized;
  }, [filterValues]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Belanja APBD
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Query builder untuk data belanja APBD berdasarkan pemerintah daerah
          dengan filter parameter yang dapat disesuaikan
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          customTipeLaporanOptions={APBD_TIPE_LAPORAN}
          hideJenisAkumulasi
        />

        {/* 3. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          scope="apbd"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 4. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <APBDDynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={reportParams}
            onRemoveFilter={removeFilter}
            onClearAllFilters={clearAllFilters}
            filterValues={normalizedFilterValues}
            onFilterChange={handleFilterChange}
          />
        </Suspense>
      </div>
    </div>
  );
}
