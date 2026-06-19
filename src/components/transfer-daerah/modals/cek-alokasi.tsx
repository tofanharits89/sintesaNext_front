"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Kunci bulan sesuai konvensi DB
export const MONTH_KEYS = [
  "jan",
  "peb",
  "mar",
  "apr",
  "mei",
  "jun",
  "jul",
  "ags",
  "sep",
  "okt",
  "nov",
  "des",
] as const;
export type MonthKey = (typeof MONTH_KEYS)[number];

export const MONTH_LABELS: Record<MonthKey, string> = {
  jan: "Januari",
  peb: "Februari",
  mar: "Maret",
  apr: "April",
  mei: "Mei",
  jun: "Juni",
  jul: "Juli",
  ags: "Agustus",
  sep: "September",
  okt: "Oktober",
  nov: "November",
  des: "Desember",
};

// Nomor urut bulan (1-indexed) untuk perbandingan
const MONTH_INDEX: Record<MonthKey, number> = {
  jan: 1,
  peb: 2,
  mar: 3,
  apr: 4,
  mei: 5,
  jun: 6,
  jul: 7,
  ags: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  des: 12,
};

export type MonthValues = Record<MonthKey, string>;

export const emptyMonthValues = (): MonthValues =>
  Object.fromEntries(MONTH_KEYS.map((k) => [k, "0"])) as MonthValues;

interface AlokasiRow {
  kdkppn: string;
  nmkppn: string;
  kdpemda: string;
  nmpemda: string;
  alokasi: number;
}

interface CekAlokasiProps {
  /** Kode pemda (kdpemda) yang dipilih di form */
  kdpemda: string;
  /**
   * Bulan dari tgl_kmk (format "01"–"12"), digunakan untuk logika auto-fill:
   * - kriteria "21": bulan yang bulanIndex > bulanKmk → auto-fill 25%×alokasi
   * - kriteria "22": bulan yang bulanIndex ≤ bulanKmk → disabled
   */
  bulanKmk: string;
  /**
   * Periode/bulan yang dipilih user di dropdown (format "01"–"12").
   * Digunakan sebagai filter `bulan` untuk query SQL ke tabel alokasi_bulanan_list.
   * (setara props.periode di sintesa lama cek_Alokasi _26.jsx)
   */
  periode: string;
  /**
   * Kriteria KMK, dari row data tabel:
   * - "21" → kriteria penundaan laporan → auto-fill 25% × alokasi dari bulan yg dipilih s.d. Des
   * - "22" → kriteria lain → auto-fill 0, input di-disable untuk bulan ≤ bulanKmk
   */
  kriteria: string;
  /** Tahun anggaran (thang), default tahun berjalan */
  thang?: string;
  /**
   * Callback dipanggil setiap kali nilai bulan berubah.
   * Nilai dalam satuan juta rupiah (bukan rupiah penuh).
   */
  onReceiveFormData: (data: MonthValues & { alokasi: number }) => void;
}

/**
 * Komponen CekAlokasi — setara dengan CekAlokasi26 di sintesa lama.
 *
 * Fungsi utama:
 * 1. Fetch alokasi bulanan daerah dari endpoint backend
 * 2. Hitung alokasiValue = alokasi * 0.25 (dalam satuan juta: alokasi DB / 1.000.000 * 0.25)
 * 3. Auto-fill tiap bulan berdasarkan kriteria dan bulanKmk (sama dengan logika cek_Alokasi _26.jsx)
 * 4. Tampilkan 12 input numerik yang bisa diedit manual
 * 5. Kirim perubahan ke parent via onReceiveFormData
 */
