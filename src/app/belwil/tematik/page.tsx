"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PilihLaporanCard } from "@/components/inquiry-data/pilih-laporan-card";
import { FilterParametersCard } from "@/components/inquiry-data/filter-parameters-card";
import { BelwilTematikDynamicFiltersCard } from "@/components/belwil/belwil-dynamic-filters-card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";
import type { BelwilTematikTipeLaporan } from "@/hooks/belwil/use-belwil-query-builder";
import { directBackendClient } from "@/lib/api/httpClient";
import type { QueryExecutionResult } from "@/hooks/use-inquiry-data-api";

// Filters not present in the tematik kewilayahan tables - exclude from filter panel
const BELWIL_TEMATIK_EXCLUDED_FILTERS = [
  "cutOff",
  "jenisAkumulasi",
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

const BELWIL_TEMATIK_TIPE_LAPORAN = [
  { value: "belwil_tematik_prioritasPresiden", label: "Prioritas Presiden" },
  { value: "belwil_tematik_inflasi", label: "Inflasi" },
];

interface RefOption {
  value: string;
  label: string;
}

function encryptQuery(query: string): string {
  return btoa(encodeURIComponent(query));
}

function useRefOptions(tahun: string, tipeLaporan: BelwilTematikTipeLaporan) {
  const [prioPresOptions, setPrioPresOptions] = useState<RefOption[]>([]);
  const [infIntervensiOptions, setInfIntervensiOptions] = useState<RefOption[]>(
    [],
  );
  const [infPengeluaranOptions, setInfPengeluaranOptions] = useState<
    RefOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuery = useCallback(async (sql: string): Promise<any[]> => {
    try {
      const result = await directBackendClient.post<QueryExecutionResult>(
        "/inquiry-data/query",
        {
          encryptedQuery: encryptQuery(sql),
          format: "json",
          page: 1,
          pageSize: 100,
        },
      );
      return result?.data || [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        if (tipeLaporan === "belwil_tematik_prioritasPresiden") {
          const rows = await fetchQuery(
            `SELECT DISTINCT kdpriopres, nmpriopres FROM dbref.t_priopres_${tahun} ORDER BY kdpriopres`,
          );

          if (!cancelled) {
            setPrioPresOptions(
              rows.map((r: any) => ({
                value: r.kdpriopres,
                label: `${r.kdpriopres} - ${r.nmpriopres}`,
              })),
            );
          }
        } else if (tipeLaporan === "belwil_tematik_inflasi") {
          const [interventRows, pengeluaranRows] = await Promise.all([
            fetchQuery(
              `SELECT inf_intervensi, ur_inf_intervensi FROM dbref.ref_inf_intervensi_${tahun} ORDER BY inf_intervensi`,
            ),
            fetchQuery(
              `SELECT inf_pengeluaran, ur_inf_pengeluaran FROM dbref.ref_inf_pengeluaran_${tahun} ORDER BY inf_pengeluaran`,
            ),
          ]);
          if (!cancelled) {
            setInfIntervensiOptions(
              interventRows.map((r: any) => ({
                value: r.inf_intervensi,
                label: `${r.inf_intervensi} - ${r.ur_inf_intervensi}`,
              })),
            );
            setInfPengeluaranOptions(
              pengeluaranRows.map((r: any) => ({
                value: r.inf_pengeluaran,
                label: `${r.inf_pengeluaran} - ${r.ur_inf_pengeluaran}`,
              })),
            );
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tahun, tipeLaporan, fetchQuery]);

  return {
    prioPresOptions,
    infIntervensiOptions,
    infPengeluaranOptions,
    isLoading,
  };
}

const jenisTampilanOptions = [
  { value: "kode", label: "Kode" },
  { value: "kode_uraian", label: "Kode Uraian" },
  { value: "uraian", label: "Uraian" },
  { value: "jangan_tampilkan", label: "Jangan Tampilkan" },
];

interface TematikFilterRowProps {
  label: string;
  fieldKey: string;
  options: RefOption[];
  allLabel: string;
  filterData: {
    selection: string;
    kondisiCode: string;
    mengandungKata: string;
    jenisTampilan: string;
  };
  onChange: (fieldKey: string, field: string, value: string) => void;
}

function TematikFilterRow({
  label,
  fieldKey,
  options,
  allLabel,
  filterData,
  onChange,
}: TematikFilterRowProps) {
  const selectionActive = filterData.selection !== "all";
  const kondisiActive = filterData.kondisiCode.trim() !== "";
  const kataActive = filterData.mengandungKata.trim() !== "";

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pilihan */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pilihan</Label>
          <Select
            value={filterData.selection}
            onValueChange={(val) => onChange(fieldKey, "selection", val)}
            disabled={kondisiActive || kataActive}
          >
            <SelectTrigger
              className={`w-full h-8 text-xs ${kondisiActive || kataActive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <SelectValue placeholder={allLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{allLabel}</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label.length > 40
                    ? opt.label.substring(0, 40) + "..."
                    : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kondisi */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Kondisi</Label>
          <Input
            placeholder="Kode kondisi"
            value={filterData.kondisiCode}
            onChange={(e) => onChange(fieldKey, "kondisiCode", e.target.value)}
            disabled={selectionActive || kataActive}
            className={`w-full h-8 text-xs placeholder:text-xs ${selectionActive || kataActive ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Kata Kunci */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Kata Kunci</Label>
          <Input
            placeholder="Kata kunci"
            value={filterData.mengandungKata}
            onChange={(e) =>
              onChange(fieldKey, "mengandungKata", e.target.value)
            }
            disabled={selectionActive || kondisiActive}
            className={`w-full h-8 text-xs placeholder:text-xs ${selectionActive || kondisiActive ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Tampilan */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tampilan</Label>
          <Select
            value={filterData.jenisTampilan}
            onValueChange={(val) => onChange(fieldKey, "jenisTampilan", val)}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Pilih tampilan" />
            </SelectTrigger>
            <SelectContent>
              {jenisTampilanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default function BelwilTematikPage() {
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
    tipeLaporan: "belwil_tematik_prioritasPresiden" as BelwilTematikTipeLaporan,
    pembulatan: "satuan",
    jenisAkumulasi: "non_akumulatif",
    jenisDataLokasi: "Kegiatan",
    kdpriopres: "all",
    infIntervensi: "all",
    infPengeluaran: "all",
  });

  // Extra filter state for tematik-specific fields (pilihan/kondisi/kata kunci/tampilan)
  const [tematikFilterValues, setTematikFilterValues] = useState<
    Record<
      string,
      {
        selection: string;
        kondisiCode: string;
        mengandungKata: string;
        jenisTampilan: string;
      }
    >
  >({
    kdpriopres: {
      selection: "all",
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode",
    },
    infIntervensi: {
      selection: "all",
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode",
    },
    infPengeluaran: {
      selection: "all",
      kondisiCode: "",
      mengandungKata: "",
      jenisTampilan: "kode",
    },
  });

  const handleTematikFilterChange = useCallback(
    (fieldKey: string, field: string, value: string) => {
      setTematikFilterValues((prev) => {
        const existing = prev[fieldKey] ?? {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode",
        };
        const updated = { ...existing, [field]: value };
        // Mutual exclusion: if selection is set, clear kondisiCode and mengandungKata
        if (field === "selection" && value !== "all") {
          updated.kondisiCode = "";
          updated.mengandungKata = "";
        } else if (field === "kondisiCode" && value.trim()) {
          updated.selection = "all";
          updated.mengandungKata = "";
        } else if (field === "mengandungKata" && value.trim()) {
          updated.selection = "all";
          updated.kondisiCode = "";
          if (updated.jenisTampilan !== "kode_uraian")
            updated.jenisTampilan = "kode_uraian";
        }
        return { ...prev, [fieldKey]: updated };
      });
      // Also sync to reportParams for the simple selection field
      if (field === "selection") {
        setReportParams((prev) => ({ ...prev, [fieldKey]: value }));
      }
    },
    [],
  );

  // Reset tematik-specific filter values and reportParams when tipeLaporan changes
  useEffect(() => {
    setTematikFilterValues({
      kdpriopres: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
      infIntervensi: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
      infPengeluaran: {
        selection: "all",
        kondisiCode: "",
        mengandungKata: "",
        jenisTampilan: "kode",
      },
    });
    setReportParams((prev) => ({
      ...prev,
      kdpriopres: "all",
      infIntervensi: "all",
      infPengeluaran: "all",
    }));
  }, [reportParams.tipeLaporan]);

  const {
    prioPresOptions,
    infIntervensiOptions,
    infPengeluaranOptions,
    isLoading: refLoading,
  } = useRefOptions(reportParams.tahun, reportParams.tipeLaporan);

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

  // Build tematikReportParams — conditionally include optional fields to satisfy exactOptionalPropertyTypes
  const tematikReportParams = useMemo(() => {
    const base = {
      tahun: reportParams.tahun,
      tipeLaporan: reportParams.tipeLaporan,
      pembulatan: reportParams.pembulatan,
      jenisDataLokasi: reportParams.jenisDataLokasi,
    };
    if (reportParams.tipeLaporan === "belwil_tematik_prioritasPresiden") {
      return { ...base, kdpriopres: reportParams.kdpriopres };
    }
    if (reportParams.tipeLaporan === "belwil_tematik_inflasi") {
      return {
        ...base,
        infIntervensi: reportParams.infIntervensi,
        infPengeluaran: reportParams.infPengeluaran,
      };
    }
    return base;
  }, [reportParams]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Kewilayahan Tematik
        </h1>
        <p className="text-sm text-muted-foreground">
          Query builder untuk data kewilayahan tematik berdasarkan lokus dengan
          filter parameter yang dapat disesuaikan
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Pilih Laporan Card */}
        <PilihLaporanCard
          reportParams={reportParams}
          setReportParams={setReportParams}
          customTipeLaporanOptions={BELWIL_TEMATIK_TIPE_LAPORAN}
          hideJenisAkumulasi
        />

        {/* 2 & 3. Jenis Data Lokasi + Tematik filter (merged card) */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Parameter Tematik
              <span className="text-xs font-normal text-muted-foreground bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                Wajib
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jenis Data Lokasi */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jenis Data Lokasi</Label>
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
            </div>

            <div className="border-t pt-4">
              {refLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat pilihan...
                </div>
              ) : reportParams.tipeLaporan ===
                "belwil_tematik_prioritasPresiden" ? (
                <TematikFilterRow
                  label="Prioritas Presiden"
                  fieldKey="kdpriopres"
                  options={prioPresOptions}
                  allLabel="Semua Prioritas Presiden"
                  filterData={
                    tematikFilterValues.kdpriopres ?? {
                      selection: "all",
                      kondisiCode: "",
                      mengandungKata: "",
                      jenisTampilan: "kode",
                    }
                  }
                  onChange={handleTematikFilterChange}
                />
              ) : (
                <div className="space-y-4">
                  <TematikFilterRow
                    label="Intervensi Inflasi"
                    fieldKey="infIntervensi"
                    options={infIntervensiOptions}
                    allLabel="Semua Intervensi"
                    filterData={
                      tematikFilterValues.infIntervensi ?? {
                        selection: "all",
                        kondisiCode: "",
                        mengandungKata: "",
                        jenisTampilan: "kode",
                      }
                    }
                    onChange={handleTematikFilterChange}
                  />
                  <TematikFilterRow
                    label="Pengeluaran Inflasi"
                    fieldKey="infPengeluaran"
                    options={infPengeluaranOptions}
                    allLabel="Semua Pengeluaran"
                    filterData={
                      tematikFilterValues.infPengeluaran ?? {
                        selection: "all",
                        kondisiCode: "",
                        mengandungKata: "",
                        jenisTampilan: "kode",
                      }
                    }
                    onChange={handleTematikFilterChange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Filter Parameters Card */}
        <FilterParametersCard
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          excludeFilters={BELWIL_TEMATIK_EXCLUDED_FILTERS}
          scope="belwil"
          tipeLaporan={reportParams.tipeLaporan}
        />

        {/* 5. Dynamic Filters and Actions Card */}
        <Suspense fallback={<FilterCardSkeleton />}>
          <BelwilTematikDynamicFiltersCard
            activeFilters={activeFilters}
            reportParams={tematikReportParams}
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
