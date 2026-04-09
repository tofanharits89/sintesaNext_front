"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KanwilContent, KanwilContentRef, RingkasanKanwilData } from "@/components/monev-kkp/kanwil-content";
import { MonevKkpPageSkeleton } from "@/components/monev-kkp/monev-page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, LayoutList, Building2, Send } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

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
    const [statusLaporan, setStatusLaporan] = useState<"sent" | "not_sent">("not_sent");
    const [allKppnSent, setAllKppnSent] = useState(false);
    const kanwilContentRef = useRef<KanwilContentRef>(null);

    // Get current triwulan defaults
    const now2 = new Date();
    const defaultYear = "2026";
    const defaultPeriode = `Q${Math.ceil((now2.getMonth() + 1) / 3)}`;
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
            router.push("/unauthorized?reason=monev_kkp_kanwil_access_denied");
        }
    }, [user, isLoading, router]);

    // Fetch kanwil laporan status whenever year/periode changes
    useEffect(() => {
        if (!user) return;
        const fetchStatus = async () => {
            try {
                const triwulan = selectedPeriode.replace("Q", "");
                const response = await fetch(
                    apiPath(`/monev-kkp/status-laporan-kanwil?tahun=${selectedYear}&triwulan=${triwulan}`),
                    { credentials: "include" }
                );
                if (!response.ok) return;
                const result = await response.json();
                if (result.data?.sts_kirim_kanwil === "1") {
                    setStatusLaporan("sent");
                } else {
                    setStatusLaporan("not_sent");
                }
                setAllKppnSent(!!result.data?.all_kppn_sent);
            } catch (error) {
                console.error("Error fetching status laporan kanwil:", error);
            }
        };
        fetchStatus();
    }, [user, selectedYear, selectedPeriode]);

    // Callback from KanwilContent when filters change
    const handlePeriodeChange = (year: string, periode: string) => {
        setSelectedYear(year);
        setSelectedPeriode(periode);
    };

    if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
        return <MonevKkpPageSkeleton actionCount={3} tabCount={2} filterCount={3} showStatusBadge />;
    }

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const data = kanwilContentRef.current?.getData() || [];

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            // Prepare data for Excel export
            const excelData = data.map((row, index) => ({
                "No": index + 1,
                "Kode KPPN": row.kodeKppn,
                "Nama KPPN": row.namaKppn,
                "Kode BA": row.kodeBA,
                "Kode Satker": row.kodeSatker,
                "Nama Satker": row.namaSatker,
                "Nomor PKS": row.nomor_pks || "-",
                "Tanggal PKS": row.tanggal_pks ? new Date(row.tanggal_pks).toLocaleDateString("id-ID") : "-",
                "Nomor Surat Penetapan UP": row.nomor_surat_up || "-",
                "Tanggal Surat Penetapan UP": row.tanggal_surat_up ? new Date(row.tanggal_surat_up).toLocaleDateString("id-ID") : "-",
                "UP KKP Per Bulan": row.upKkpPerBulan,
                "Porsi UP KKP dari Total UP (%)": row.porsiUpKkp,
                "Bank Penerbit KKP": row.bankPenerbit,
                "Jumlah Kartu": row.jumlahKartu,
                "Tanggal Cetak Tagihan per Bulan": row.tanggal_ctk_tagihan || "-",
                "Tanggal Jatuh Tempo Pembayaran per Bulan": row.tanggal_jth_tempo || "-",
                "Nilai Tagihan": row.nilaiTagihan,
                "Nilai Transaksi KKP": row.nilaiTransaksi,
                "Nomor SP2D GUP/SP2D PTUP KKP": row.nomor_sp2d_list || "-",
                "Tanggal SP2D GUP/SP2D PTUP KKP": row.tanggal_sp2d_list || "-",
                "Jenis Transaksi Belanja yang Telah Dilakukan dengan Menggunakan KKP": row.jenis_belanja_list || "-",
                "Kategori Kendala": row.kendala || "-",
                "Detil Kendala": row.detil_kendala || "-",
                "Detil Masukan": row.detil_masukan_kendala || "-",
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);

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
                { wch: 12 },  // Jumlah Kartu
                { wch: 25 },  // Tanggal Cetak Tagihan
                { wch: 25 },   // Tanggal Jatuh Tempo
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

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const data = kanwilContentRef.current?.getData() || [];

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
            doc.text("Laporan Monev KKP - Kanwil", 14, 15);

            doc.setFontSize(10);
            doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

            // Prepare table data
            const tableData = data.map((row, index) => [
                index + 1,
                row.kodeKppn,
                row.namaKppn,
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
                    "Kd KPPN",
                    "Nama KPPN",
                    "Kd BA",
                    "Kd Satker",
                    "Nama Satker",
                    "UP KKP/Bulan",
                    "Porsi UP",
                    "Bank",
                    "Kartu",
                    "Tagihan",
                    "Transaksi",
                    "Kendala",
                ]],
                body: tableData,
                startY: 28,
                styles: {
                    fontSize: 6,
                    cellPadding: 1.5,
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { cellWidth: 7, halign: "center" },
                    1: { cellWidth: 14, halign: "center" },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 10, halign: "center" },
                    4: { cellWidth: 15, halign: "center" },
                    5: { cellWidth: 35 },
                    6: { cellWidth: 22, halign: "right" },
                    7: { cellWidth: 14, halign: "center" },
                    8: { cellWidth: 18 },
                    9: { cellWidth: 10, halign: "center" },
                    10: { cellWidth: 22, halign: "right" },
                    11: { cellWidth: 22, halign: "right" },
                    12: { cellWidth: 40 },
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
            });

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const filename = `monev-kkp-kanwil-${timestamp}.pdf`;

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
                apiPath("/monev-kkp/kirim-laporan-kanwil"),
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
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Monev KKP
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Kartu Kredit Pemerintah - Kanwil
                    </p>
                </div>
                {activeTab === "ringkasan-kanwil" && (
                    <div className="flex items-center gap-2">
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
                        <ConfirmationModal
                            trigger={
                                <Button disabled={isSending || statusLaporan === "sent" || !allKppnSent}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {isSending ? "Mengirim..." : statusLaporan === "sent" ? "Sudah Dikirim" : !allKppnSent ? "KPPN Belum Lengkap" : "Kirim Laporan"}
                                </Button>
                            }
                            title="Kirim Laporan ke Direktorat PA?"
                            description="Apakah Anda yakin ingin mengirim laporan ini ke Direktorat PA/Kantor Pusat? Pastikan semua data sudah benar sebelum mengirim."
                            confirmText="Ya, Kirim Laporan"
                            cancelText="Batal"
                            variant="info"
                            onConfirm={handleKirimLaporan}
                            disabled={isSending || statusLaporan === "sent" || !allKppnSent}
                        />
                    </div>
                )}
            </div>

            {/* Main Tabs Content */}
            <Tabs
                value={activeTab}
                className="w-full gap-3"
                onValueChange={setActiveTab}
            >
                <div className="border-b border-border/50 pb-3 mb-0">
                    <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-0">
                        <TabsTrigger value="ringkasan-kanwil" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <LayoutList className="h-4 w-4 mr-2" />
                            <span>Ringkasan Laporan Kanwil</span>
                        </TabsTrigger>

                        <TabsTrigger value="monitoring-kppn" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                            <Building2 className="h-4 w-4 mr-2" />
                            <span>Monitoring Laporan KPPN</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContents>
                    <TabsContent value="ringkasan-kanwil" className="space-y-4">
                        <KanwilContent ref={kanwilContentRef} contentType="ringkasan" statusLaporan={statusLaporan} kppnCompletionStatus={allKppnSent ? "complete" : "incomplete"} onPeriodeChange={handlePeriodeChange} />
                    </TabsContent>

                    <TabsContent value="monitoring-kppn" className="space-y-4">
                        <KanwilContent contentType="monitoring" onPeriodeChange={handlePeriodeChange} />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