export function CekAlokasi({
  kdpemda,
  bulanKmk,
  periode,
  kriteria,
  thang,
  onReceiveFormData,
}: CekAlokasiProps) {
  const [formData, setFormData] = useState<MonthValues>(emptyMonthValues());

  // Fetch alokasi bulanan dari backend
  // Query menggunakan `periode` (bulan yang dipilih user) — setara props.periode di sintesa lama
  // `bulanKmk` hanya digunakan untuk logika auto-fill (setara props.bulan di sintesa lama)
  const url =
    kdpemda && periode
      ? apiPath(
          `/transfer-daerah/dau/alokasi-bulanan?kdpemda=${encodeURIComponent(kdpemda.trim())}&bulan=${encodeURIComponent(periode)}${thang ? `&thang=${encodeURIComponent(thang)}` : ""}`
        )
      : null;

  const {
    data: alokasiData,
    isLoading,
    error,
  } = useQuery<AlokasiRow[]>({
    queryKey: ["alokasi-bulanan", { kdpemda, periode, thang }],
    queryFn: async () => {
      const resp = await fetch(url!, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      const text = await resp.text();
      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      if (!text.trim()) return [];
      const result = JSON.parse(text);
      return (result?.data as AlokasiRow[]) ?? [];
    },
    enabled: !!url,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const alokasiRow = alokasiData?.[0];
  // Alokasi dari DB dalam satuan rupiah penuh → konversi ke juta untuk konsistensi input form
  const alokasiJuta = alokasiRow ? alokasiRow.alokasi / 1_000_000 : 0;
  const alokasiValue25 = alokasiJuta * 0.25; // 25% × alokasi bulan berkenaan (dalam juta)

  // Nomor urut bulan KMK (1-12)
  const bulanKmkNum = parseInt(bulanKmk || "0", 10);

  /**
   * Logika auto-fill (replika cek_Alokasi _26.jsx baris 31-82):
   * - kriteria "21" (Penundaan Laporan): tiap bulan yang bulanIndex > bulanKmkNum → alokasiValue25, sisanya "0"
   * - kriteria "22" (lain): semua "0"
   * - Jika tidak ada data alokasi: semua "0"
   */
  const computeAutoFill = useCallback(
    (alokasi25: number, kriteriaRaw: string, bulanKmkNum: number): MonthValues => {
      const k = kriteriaRaw.trim(); // trim untuk handle trailing space dari DB
      return Object.fromEntries(
        MONTH_KEYS.map((key) => {
          const idx = MONTH_INDEX[key];
          const shouldFill = k === "21" && idx > bulanKmkNum && alokasi25 > 0;
          return [key, shouldFill ? String(alokasi25) : "0"];
        })
      ) as MonthValues;
    },
    []
  );

  // Auto-fill saat data alokasi / parameter berubah
  useEffect(() => {
    if (!kdpemda || !periode) {
      const reset = emptyMonthValues();
      setFormData(reset);
      onReceiveFormData({ ...reset, alokasi: 0 });
      return;
    }
    if (alokasiRow && !isLoading) {
      // Jalankan auto-fill hanya saat data sudah selesai di-fetch (bukan saat masih loading)
      const filled = computeAutoFill(alokasiValue25, kriteria, bulanKmkNum);
      setFormData(filled);
      onReceiveFormData({ ...filled, alokasi: alokasiJuta });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alokasiRow, isLoading, kriteria, bulanKmkNum, kdpemda, periode, alokasiValue25]);

  // CATATAN: Tidak ada useEffect reset terpisah di sini.
  // useEffect di atas sudah menangani semua kasus (kdpemda/periode kosong → reset,
  // alokasiRow tersedia → auto-fill). Effect terpisah untuk reset akan
  // berjalan SETELAH effect auto-fill dan meng-override nilai yang sudah diisi.

  const handleInputChange = (key: MonthKey, value: string) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onReceiveFormData({ ...updated, alokasi: alokasiJuta });
  };

  /**
   * Apakah input bulan harus di-disable:
   * - kriteria "22": bulan ≤ bulanKmk di-disable (sama dengan cek_Alokasi _26.jsx)
   * - kriteria lain: tidak ada yang di-disable
   */
  const isDisabled = (key: MonthKey): boolean => {
    if (kriteria.trim() === "22") {
      return MONTH_INDEX[key] <= bulanKmkNum;
    }
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Info alokasi bulan berkenaan */}
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
        {isLoading ? (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Memuat alokasi bulanan...
          </span>
        ) : alokasiRow ? (
          <p className="font-medium text-center">
            Alokasi Bulan :{" "}
            <span className="text-primary">
              Rp. {alokasiRow.alokasi.toLocaleString("id-ID")}
            </span>
          </p>
        ) : kdpemda && bulanKmk ? (
          <p className="text-muted-foreground text-xs text-center">
            Data alokasi tidak ditemukan untuk daerah ini
          </p>
        ) : (
          <p className="text-muted-foreground text-xs text-center">
            Pilih KPPN, Kabupaten/Kota, dan Periode terlebih dahulu
          </p>
        )}
        {error && (
          <p className="text-destructive text-xs mt-1">
            Gagal memuat alokasi: {(error as Error).message}
          </p>
        )}
      </div>

      {/* 12 input nilai penundaan per bulan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {MONTH_KEYS.map((key) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {MONTH_LABELS[key]}
            </Label>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={formData[key]}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder="0"
              className="text-right font-mono"
              disabled={isDisabled(key)}
            />
          </div>
        ))}
      </div>

      {/* Keterangan satuan */}
      <p className="text-xs text-muted-foreground">
        Nilai dalam <strong>juta rupiah</strong>.
        {kriteria === "21" && alokasiRow && bulanKmkNum > 0 && (
          <>
            {" "}
            Nilai 25% × alokasi ={" "}
            <strong>Rp. {alokasiValue25.toLocaleString("id-ID", { maximumFractionDigits: 3 })} juta</strong>{" "}
            telah diisi otomatis untuk bulan setelah periode KMK.
          </>
        )}
      </p>
    </div>
  );
}
