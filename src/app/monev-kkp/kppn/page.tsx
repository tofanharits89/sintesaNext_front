"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KppnContent, KppnContentRef, KkpData } from "@/components/monev-kkp/kppn-content";
import { MonevKkpPageSkeleton } from "@/components/monev-kkp/monev-page-skeleton";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Send } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";
import { useAuth } from "@/hooks/useAuth";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

// Allowed roles for KPPN page
const ALLOWED_ROLES = ["kppn", "super_admin", "co_admin"];

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

export default function MonevKkpKppnPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [statusLaporan, setStatusLaporan] = useState<"sent" | "not_sent">("not_sent");
    const kppnContentRef = useRef<KppnContentRef>(null);

    // Get current triwulan defaults
    const now = new Date();
    const defaultYear = "2026";
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);

    // Role-based access control
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        if (!ALLOWED_ROLES.includes(user.role as string)) {
            router.push("/unauthorized?reason=monev_kkp_kppn_access_denied");
        }
    }, [user, isLoading, router]);

    // Fetch laporan status whenever year/periode changes
    useEffect(() => {
        if (!user) return;
        const fetchStatus = async () => {
            try {
                const triwulan = selectedPeriode.replace("Q", "");
                const response = await fetch(
                    apiPath(`/monev-kkp/status-laporan?tahun=${selectedYear}&triwulan=${triwulan}`),
                    { credentials: "include" }
                );
                if (!response.ok) return;
                const result = await response.json();
                if (result.data?.sts_kirim_kppn === "1") {
                    setStatusLaporan("sent");
                } else {
                    setStatusLaporan("not_sent");
                }
            } catch (error) {
                console.error("Error fetching status laporan:", error);
            }
        };
        fetchStatus();
    }, [user, selectedYear, selectedPeriode]);

    // Callback from KppnContent when filters change
    const handlePeriodeChange = (year: string, periode: string) => {
        setSelectedYear(year);
        setSelectedPeriode(periode);
    };

    if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
        return <MonevKkpPageSkeleton actionCount={3} filterCount={2} showStatusBadge />;
    }

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const data = kppnContentRef.current?.getData() || [];

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            // Convert selected periode (e.g. "Q1") to Roman numeral for the header
            const romanNumerals: Record<string, string> = { "Q1": "I", "Q2": "II", "Q3": "III", "Q4": "IV" };
            const triwulanRoman = romanNumerals[selectedPeriode] ?? selectedPeriode.replace("Q", "");

            // Title header rows
            const titleRow1 = ["LAPORAN MONITORING DAN EVALUASI PELAKSANAAN PEMBAYARAN DENGAN KKP"];
            const titleRow2 = [`TINGKAT KANWIL DJPB TRIWULAN ${triwulanRoman} TAHUN ${selectedYear}`];

            // Row 3: empty spacer, Row 4: Kanwil info from logged-in user (Nama first, then Kode)
            const emptyRow: string[] = [];
            const kanwilRow = [
                "NAMA KANWIL:", user?.nmkanwil || "-",
                "", "",
                "KODE KANWIL:", user?.kdkanwil || "-",
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
                "TOTAL TAGIHAN BANK BULAN BERJALAN (DALAM RUPIAH)", "TOTAL TAGIHAN KKP YANG DIBAYARKAN PER PERIODE TAGIHAN (DALAM RUPIAH)",
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

            const totalCols = topHeaderRow.length; // 29 columns

            // Data rows
            const dataRows = data.map((row, index) => [
                index + 1,
                row.kdkppn || "-",
                row.nmkppn || "-",
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

            // Build sheet: title1, title2, empty, kanwil, topHeader, midHeader, botHeader, data
            const aoaData = [titleRow1, titleRow2, emptyRow, kanwilRow, topHeaderRow, midHeaderRow, botHeaderRow, ...dataRows];
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
            XLSX.utils.book_append_sheet(workbook, worksheet, "Monev KKP KPPN");

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const filename = `monev-kkp-kppn-${timestamp}.xlsx`;

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

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const data = kppnContentRef.current?.getData() || [];

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            // Dynamic import for jspdf and jspdf-autotable
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            // Create PDF document (landscape for wide table)
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            // Add title
            doc.setFontSize(16);
            doc.text("Laporan Monev KKP - KPPN", 14, 15);

            doc.setFontSize(10);
            doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

            // Prepare table data
            const tableData = data.map((row, index) => [
                index + 1,
                row.kodeBA,
                row.kodeSatker,
                row.namaSatker,
                formatRupiah(row.upKkpPerBulan),
                formatPercent(row.porsiUpKkp),
                row.bankPenerbit,
                row.jumlahKartu,
                formatRupiah(row.nilaiTagihan),
                formatRupiah(row.nilaiTransaksi),
                row.kendala || "-",
            ]);

            // Create table
            autoTable(doc, {
                head: [[
                    "No",
                    "Kode BA",
                    "Kode Satker",
                    "Nama Satker",
                    "UP KKP/Bulan",
                    "Porsi UP KKP",
                    "Bank",
                    "Jml Kartu",
                    "Nilai Tagihan",
                    "Nilai Transaksi",
                    "Kendala",
                ]],
                body: tableData,
                startY: 28,
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: "center" },
                    1: { cellWidth: 15, halign: "center" },
                    2: { cellWidth: 18, halign: "center" },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 28, halign: "right" },
                    5: { cellWidth: 20, halign: "center" },
                    6: { cellWidth: 22 },
                    7: { cellWidth: 15, halign: "center" },
                    8: { cellWidth: 28, halign: "right" },
                    9: { cellWidth: 28, halign: "right" },
                    10: { cellWidth: 45 },
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
            });

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const filename = `monev-kkp-kppn-${timestamp}.pdf`;

            // Save file
            doc.save(filename);

            toast.success("Data berhasil diekspor ke PDF");
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            toast.error("Gagal mengekspor data ke PDF");
        } finally {
            setIsExporting(false);
        }
    };

    const handleKirimLaporan = async () => {
        setIsSending(true);
        try {
            const triwulan = selectedPeriode.replace("Q", "");
            const response = await fetch(
                apiPath("/monev-kkp/kirim-laporan"),
                {
                    method: "POST",
                    credentials: "include",
                    headers: addCsrfToHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ tahun: selectedYear, triwulan }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.message || "Gagal mengirim laporan");
                return;
            }

            setStatusLaporan("sent");
            toast.success("Laporan berhasil dikirim ke Kanwil");
        } catch (error) {
            console.error("Error sending laporan:", error);
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
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Monev KKP
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Kartu Kredit Pemerintah - KPPN
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Export Buttons */}
                    <Button
                        variant="outline"
                        disabled={isExporting}
                        onClick={handleExportExcel}
                        className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        disabled={isExporting}
                        onClick={handleExportPdf}
                        className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>

                    {/* Kirim Laporan Button */}
                    <ConfirmationModal
                        trigger={
                            <Button disabled={isSending || statusLaporan === "sent"}>
                                <Send className="mr-2 h-4 w-4" />
                                {isSending ? "Mengirim..." : statusLaporan === "sent" ? "Sudah Dikirim" : "Kirim Laporan"}
                            </Button>
                        }
                        title="Kirim Laporan ke Kanwil?"
                        description="Apakah Anda yakin ingin mengirim laporan ini ke Kanwil? Pastikan semua data sudah benar sebelum mengirim."
                        confirmText="Ya, Kirim Laporan"
                        cancelText="Batal"
                        variant="info"
                        onConfirm={handleKirimLaporan}
                        disabled={isSending || statusLaporan === "sent"}
                    />
                </div>
            </div>

            {/* Main Content */}
            <KppnContent ref={kppnContentRef} statusLaporan={statusLaporan} onPeriodeChange={handlePeriodeChange} />
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


