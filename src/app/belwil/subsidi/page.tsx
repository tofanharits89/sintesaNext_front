"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { BelwilSubsidiDynamicFiltersCard } from "@/components/belwil/belwil-dynamic-filters-card";
import { FilterCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import type { SubsidiTipeLaporan } from "@/hooks/belwil/use-belwil-subsidi-query-builder";
import { directBackendClient } from "@/lib/api/httpClient";
import type { QueryExecutionResult } from "@/hooks/use-inquiry-data-api";

// Filters not present in the subsidi kewilayahan table
const BELWIL_SUBSIDI_EXCLUDED_FILTERS = [
  "cutOff",
  "jenisAkumulasi",
  "jenisDataLokasi",
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
  "kewenangan",
  "kppn",
  "fungsi",
  "subFungsi",
  "outputKro",
  "subOutputRo",
  "komponen",
  "subKomponen",
  "item",
  "regional",
  "lokusAnggaran",
];

const BELWIL_SUBSIDI_TIPE_LAPORAN = [
  { value: "belwil_subsidi_all", label: "Semua" },
  { value: "belwil_subsidi_realisasi", label: "Realisasi" },
  { value: "belwil_subsidi_jumlah_penerima", label: "Jumlah Penerima" },
  { value: "belwil_subsidi_jumlah_va", label: "Jumlah VA" },
];

function encryptQuery(query: string): string {
  return btoa(encodeURIComponent(query));
}

function useJnsBansosOptions(tahun: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const sql = `SELECT DISTINCT jns_bansos FROM monev${tahun}.subsidi_bulanan_${tahun} WHERE tahun = '${tahun}' ORDER BY jns_bansos`;
        const result = await directBackendClient.post<QueryExecutionResult>(
          "/inquiry-data/query",
          {
            encryptedQuery: encryptQuery(sql),
            format: "json",
            page: 1,
            pageSize: 200,
          },
        );
        if (!cancelled) {
          const rows =
            (result?.data as Record<string, string>[] | undefined) || [];
          setOptions(rows.map((r) => String(r.jns_bansos)).filter(Boolean));
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tahun]);

  return { options, isLoading };
}

export default function BelwilSubsidiPage() {
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
    tipeLaporan: "belwil_subsidi_all" as SubsidiTipeLaporan,
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
    jnsBansos: "all",
  });

  const { options: jnsBansosOptions, isLoading: jnsLoading } =
    useJnsBansosOptions(reportParams.tahun);

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
        return {
          ...prev,
          [filterKey]: { ...existing, [field]: value } as FilterValue,
        };
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

  const subsidiReportParams = useMemo(
    () => ({
      tahun: reportParams.tahun,
      tipeLaporan: reportParams.tipeLaporan,
      pembulatan: reportParams.pembulatan,
      jnsBansos: reportParams.jnsBansos,
    }),
    [reportParams],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Kewilayahan Subsidi
        </h1>
        <p className="text-sm text-muted-foreground">
          Query builder untuk data kewilayahan subsidi berdasarkan lokasi dengan
          filter parameter yang dapat disesuaikan
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          customTipeLaporanOptions={BELWIL_SUBSIDI_TIPE_LAPORAN}
          hideJenisAkumulasi
        />

        {/* 2. Parameter Subsidi Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Parameter Subsidi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jenis Subsidi</Label>
              {jnsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat pilihan subsidi...
                </div>
              ) : (
                <Select
                  value={reportParams.jnsBansos}
                  onValueChange={(val) =>
                    setReportParams((prev) => ({ ...prev, jnsBansos: val }))
                  }
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Pilih jenis subsidi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Subsidi</SelectItem>
                    {jnsBansosOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={BELWIL_SUBSIDI_EXCLUDED_FILTERS}
          scope="general"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 4. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <BelwilSubsidiDynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={subsidiReportParams}
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
