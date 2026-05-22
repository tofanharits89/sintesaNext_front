"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTematikCategoryOptions } from "./categoryRegistry";

interface PilihLaporanCardProps {
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisAkumulasi: string;
    // Optional field for tematik category selection on tematik page
    tematikKategori?: string;
  };
  setReportParams: React.Dispatch<React.SetStateAction<any>>;
  // Optional overrides for tematik and rkakl_detail context
  mode?:
    | "general"
    | "tematik"
    | "rkakl_detail"
    | "kontrak"
    | "up_tup"
    | "penerimaan_pnbp"
    | "sp2d"
    | "revisi_dipa"
    | "deviasi";
  customTipeLaporanOptions?: { value: string; label: string }[];
  hideJenisAkumulasi?: boolean;
}

export function PilihLaporanCard({
  reportParams,
  setReportParams,
  mode = "general",
  customTipeLaporanOptions,
  hideJenisAkumulasi = false,
}: PilihLaporanCardProps) {
  // Generate years from current year down to 2014
  const currentYear = new Date().getFullYear();

  let years;
  if (reportParams.tipeLaporan.startsWith("belwil")) {
    years = Array.from(
      { length: currentYear - 2025 + 1 },
      (_, i) => currentYear - i,
    );
  } else if (reportParams.tipeLaporan.startsWith("apbd")) {
    years = Array.from(
      { length: currentYear - 2024 + 1 },
      (_, i) => currentYear - i,
    );
  } else {
    years = Array.from(
      { length: currentYear - 2014 + 1 },
      (_, i) => currentYear - i,
    );
  }

  const defaultTipeLaporanOptions = [
    { value: "pagu_apbn", label: "1. Pagu APBN" },
    { value: "pagu_realisasi", label: "2. Pagu Realisasi" },
    { value: "pagu_realisasi_bulanan", label: "3. Pagu Realisasi Bulanan" },
    { value: "pergerakan_pagu_bulanan", label: "4. Pergerakan Pagu Bulanan" },
    {
      value: "pergerakan_blokir_bulanan",
      label: "5. Pergerakan Blokir Bulanan",
    },
    {
      value: "pergerakan_blokir_bulanan_per_jenis",
      label: "6. Pergerakan Blokir Bulanan Per Jenis",
    },
    {
      value: "volume_output_kegiatan",
      label: "7. Volume Output Kegiatan (Data Caput)",
    },
  ];

  // RKAKL Detail specific options - only Pagu dan Blokir
  const rkaklDetailTipeLaporanOptions = [
    { value: "pagu_dan_blokir", label: "Pagu dan Blokir" },
  ];

  const kontrakTipeLaporanOptions = [
    { value: "semua_kontrak", label: "1. Semua Kontrak" },
    { value: "kontrak_valas", label: "2. Kontrak Valas" },
  ];

  const upTupTipeLaporanOptions = [
    { value: "outstanding_up_tup", label: "Outstanding UP/TUP" },
  ];

  const penerimaaanPnbpTipeLaporanOptions = [
    { value: "detil_penerimaan_pnbp", label: "Detil Penerimaan PNBP" },
  ];

  const sp2dTipeLaporanOptions = [{ value: "spm_sp2d", label: "SPM/SP2D" }];

  const revisiDipaTipeLaporanOptions = [
    { value: "revisi_dipa", label: "Revisi" },
  ];

  const deviasiTipeLaporanOptions = [
    { value: "deviasi_output", label: "1. Deviasi Output Belanja (Bulanan)" },
    { value: "deviasi_pnbp", label: "2. Deviasi PNBP (Bulanan)" },
  ];

  // Use appropriate options based on mode
  const tipeLaporanOptions =
    mode === "tematik"
      ? customTipeLaporanOptions || getTematikCategoryOptions()
      : mode === "rkakl_detail"
        ? customTipeLaporanOptions || rkaklDetailTipeLaporanOptions
        : mode === "kontrak"
          ? customTipeLaporanOptions || kontrakTipeLaporanOptions
          : mode === "up_tup"
            ? customTipeLaporanOptions || upTupTipeLaporanOptions
            : mode === "penerimaan_pnbp"
              ? customTipeLaporanOptions || penerimaaanPnbpTipeLaporanOptions
              : mode === "sp2d"
                ? customTipeLaporanOptions || sp2dTipeLaporanOptions
                : mode === "revisi_dipa"
                  ? customTipeLaporanOptions || revisiDipaTipeLaporanOptions
                  : mode === "deviasi"
                    ? customTipeLaporanOptions || deviasiTipeLaporanOptions
                    : customTipeLaporanOptions || defaultTipeLaporanOptions;

  const pembulatanOptions = [
    { value: "satuan", label: "Satuan" },
    { value: "ribuan", label: "Ribuan" },
    { value: "jutaan", label: "Jutaan" },
    { value: "miliaran", label: "Miliaran" },
    { value: "triliunan", label: "Triliunan" },
  ];

  const jenisAkumulasiOptions = [
    { value: "non_akumulatif", label: "Non-Akumulatif" },
    { value: "akumulatif", label: "Akumulatif" },
  ];

  const handleChange = (field: string, value: string) => {
    setReportParams((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Pilih Laporan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tahun Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tahun</label>
            <Select
              value={reportParams.tahun}
              onValueChange={(value) => handleChange("tahun", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Tipe Laporan and Jenis Akumulasi Column */}
          <div className="space-y-4">
            {/* Tipe Laporan Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {mode === "tematik"
                  ? "Kategori Tematik"
                  : mode === "rkakl_detail"
                    ? "Tipe Laporan RKAKL"
                    : mode === "kontrak"
                      ? "Tipe Laporan Kontrak"
                      : mode === "up_tup"
                        ? "Tipe Laporan UP/TUP"
                        : mode === "penerimaan_pnbp"
                          ? "Tipe Laporan Penerimaan PNBP"
                          : mode === "sp2d"
                            ? "Tipe Laporan SPM/SP2D"
                            : mode === "revisi_dipa"
                              ? "Tipe Laporan Revisi DIPA"
                              : mode === "deviasi"
                                ? "Tipe Laporan Deviasi"
                                : "Tipe Laporan"}
              </label>
              <Select
                value={
                  mode === "tematik"
                    ? (reportParams.tematikKategori ?? "")
                    : reportParams.tipeLaporan
                }
                onValueChange={(value) =>
                  handleChange(
                    mode === "tematik" ? "tematikKategori" : "tipeLaporan",
                    value,
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      mode === "tematik"
                        ? "Pilih kategori tematik"
                        : mode === "rkakl_detail"
                          ? "Pilih tipe laporan RKAKL"
                          : mode === "kontrak"
                            ? "Pilih tipe laporan kontrak"
                            : mode === "up_tup"
                              ? "Pilih tipe laporan UP/TUP"
                              : mode === "penerimaan_pnbp"
                                ? "Pilih tipe laporan Penerimaan PNBP"
                                : mode === "sp2d"
                                  ? "Pilih tipe laporan SPM/SP2D"
                                  : mode === "revisi_dipa"
                                    ? "Pilih tipe laporan Revisi DIPA"
                                    : mode === "deviasi"
                                      ? "Pilih tipe laporan Deviasi"
                                      : "Pilih tipe laporan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {tipeLaporanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Akumulasi Selection - Only show when allowed and Pagu Realisasi Bulanan is selected */}
            {!hideJenisAkumulasi &&
              reportParams.tipeLaporan === "pagu_realisasi_bulanan" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis Akumulasi</label>
                  <Select
                    value={reportParams.jenisAkumulasi}
                    onValueChange={(value) =>
                      handleChange("jenisAkumulasi", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis akumulasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisAkumulasiOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
          </div>

          {/* Pembulatan Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pembulatan</label>
            <Select
              value={reportParams.pembulatan}
              onValueChange={(value) => handleChange("pembulatan", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih pembulatan" />
              </SelectTrigger>
              <SelectContent>
                {pembulatanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
