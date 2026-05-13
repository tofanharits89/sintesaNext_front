"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  KanwilContent,
  KanwilContentRef,
  RingkasanKanwilData,
} from "@/components/monev-kkp/kanwil-content";
import { MonevKkpPageSkeleton } from "@/components/monev-kkp/monev-page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, LayoutList, Building2, Send } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";
import { useAuth } from "@/hooks/useAuth";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import kdkanwilData from "@/data/kdkanwil.json";
import { Spinner } from "@/components/ui/spinner";

// Allowed roles for Kanwil page
const ALLOWED_ROLES = ["kanwil_djpb", "super_admin", "co_admin"];

// Helper function to format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percent
const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export default function MonevKkpKanwilPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("ringkasan-kanwil");
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusLaporan, setStatusLaporan] = useState<"sent" | "not_sent">(
    "not_sent",
  );
  const [tglKirimKanwil, setTglKirimKanwil] = useState<string | null>(null);
  const [allKppnSent, setAllKppnSent] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const kanwilContentRef = useRef<KanwilContentRef>(null);

  // Get default periode selection: previous triwulan from current date
  const getInitialPeriode = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentQ = Math.ceil(currentMonth / 3);

    let prevQ = currentQ - 1;
    let prevYear = currentYear;

    if (prevQ === 0) {
      prevQ = 4;
      prevYear = currentYear - 1;
    }

    return {
      year: String(prevYear),
      periode: `Q${prevQ}`,
    };
  };

  const initial = getInitialPeriode();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedPeriode, setSelectedPeriode] = useState(initial.periode);

  // Helper to check if the selected period has ended
  const isPeriodPast = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentQ = Math.ceil(currentMonth / 3);

    const targetYear = parseInt(selectedYear);
    const targetQ = parseInt(selectedPeriode.replace("Q", ""));

    if (currentYear > targetYear) return true;
    if (currentYear === targetYear && currentQ > targetQ) return true;
    return false;
  };

  // Role-based access control
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!ALLOWED_ROLES.includes(user.role as string)) {
      router.push("/unauthorized?reason=monev_kkp_kanwil_access_denied");
    }
  }, [user, isLoading, router]);

  // Fetch kanwil laporan status whenever year/periode changes
  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      // Reset state to avoid stale UI while loading
      setStatusLaporan("not_sent");
      setTglKirimKanwil(null);
      setAllKppnSent(false);

      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const ts = new Date().getTime();
        const response = await fetch(
          apiPath(
            `/monev-kkp/status-laporan-kanwil?tahun=${selectedYear}&triwulan=${triwulan}&_t=${ts}`,
          ),
          {
            credentials: "include",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );
        if (!response.ok) return;
        const result = await response.json();
        if (result.data?.sts_kirim_kanwil === "1") {
          setStatusLaporan("sent");
          setTglKirimKanwil(result.data?.tgkirim_kanwil || null);
        } else {
          setStatusLaporan("not_sent");
          setTglKirimKanwil(null);
        }
        setAllKppnSent(!!result.data?.all_kppn_sent);
      } catch (error) {
        console.error("Error fetching status laporan kanwil:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchStatus();
  }, [user, selectedYear, selectedPeriode]);

  // Callback from KanwilContent when filters change
  const handlePeriodeChange = useCallback((year: string, periode: string) => {
    setSelectedYear(year);
    setSelectedPeriode(periode);
  }, []);

  if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
    return (
      <MonevKkpPageSkeleton
        actionCount={3}
        tabCount={2}
        filterCount={3}
        showStatusBadge
      />
    );
  }

  const handleExportExcel = async () => {
    setIsExporting(true);

    // Give time for the spinner to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Fetch ALL data from API (not just current page)
      toast.info("Sedang menyiapkan data Excel, harap tunggu...");
      const triwulanNum = selectedPeriode.replace("Q", "");
      const ts = new Date().getTime();

      let regionalParams = "";
      if (user?.role === "kanwil_djpb" && user.kdkanwil) {
        regionalParams = `&kdkanwil=${user.kdkanwil}`;
      }
      const apiUrl = apiPath(
        `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulanNum}${regionalParams}&page=1&limit=100000&_t=${ts}`,
      );
      const response = await fetch(apiUrl, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!response.ok) throw new Error("Gagal mengambil data untuk export");
      const result = await response.json();

      const data: RingkasanKanwilData[] = (result.data || []).map((item: any, index: number) => ({
        id: `${item.kdsatker}-${index}`,
        kodeKppn: item.kdkppn,
        kdkppn: item.kdkppn,
        kdkanwil: item.kdkanwil,
        namaKppn: item.nmkppn || item.kdkppn || "-",
        kodeBA: item.kddept,
        kodeSatker: item.kdsatker,
        namaSatker: item.nmsatker,
        upKkpPerBulan: Number(item.nilai_up_kkp || 0),
        porsiUpKkp: Number(item.porsi_up_kkp_dari_total_up || 0),
        bankPenerbit: item.bank_penerbit,
        jmlKartuUsul: item.jml_kartu_usul !== undefined && item.jml_kartu_usul !== null ? Number(item.jml_kartu_usul) : null,
        jumlahKartu: Number(item.jumlah_kartu || 0),
        jmlKartuOpr: Number(item.jml_kartu_opr || 0),
        limitOpr: Number(item.limit_opr || 0),
        jmlKartuPd: Number(item.jml_kartu_pd || 0),
        limitPd: Number(item.limit_pd || 0),
        nilaiTagihan: Number(item.nilai_tagihan || 0),
        nilaiTransaksi: Number(item.nilai_trans_sp2d || 0),
        kendala: item.kendala || "",
        detil_kendala: item.detil_kendala || "",
        detil_masukan_kendala: item.detil_masukan_kendala || "",
        nomor_pks: item.nomor_pks || "",
        tanggal_pks: item.tanggal_pks || "",
        nomor_surat_up: item.nomor_surat_up || "",
        tanggal_surat_up: item.tanggal_surat_up || "",
        tanggal_ctk_tagihan: item.tanggal_ctk_tagihan || "",
        tanggal_jth_tempo: item.tanggal_jth_tempo || "",
        nomor_sp2d_list: item.nomor_sp2d_list || "",
        tanggal_sp2d_list: item.tanggal_sp2d_list || "",
        jenis_belanja_list: item.jenis_belanja_list || "",
      }));

      if (data.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      // Convert selected periode (e.g. "Q1") to Roman numeral for the header
      const romanNumerals: Record<string, string> = {
        Q1: "I",
        Q2: "II",
        Q3: "III",
        Q4: "IV",
      };
      const triwulanRoman =
        romanNumerals[selectedPeriode] ?? selectedPeriode.replace("Q", "");

      // Title header rows
      const titleRow1 = [
        "LAPORAN MONITORING DAN EVALUASI PELAKSANAAN PEMBAYARAN DENGAN KKP",
      ];
      const titleRow2 = [
        `TINGKAT KANWIL DJPB TRIWULAN ${triwulanRoman} TAHUN ${selectedYear}`,
      ];

      // Row 3: empty spacer, Row 4: Kanwil info from logged-in user (Nama first, then Kode)
      const emptyRow: string[] = [];

      // Get nmlokasi from kdkanwil.json mapping
      const kanwilItem = kdkanwilData.find(
        (k: any) => k.kdkanwil === user?.kdkanwil,
      );
      const nmLokasiExport = kanwilItem?.nmlokasi
        ? `KANWIL DJPB PROVINSI ${kanwilItem.nmlokasi}`
        : user?.nmkanwil || "-";

      const kanwilRow = [
        "NAMA KANWIL:",
        nmLokasiExport,
        "",
        "",
        "KODE KANWIL:",
        user?.kdkanwil || "-",
      ];

      // Three-level header:
      // Non-grouped (cols 0-7, 19-28): label in top row, vertically merged down to bottom row (r4-r6)
      // Group 1 & 2 & 4 (cols 8-14, 19-25): parent label in top row (r4), child labels in mid row (r5) vertically merged to bottom row (r6)
      // Group 3 (cols 15-18): parent label in top row (r4), sub-labels in mid row (r5), child labels in bot row (r6)
      const group1Start = 8;
      const group1End = 11;
      const group2Start = 12;
      const group2End = 14;
      const group3Start = 15;
      const group3End = 18;
      const group4Start = 19;
      const group4End = 25;

      const topHeaderRow = [
        "NO",
        "KODE KPPN",
        "NAMA KPPN",
        "KODE BA",
        "KODE SATKER",
        "NAMA SATKER",
        "NOMOR PKS",
        "TANGGAL PKS",
        // Group 1: cols 8–11
        "SURAT PERSETUJUAN/PERUBAHAN PERSETUJUAN BESARAN UP KKP",
        "",
        "",
        "",
        // Group 2: cols 12–14
        "STATUS KKP",
        "",
        "",
        // Group 3: cols 15-18
        "JUMLAH DAN TOTAL LIMIT KKP YANG DISETUJUI BANK",
        "",
        "",
        "",
        // Group 4: cols 19-25
        "RINGKASAN BELANJA DAN PEMBAYARAN",
        "",
        "",
        "",
        "",
        "",
        "",
        // Non-grouped rest: cols 26–28
        "KATEGORI KENDALA",
        "DETIL KENDALA",
        "DETIL MASUKAN",
      ];

      const midHeaderRow = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        // Group 1 child labels
        "NOMOR SURAT PENETAPAN UP",
        "TANGGAL SURAT PENETAPAN UP",
        "UP KKP PER BULAN",
        "PORSI UP KKP DARI TOTAL UP (%)",
        // Group 2 child labels
        "BANK PENERBIT KKP",
        "JUMLAH KKP YANG DIUSULKAN KE BANK PENERBIT KKP",
        "JUMLAH KKP YANG SUDAH DITERIMA",
        // Group 3 mid labels
        "KKP UNTUK KEPERLUAN BELANJA OPERASIONAL DAN BELANJA MODAL",
        "",
        "KKP UNTUK KEPERLUAN BELANJA PERJALANAN DINAS JABATAN",
        "",
        // Group 4 child labels
        "TANGGAL CETAK TAGIHAN PER BULAN",
        "TANGGAL JATUH TEMPO PEMBAYARAN PER BULAN",
        "TOTAL TAGIHAN BANK (DALAM RUPIAH)",
        "TOTAL TAGIHAN KKP YANG DIBAYARKAN (DALAM RUPIAH)",
        "NOMOR SP2D GUP/SP2D PTUP KKP",
        "TANGGAL SP2D GUP/SP2D PTUP KKP",
        "JENIS TRANSAKSI BELANJA YANG TELAH DILAKUKAN DENGAN MENGGUNAKAN KKP",
        // Non-grouped rest
        "",
        "",
        "",
      ];

      const botHeaderRow = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        // Group 1
        "",
        "",
        "",
        "",
        // Group 2
        "",
        "",
        "",
        // Group 3 bot labels
        "JUMLAH KARTU",
        "TOTAL LIMIT (DALAM RUPIAH)",
        "JUMLAH KARTU",
        "TOTAL LIMIT (DALAM RUPIAH)",
        // Group 4
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        // Non-grouped rest
        "",
        "",
        "",
      ];

      const totalCols = topHeaderRow.length; // 29 columns

      // Data rows
      const dataRows = data.map((row: RingkasanKanwilData, index: number) => [
        index + 1,
        row.kodeKppn,
        row.namaKppn,
        row.kodeBA,
        row.kodeSatker,
        row.namaSatker,
        row.nomor_pks || "-",
        row.tanggal_pks
          ? new Date(row.tanggal_pks).toLocaleDateString("id-ID")
          : "-",
        row.nomor_surat_up || "-",
        row.tanggal_surat_up
          ? new Date(row.tanggal_surat_up).toLocaleDateString("id-ID")
          : "-",
        row.upKkpPerBulan,
        row.porsiUpKkp,
        row.bankPenerbit,
        row.jmlKartuUsul ?? "-",
        row.jumlahKartu,
        row.jmlKartuOpr,
        row.limitOpr,
        row.jmlKartuPd,
        row.limitPd,
        row.tanggal_ctk_tagihan || "-",
        row.tanggal_jth_tempo || "-",
        row.nilaiTagihan,
        row.nilaiTransaksi,
        row.nomor_sp2d_list || "-",
        row.tanggal_sp2d_list || "-",
        row.jenis_belanja_list || "-",
        row.kendala || "-",
        row.detil_kendala || "-",
        row.detil_masukan_kendala || "-",
      ]);

      // Build sheet: title1, title2, empty, kanwil, topHeader, midHeader, botHeader, data
      const aoaData = [
        titleRow1,
        titleRow2,
        emptyRow,
        kanwilRow,
        topHeaderRow,
        midHeaderRow,
        botHeaderRow,
        ...dataRows,
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

      // Merges
      const lastCol = totalCols - 1;
      const merges: XLSX.Range[] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }, // Title 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }, // Title 2
        // Top header groups (r4)
        { s: { r: 4, c: group1Start }, e: { r: 4, c: group1End } },
        { s: { r: 4, c: group2Start }, e: { r: 4, c: group2End } },
        { s: { r: 4, c: group3Start }, e: { r: 4, c: group3End } },
        { s: { r: 4, c: group4Start }, e: { r: 4, c: group4End } },
        // Mid header groups (r5)
        { s: { r: 5, c: group3Start }, e: { r: 5, c: group3Start + 1 } },
        { s: { r: 5, c: group3Start + 2 }, e: { r: 5, c: group3End } },
      ];

      // Vertical merges for non-grouped cols (r4 to r6)
      for (let c = 0; c < group1Start; c++)
        merges.push({ s: { r: 4, c }, e: { r: 6, c } });
      for (let c = group4End + 1; c < totalCols; c++)
        merges.push({ s: { r: 4, c }, e: { r: 6, c } });

      // Vertical merges for group 1 & 2 & 4 children (r5 to r6)
      for (let c = group1Start; c <= group2End; c++)
        merges.push({ s: { r: 5, c }, e: { r: 6, c } });
      for (let c = group4Start; c <= group4End; c++)
        merges.push({ s: { r: 5, c }, e: { r: 6, c } });

      worksheet["!merges"] = merges;

      // --- Styling ---
      const boldStyle = { font: { bold: true } };
      const borderStyle = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      // Title rows (r=0, r=1): bold only col 0
      for (const r of [0, 1]) {
        const addr = XLSX.utils.encode_cell({ r, c: 0 });
        if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };
        worksheet[addr].s = boldStyle;
      }

      // Kanwil row (r=3): bold label+value pairs (cols 0,1 and 4,5)
      for (const c of [0, 1, 4, 5]) {
        const addr = XLSX.utils.encode_cell({ r: 3, c });
        if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };
        worksheet[addr].s = boldStyle;
      }

      // Apply styling to table area (headers at r=4,5,6 and data rows onwards)
      const accountingCols = new Set([10, 16, 18, 21, 22]);
      const centeredCols = new Set([0, 1, 3, 4, 11, 13, 14, 15, 17]);
      for (let r = 4; r < aoaData.length; r++) {
        for (let c = 0; c < totalCols; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };

          const isHeader = r <= 6;

          if (
            !isHeader &&
            accountingCols.has(c) &&
            typeof worksheet[addr].v === "number"
          ) {
            worksheet[addr].z = "#,##0";
          }

          worksheet[addr].s = {
            ...(worksheet[addr].s || {}),
            border: borderStyle,
            font: {
              ...(worksheet[addr].s?.font || {}),
              bold: isHeader,
            },
            alignment: {
              horizontal: isHeader
                ? "center"
                : centeredCols.has(c)
                  ? "center"
                  : accountingCols.has(c)
                    ? "right"
                    : "left",
              vertical: isHeader ? "center" : "bottom",
              wrapText: isHeader,
            },
          };
        }
      }

      // Set column widths
      worksheet["!cols"] = [
        { wch: 5 }, // No
        { wch: 12 }, // Kode KPPN
        { wch: 20 }, // Nama KPPN
        { wch: 10 }, // Kode BA
        { wch: 12 }, // Kode Satker
        { wch: 30 }, // Nama Satker
        { wch: 25 }, // Nomor PKS
        { wch: 15 }, // Tanggal PKS
        { wch: 25 }, // Nomor Surat Penetapan UP
        { wch: 15 }, // Tanggal Surat Penetapan UP
        { wch: 20 }, // UP KKP Per Bulan
        { wch: 25 }, // Porsi UP KKP
        { wch: 18 }, // Bank Penerbit
        { wch: 25 }, // Jumlah KKP Diusulkan
        { wch: 12 }, // Jumlah KKP Terima
        { wch: 12 }, // Jml Kartu Opr
        { wch: 25 }, // Limit Opr
        { wch: 12 }, // Jml Kartu PD
        { wch: 25 }, // Limit PD
        { wch: 25 }, // Tanggal Cetak Tagihan
        { wch: 25 }, // Tanggal Jatuh Tempo
        { wch: 18 }, // Nilai Tagihan
        { wch: 20 }, // Nilai Transaksi
        { wch: 30 }, // Nomor SP2D GUP/PTUP
        { wch: 25 }, // Tanggal SP2D GUP/PTUP
        { wch: 50 }, // Jenis Belanja
        { wch: 30 }, // Kategori Kendala
        { wch: 40 }, // Detil Kendala
        { wch: 40 }, // Detil Masukan
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monev KKP Kanwil");

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
      const filename = `monev-kkp-kanwil-${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast.success("Data berhasil diekspor ke Excel");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Gagal mengekspor data ke Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleKirimLaporan = async () => {
    setIsSending(true);
    try {
      const triwulan = selectedPeriode.replace("Q", "");
      const response = await fetch(apiPath("/monev-kkp/kirim-laporan-kanwil"), {
        method: "POST",
        credentials: "include",
        headers: addCsrfToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ tahun: selectedYear, triwulan }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Gagal mengirim laporan");
        return;
      }

      setStatusLaporan("sent");
      setTglKirimKanwil(
        result.data?.tgkirim_kanwil || new Date().toISOString(),
      );
      toast.success("Laporan berhasil dikirim ke Direktorat PA/Kantor Pusat");
    } catch (error) {
      console.error("Error sending laporan kanwil:", error);
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monev KKP</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring dan Evaluasi Kartu Kredit Pemerintah - Kanwil
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "ringkasan-kanwil" && (
            <>
              <Button
                variant="outline"
                disabled={isExporting}
                onClick={handleExportExcel}
                className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
              >
                {isExporting ? (
                  <Spinner size="sm" className="mr-2 text-white" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                )}
                <p className="text-sm text-white">
                  {isExporting ? "Mengunduh..." : "Unduh Laporan Excel"}
                </p>
              </Button>

              <ConfirmationModal
                trigger={
                  <Button
                    disabled={
                      isLoadingStatus ||
                      isSending ||
                      statusLaporan === "sent" ||
                      !allKppnSent ||
                      !isPeriodPast()
                    }
                  >
                    {isLoadingStatus ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isLoadingStatus
                      ? "Checking Status..."
                      : isSending
                        ? "Mengirim..."
                        : statusLaporan === "sent"
                          ? "Sudah Dikirim"
                          : !isPeriodPast()
                            ? "Periode Belum Berakhir"
                            : !allKppnSent
                              ? "KPPN Belum Lengkap"
                              : "Kirim Laporan"}
                  </Button>
                }
                title="Kirim Laporan ke Direktorat PA?"
                description="Apakah Anda yakin ingin mengirim laporan ini ke Direktorat PA/Kantor Pusat? Pastikan semua data sudah benar sebelum mengirim."
                confirmText="Ya, Kirim Laporan"
                cancelText="Batal"
                variant="info"
                onConfirm={handleKirimLaporan}
                disabled={
                  isLoadingStatus ||
                  isSending ||
                  statusLaporan === "sent" ||
                  !allKppnSent ||
                  !isPeriodPast()
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Main Tabs Content */}
      <Tabs
        value={activeTab}
        className="w-full gap-3"
        onValueChange={setActiveTab}
      >
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl flex flex-wrap md:grid md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger
              value="ringkasan-kanwil"
              className="flex-1 h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              <span>Ringkasan Laporan Kanwil</span>
            </TabsTrigger>

            <TabsTrigger
              value="monitoring-kppn"
              className="flex-1 h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap"
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span>Monitoring Laporan KPPN</span>
            </TabsTrigger>

            <TabsTrigger
              value="data-transaksi"
              className="flex-1 h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              <span>Data Transaksi</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {activeTab === "ringkasan-kanwil" && (
          <TabsContent value="ringkasan-kanwil" className="space-y-4">
            <KanwilContent
              ref={kanwilContentRef}
              contentType="ringkasan"
              statusLaporan={statusLaporan}
              tglKirimKanwil={tglKirimKanwil}
              kppnCompletionStatus={allKppnSent ? "complete" : "incomplete"}
              onPeriodeChange={handlePeriodeChange}
            />
          </TabsContent>
        )}

        {activeTab === "monitoring-kppn" && (
          <TabsContent value="monitoring-kppn" className="space-y-4">
            <KanwilContent contentType="monitoring" />
          </TabsContent>
        )}

        {activeTab === "data-transaksi" && (
          <TabsContent value="data-transaksi" className="space-y-4">
            <KanwilContent contentType="transaksi" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";
