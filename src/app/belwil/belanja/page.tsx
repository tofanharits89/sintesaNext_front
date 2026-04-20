"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { BelwilDynamicFiltersCard } from "@/components/belwil/belwil-dynamic-filters-card";
import { FilterCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import { MapPin, Lock } from "lucide-react";

// Filters not present in the belanja_kewilayahan table - exclude from filter panel
const BELWIL_EXCLUDED_FILTERS = [
  "cutOff",
  "jenisAkumulasi",
  // Tematik/special program filters
  "register",
  "kemiskinanEkstrim",
  "belanjaPemilu",
  "ibuKotaNusantara",
  "ketahananPangan",
  "swasembadaPangan",
  "belanjaPemerintah",
  "mbgIntervensi",
  "jenisProgramStrategis",
  "jenisTemaAnggaran",
  "jenisBlokir",
  "jenisPn",
  "programPrioritas",
  "kegiatanPrioritas",
  "proyekPrioritas",
  "jenisMajorProject",
  "jenisInflasiIntervensi",
  "jenisInflasiPengeluaran",
  "stuntingIntervensi",
  "jenisKontrak",
  "statusSumber",
  "kewenanganRevisi",
  "jenisRevisi",
  "kodeBkpk",
  "jenisBelanja",
];

const BELWIL_TIPE_LAPORAN = [
  { value: "belwil_belanja_realisasi", label: "Realisasi" },
];

export default function BelwilBelanjaPage() {
  const currentYear = new Date().getFullYear();

  const [activeFilters, setActiveFilters] = useState<string[]>(["kementerian"]);

  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(
    {
      kementerian: {
        selection: "",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    },
  );

  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    tipeLaporan: "belwil_belanja_realisasi",
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
    jenisDataLokasi: "Kegiatan",
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
          selection: "",
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
        selection: value.selection || "",
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
            Belanja Kewilayahan
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Query builder untuk data belanja kewilayahan berdasarkan lokus dengan
          filter parameter yang dapat disesuaikan
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          customTipeLaporanOptions={BELWIL_TIPE_LAPORAN}
          hideJenisAkumulasi
        />

        {/* 2. Jenis Data Lokasi - mandatory static filter */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Jenis Data Lokasi
              <span className="text-xs font-normal text-muted-foreground bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                Wajib
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={reportParams.jenisDataLokasi}
              onValueChange={(val) =>
                setReportParams((prev) => ({ ...prev, jenisDataLokasi: val }))
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Kegiatan" id="jdl-kegiatan" />
                <Label
                  htmlFor="jdl-kegiatan"
                  className="cursor-pointer font-medium"
                >
                  Kegiatan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Supplier" id="jdl-supplier" />
                <Label
                  htmlFor="jdl-supplier"
                  className="cursor-pointer font-medium"
                >
                  Supplier
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 3. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={BELWIL_EXCLUDED_FILTERS}
          scope="general"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 4. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <BelwilDynamicFiltersCard
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
