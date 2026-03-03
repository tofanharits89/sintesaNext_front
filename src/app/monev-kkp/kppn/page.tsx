"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KppnContent, KppnContentRef, KkpData } from "@/components/monev-kkp/kppn-content";
import { MonevKkpPageSkeleton } from "@/components/monev-kkp/monev-page-skeleton";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Send } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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

    // Get current triwulan
    const now = new Date();
    const defaultYear = "2026";
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const [selectedYear] = useState(defaultYear);
    const [selectedPeriode] = useState(defaultPeriode);

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

    // Fetch laporan status on mount
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

            // Prepare data for Excel export
            const excelData = data.map((row, index) => ({
                "No": index + 1,
                "Kode BA": row.kodeBA,
                "Kode Satker": row.kodeSatker,
                "Nama Satker": row.namaSatker,
                "UP KKP Per Bulan": row.upKkpPerBulan,
                "Porsi UP KKP dari Total UP (%)": row.porsiUpKkp,
                "Bank Penerbit KKP": row.bankPenerbit,
                "Jumlah Kartu": row.jumlahKartu,
                "Nilai Tagihan": row.nilaiTagihan,
                "Nilai Transaksi KKP": row.nilaiTransaksi,
                "Kendala dan Hambatan": row.kendala || "-",
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Set column widths
            worksheet["!cols"] = [
                { wch: 5 },   // No
                { wch: 10 },  // Kode BA
                { wch: 12 },  // Kode Satker
                { wch: 30 },  // Nama Satker
                { wch: 20 },  // UP KKP Per Bulan
                { wch: 25 },  // Porsi UP KKP
                { wch: 18 },  // Bank Penerbit
                { wch: 12 },  // Jumlah Kartu
                { wch: 18 },  // Nilai Tagihan
                { wch: 20 },  // Nilai Transaksi
                { wch: 40 },  // Kendala
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
            <KppnContent ref={kppnContentRef} statusLaporan={statusLaporan} />
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


