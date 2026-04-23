"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { BelwilBansosDynamicFiltersCard } from "@/components/belwil/belwil-dynamic-filters-card";
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
import { Input } from "@/components/ui/input";
import { Loader2, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import type { BansosTipeLaporan } from "@/hooks/belwil/use-belwil-bansos-query-builder";
import { directBackendClient } from "@/lib/api/httpClient";
import type { QueryExecutionResult } from "@/hooks/use-inquiry-data-api";

// Filters not present in the bansos table
const BELWIL_BANSOS_EXCLUDED_FILTERS = [
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
  "kppn",
  "fungsi",
  "subFungsi",
  "program",
  "kegiatan",
  "outputKro",
  "subOutputRo",
  "akun",
  "komponen",
  "subKomponen",
  "item",
  "regional",
  "lokusAnggaran",
  "sumberDana",
  "urusanAPBD",
  "bidangAPBD",
  "subKegiatanAPBD",
  "levelAPBD",
];

const BELWIL_BANSOS_TIPE_LAPORAN = [
  { value: "belwil_bansos_all", label: "Realisasi dan Penerima" },
  { value: "belwil_bansos_realisasi", label: "Realisasi Bansos" },
  { value: "belwil_bansos_jumlah_penerima", label: "Jumlah Penerima" },
];

function encryptQuery(query: string): string {
  return btoa(encodeURIComponent(query));
}

function useKdBansosOptions(tahun: string) {
  const [options, setOptions] = useState<{ kd: string; nm: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const sql = `SELECT DISTINCT jenis_transaksi FROM monev${tahun}.bansos_pkh_bulanan`;
        const result = await directBackendClient.post<QueryExecutionResult>(
          "/inquiry-data/query",
          {
            encryptedQuery: encryptQuery(sql),
            format: "json",
            page: 1,
            pageSize: 100,
          },
        );
        if (!cancelled) {
          const rows =
            (result?.data as Record<string, string>[] | undefined) || [];
          setOptions(
            rows
              .map((r) => ({
                kd: String(r.jenis_transaksi || ""),
                nm: String(r.jenis_transaksi || ""),
              }))
              .filter((o) => o.kd),
          );
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

export default function BelwilBansosPage() {
  const currentYear = new Date().getFullYear();

  const [activeFilters, setActiveFilters] = useState<string[]>(["kementerian"]);

  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(
    {
      kementerian: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    },
  );

  const [reportParams, setReportParams] = useState({
    tahun: currentYear.toString(),
    tipeLaporan: "belwil_bansos_all" as BansosTipeLaporan,
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
    kdbansos: "all",
    kdbansosKondisi: "",
    kdbansosKataKunci: "",
    kdbansosJenisTampilan: "uraian",
    akumulatif: false,
  });

  const { options: kdBansosOptions, isLoading: kdBansosLoading } =
    useKdBansosOptions(reportParams.tahun);

  const handleBansosFilterChange = useCallback(
    (
      field:
        | "kdbansos"
        | "kdbansosKondisi"
        | "kdbansosKataKunci"
        | "kdbansosJenisTampilan",
      value: string,
    ) => {
      setReportParams((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "kdbansos" && value !== "all") {
          next.kdbansosKondisi = "";
          next.kdbansosKataKunci = "";
        } else if (field === "kdbansosKondisi" && value.trim()) {
          next.kdbansos = "all";
          next.kdbansosKataKunci = "";
        } else if (field === "kdbansosKataKunci" && value.trim()) {
          next.kdbansos = "all";
          next.kdbansosKondisi = "";
          if (prev.kdbansosJenisTampilan === "kode") {
            next.kdbansosJenisTampilan = "kode_uraian";
          }
        }
        return next;
      });
    },
    [],
  );

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
        selection: value.selection || "all",
        kondisiCode: value.kondisiCode || "",
        mengandungKata: value.mengandungKata || "",
        jenisTampilan: value.jenisTampilan || "kode",
      };
    });
    return normalized;
  }, [filterValues]);

  const bansosReportParams = useMemo(
    () => ({
      tahun: reportParams.tahun,
      tipeLaporan: reportParams.tipeLaporan,
      pembulatan: reportParams.pembulatan,
      kdbansos: reportParams.kdbansos,
      kdbansosKondisi: reportParams.kdbansosKondisi,
      kdbansosKataKunci: reportParams.kdbansosKataKunci,
      kdbansosJenisTampilan: reportParams.kdbansosJenisTampilan,
      akumulatif: reportParams.akumulatif,
    }),
    [reportParams],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Kewilayahan Bansos
        </h1>
        <p className="text-sm text-muted-foreground">
          Query builder untuk data kewilayahan bantuan sosial (bansos)
          berdasarkan lokasi dengan filter parameter yang dapat disesuaikan
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          customTipeLaporanOptions={BELWIL_BANSOS_TIPE_LAPORAN}
          hideJenisAkumulasi
        />

        {/* 2. Parameter Bansos Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Parameter Bansos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start sm:items-center">
              {/* Column 1: Label */}
              <div className="flex items-center space-x-2 min-w-0">
                <HandCoins className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium truncate">
                  Jenis Bansos
                </span>
              </div>

              {/* Column 2: Pilihan */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Pilihan</Label>
                {kdBansosLoading ? (
                  <div className="flex items-center gap-2 h-8 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Memuat...
                  </div>
                ) : (
                  <Select
                    value={reportParams.kdbansos}
                    onValueChange={(val) =>
                      handleBansosFilterChange("kdbansos", val)
                    }
                    disabled={
                      !!(
                        reportParams.kdbansosKondisi.trim() ||
                        reportParams.kdbansosKataKunci.trim()
                      )
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full h-8 text-xs",
                        (reportParams.kdbansosKondisi.trim() ||
                          reportParams.kdbansosKataKunci.trim()) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <SelectValue placeholder="Pilih jenis bansos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis Bansos</SelectItem>
                      {kdBansosOptions.map((opt) => (
                        <SelectItem key={opt.kd} value={opt.kd}>
                          {opt.nm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Column 3: Kondisi */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Kondisi</Label>
                <Input
                  placeholder="Kode kondisi"
                  value={reportParams.kdbansosKondisi}
                  onChange={(e) =>
                    handleBansosFilterChange("kdbansosKondisi", e.target.value)
                  }
                  disabled={
                    !!(
                      reportParams.kdbansos !== "all" ||
                      reportParams.kdbansosKataKunci.trim()
                    )
                  }
                  className={cn(
                    "w-full h-8 text-xs placeholder:text-xs",
                    (reportParams.kdbansos !== "all" ||
                      reportParams.kdbansosKataKunci.trim()) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                />
              </div>

              {/* Column 4: Kata Kunci */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Kata Kunci</Label>
                <Input
                  placeholder="Nama bansos"
                  value={reportParams.kdbansosKataKunci}
                  onChange={(e) =>
                    handleBansosFilterChange(
                      "kdbansosKataKunci",
                      e.target.value,
                    )
                  }
                  disabled={
                    !!(
                      reportParams.kdbansos !== "all" ||
                      reportParams.kdbansosKondisi.trim()
                    )
                  }
                  className={cn(
                    "w-full h-8 text-xs placeholder:text-xs",
                    (reportParams.kdbansos !== "all" ||
                      reportParams.kdbansosKondisi.trim()) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                />
              </div>

              {/* Column 5: Tampilan */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tampilan</Label>
                <Select
                  value={reportParams.kdbansosJenisTampilan}
                  onValueChange={(val) =>
                    handleBansosFilterChange("kdbansosJenisTampilan", val)
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uraian">Uraian</SelectItem>
                    <SelectItem value="jangan_tampilkan">
                      Jangan Tampilkan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={BELWIL_BANSOS_EXCLUDED_FILTERS}
          scope="belwil"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 4. Dynamic Filters + Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <BelwilBansosDynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={bansosReportParams}
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
