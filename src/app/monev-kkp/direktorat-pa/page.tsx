"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DirektoratPaContent, DirektoratPaContentRef, RingkasanData } from "@/components/monev-kkp/direktorat-pa-content";
import { MonevKkpPageSkeleton } from "@/components/monev-kkp/monev-page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, LayoutList, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

// Allowed roles for Direktorat PA page
const ALLOWED_ROLES = ["ditpa", "super_admin", "co_admin"];

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

export default function MonevKkpDirektoratPaPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("ringkasan-kanwil");
    const [isExporting, setIsExporting] = useState(false);
    const kanwilDataRef = useRef<DirektoratPaContentRef>(null);
    const kppnDataRef = useRef<DirektoratPaContentRef>(null);

    // Role-based access control
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        if (!ALLOWED_ROLES.includes(user.role as string)) {
            router.push("/unauthorized?reason=monev_kkp_direktorat_pa_access_denied");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
        return <MonevKkpPageSkeleton actionCount={2} tabCount={4} filterCount={3} />;
    }

    const handleExportExcel = async () => {
        setIsExporting(true);

        // Give time for the spinner to render
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const currentRef = activeTab === "ringkasan-kanwil" ? kanwilDataRef : kppnDataRef;
            const data = currentRef.current?.getData() || [];
            const filters = currentRef.current?.getFilters();

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            const selectedYear = filters?.selectedYear || "2026";
            const selectedPeriode = filters?.selectedPeriode || "Q1";
            const kanwilLabel = filters?.kanwilLabel || "Semua Kanwil";
            const kppnLabel = filters?.kppnLabel || "Semua KPPN";

            // Convert selected periode (e.g. "Q1") to Roman numeral for the header
            const romanNumerals: Record<string, string> = { "Q1": "I", "Q2": "II", "Q3": "III", "Q4": "IV" };
            const triwulanRoman = romanNumerals[selectedPeriode] ?? selectedPeriode.replace("Q", "");

            // Title header rows
            const titleRow1 = ["LAPORAN MONITORING DAN EVALUASI PELAKSANAAN PEMBAYARAN DENGAN KKP"];
            const titleRow2 = [`TINGKAT DIREKTORAT PA TRIWULAN ${triwulanRoman} TAHUN ${selectedYear}`];

            // Row 3: empty spacer, Row 4: Filter info
            const emptyRow: string[] = [];
            const filterRow = [
                "KANWIL:", kanwilLabel,
                "", "",
                "KPPN:", kppnLabel,
            ];

            // Three-level header structure (Matching KPPN format)
            const group1Start = 8;
            const group1End = 11;
            const group2Start = 12;
            const group2End = 14;
            const group3Start = 15;
            const group3End = 18;
            const group4Start = 19;
            const group4End = 25;

            const topHeaderRow = [
                "NO", "KODE KPPN", "NAMA KPPN", "KODE BA", "KODE SATKER", "NAMA SATKER",
                "NOMOR PKS", "TANGGAL PKS",
                // Group 1: cols 8–11
                "SURAT PERSETUJUAN/PERUBAHAN PERSETUJUAN BESARAN UP KKP", "", "", "",
                // Group 2: cols 12–14
                "STATUS KKP", "", "",
                // Group 3: cols 15-18
                "JUMLAH DAN TOTAL LIMIT KKP YANG DISETUJUI BANK", "", "", "",
                // Group 4: cols 19-25
                "RINGKASAN BELANJA DAN PEMBAYARAN", "", "", "", "", "", "",
                // Non-grouped rest: cols 26–28
                "KATEGORI KENDALA", "DETIL KENDALA", "DETIL MASUKAN",
            ];

            const midHeaderRow = [
                "", "", "", "", "", "", "", "",
                // Group 1 child labels
                "NOMOR SURAT PENETAPAN UP", "TANGGAL SURAT PENETAPAN UP",
                "UP KKP PER BULAN", "PORSI UP KKP DARI TOTAL UP (%)",
                // Group 2 child labels
                "BANK PENERBIT KKP", "JUMLAH KKP YANG DIUSULKAN KE BANK PENERBIT KKP",
                "JUMLAH KKP YANG SUDAH DITERIMA",
                // Group 3 mid labels
                "KKP UNTUK KEPERLUAN BELANJA OPERASIONAL DAN BELANJA MODAL", "",
                "KKP UNTUK KEPERLUAN BELANJA PERJALANAN DINAS JABATAN", "",
                // Group 4 child labels
                "TANGGAL CETAK TAGIHAN PER BULAN", "TANGGAL JATUH TEMPO PEMBAYARAN PER BULAN",
                "TOTAL TAGIHAN BANK (DALAM RUPIAH)", "TOTAL TAGIHAN KKP YANG DIBAYARKAN (DALAM RUPIAH)",
                "NOMOR SP2D GUP/SP2D PTUP KKP", "TANGGAL SP2D GUP/SP2D PTUP KKP",
                "JENIS TRANSAKSI BELANJA YANG TELAH DILAKUKAN DENGAN MENGGUNAKAN KKP",
                // Non-grouped rest
                "", "", "",
            ];

            const botHeaderRow = [
                "", "", "", "", "", "", "", "",
                // Group 1
                "", "", "", "",
                // Group 2
                "", "", "",
                // Group 3 bot labels
                "JUMLAH KARTU", "TOTAL LIMIT (DALAM RUPIAH)",
                "JUMLAH KARTU", "TOTAL LIMIT (DALAM RUPIAH)",
                // Group 4
                "", "", "", "", "", "", "",
                // Non-grouped rest
                "", "", "",
            ];

            const totalCols = topHeaderRow.length;

            // Data rows
            const dataRows = data.map((row, index) => [
                index + 1,
                row.kodeKppn || "-",
                row.namaKppn || "-",
                row.kodeBA,
                row.kodeSatker,
                row.namaSatker,
                row.nomor_pks || "-",
                row.tanggal_pks ? new Date(row.tanggal_pks).toLocaleDateString("id-ID") : "-",
                row.nomor_surat_up || "-",
                row.tanggal_surat_up ? new Date(row.tanggal_surat_up).toLocaleDateString("id-ID") : "-",
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

            // Build sheet: title1, title2, empty, info, topHeader, midHeader, botHeader, data
            const aoaData = [titleRow1, titleRow2, emptyRow, filterRow, topHeaderRow, midHeaderRow, botHeaderRow, ...dataRows];
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
            for (let c = 0; c < group1Start; c++) merges.push({ s: { r: 4, c }, e: { r: 6, c } });
            for (let c = group4End + 1; c < totalCols; c++) merges.push({ s: { r: 4, c }, e: { r: 6, c } });

            // Vertical merges for group 1 & 2 & 4 children (r5 to r6)
            for (let c = group1Start; c <= group2End; c++) merges.push({ s: { r: 5, c }, e: { r: 6, c } });
            for (let c = group4Start; c <= group4End; c++) merges.push({ s: { r: 5, c }, e: { r: 6, c } });

            worksheet["!merges"] = merges;

            // --- Styling ---
            const boldStyle = { font: { bold: true } };
            const borderStyle = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            };

            // Title rows (r=0, r=1): bold and center
            for (const r of [0, 1]) {
                const addr = XLSX.utils.encode_cell({ r, c: 0 });
                if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };
                worksheet[addr].s = {
                    font: { bold: true, size: 14 },
                    alignment: { horizontal: "left" }
                };
            }

            // Filter row (r=3): bold labels
            for (const c of [0, 1, 4, 5]) {
                const addr = XLSX.utils.encode_cell({ r: 3, c });
                if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };
                worksheet[addr].s = boldStyle;
            }

            // Apply styling to table area (headers starting at r=4 and data)
            const accountingCols = new Set([10, 16, 18, 21, 22]);
            const centeredCols = new Set([0, 1, 3, 4, 11, 13, 14, 15, 17]);
            for (let r = 4; r < aoaData.length; r++) {
                for (let c = 0; c < totalCols; c++) {
                    const addr = XLSX.utils.encode_cell({ r, c });
                    if (!worksheet[addr]) worksheet[addr] = { v: "", t: "s" };

                    const isHeader = r <= 6;

                    if (!isHeader && accountingCols.has(c) && typeof worksheet[addr].v === "number") {
                        worksheet[addr].z = '#,##0';
                    }

                    worksheet[addr].s = {
                        ...(worksheet[addr].s || {}),
                        border: borderStyle,
                        font: {
                            ...(worksheet[addr].s?.font || {}),
                            bold: isHeader
                        },
                        alignment: {
                            horizontal: isHeader ? "center" : (centeredCols.has(c) ? "center" : (accountingCols.has(c) ? "right" : "left")),
                            vertical: isHeader ? "center" : "bottom",
                            wrapText: isHeader
                        }
                    };
                }
            }

            // Set column widths
            worksheet["!cols"] = [
                { wch: 5 },   // No
                { wch: 12 },  // Kode KPPN
                { wch: 20 },  // Nama KPPN
                { wch: 10 },  // Kode BA
                { wch: 12 },  // Kode Satker
                { wch: 30 },  // Nama Satker
                { wch: 25 },  // Nomor PKS
                { wch: 15 },  // Tanggal PKS
                { wch: 25 },  // Nomor Surat Penetapan UP
                { wch: 15 },  // Tanggal Surat Penetapan UP
                { wch: 20 },  // UP KKP Per Bulan
                { wch: 25 },  // Porsi UP KKP
                { wch: 18 },  // Bank Penerbit
                { wch: 25 },  // Jumlah KKP Diusulkan
                { wch: 12 },  // Jumlah KKP Terima
                { wch: 12 },  // Jml Kartu Opr
                { wch: 25 },  // Limit Opr
                { wch: 12 },  // Jml Kartu PD
                { wch: 25 },  // Limit PD
                { wch: 25 },  // Tanggal Cetak Tagihan
                { wch: 25 },  // Tanggal Jatuh Tempo
                { wch: 18 },  // Nilai Tagihan
                { wch: 20 },  // Nilai Transaksi
                { wch: 30 },  // Nomor SP2D GUP/PTUP
                { wch: 25 },  // Tanggal SP2D GUP/PTUP
                { wch: 50 },  // Jenis Belanja
                { wch: 30 },  // Kategori Kendala
                { wch: 40 },  // Detil Kendala
                { wch: 40 },  // Detil Masukan
            ];

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Monev KKP Direktorat PA");

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const filename = `monev-kkp-direktorat-pa-${timestamp}.xlsx`;

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Monev KKP
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Kartu Kredit Pemerintah - Direktorat PA
                    </p>
                </div>
                {(activeTab === "ringkasan-kanwil" || activeTab === "ringkasan-kppn") && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            disabled={isExporting}
                            onClick={handleExportExcel}
                            className="bg-white dark:bg-card hover:bg-zinc-200 flex items-center gap-2 w-60 h-12 rounded-xl border-2 border-green-600 dark:border-green-300"
                        >
                            {isExporting ? (
                                <Spinner size="sm" className="mr-2 text-green-600 dark:text-green-300" />
                            ) : (
                                <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-300" />
                            )}
                            <p className="text-sm font-semibold text-green-600 dark:text-green-300">
                                {isExporting ? "Mengunduh..." : "Unduh Laporan Excel"}
                            </p>
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Tabs Content */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full gap-3"
            >
                <div className="border-b border-border/50 pb-3 mb-0">
                    <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-0">
                        <TabsTrigger value="ringkasan-kanwil" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <LayoutList className="h-4 w-4 mr-2" />
                            <span>Ringkasan Laporan per Kanwil</span>
                        </TabsTrigger>

                        <TabsTrigger value="ringkasan-kppn" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <LayoutList className="h-4 w-4 mr-2" />
                            <span>Ringkasan Laporan per KPPN</span>
                        </TabsTrigger>

                        <TabsTrigger value="monitoring-kanwil" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>Monitoring Laporan Kanwil</span>
                        </TabsTrigger>

                        <TabsTrigger value="monitoring-kppn" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <Building2 className="h-4 w-4 mr-2" />
                            <span>Monitoring Laporan KPPN</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContents>
                    <TabsContent value="ringkasan-kanwil" className="space-y-4">
                        <DirektoratPaContent ref={kanwilDataRef} contentType="ringkasan-kanwil" />
                    </TabsContent>

                    <TabsContent value="ringkasan-kppn" className="space-y-4">
                        <DirektoratPaContent ref={kppnDataRef} contentType="ringkasan-kppn" />
                    </TabsContent>

                    <TabsContent value="monitoring-kanwil" className="space-y-4">
                        <DirektoratPaContent contentType="monitoring-kanwil" />
                    </TabsContent>

                    <TabsContent value="monitoring-kppn" className="space-y-4">
                        <DirektoratPaContent contentType="monitoring-kppn" />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

