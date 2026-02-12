"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { KanwilContent, KanwilContentRef, RingkasanKanwilData } from "@/components/monev-kkp/kanwil-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, LayoutList, Building2, Send } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";

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
    const kanwilContentRef = useRef<KanwilContentRef>(null);

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

    if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
        return <GenericCardSkeleton showHeader contentLines={8} />;
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
                { wch: 12 },  // Kode KPPN
                { wch: 20 },  // Nama KPPN
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
            // TODO: Implement send report to Direktorat PA/Kantor Pusat API call
            setStatusLaporan("sent");
            toast.success("Laporan berhasil dikirim ke Direktorat PA/Kantor Pusat");
        } catch (error) {
            toast.error("Gagal mengirim laporan");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isExporting}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {isExporting ? "Mengekspor..." : "Export"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportExcel}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export ke Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPdf}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export ke PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleKirimLaporan} disabled={isSending}>
                            <Send className="mr-2 h-4 w-4" />
                            {isSending ? "Mengirim..." : "Kirim Laporan"}
                        </Button>
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
                        <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                            <KanwilContent ref={kanwilContentRef} contentType="ringkasan" statusLaporan={statusLaporan} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="monitoring-kppn" className="space-y-4">
                        <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                            <KanwilContent contentType="monitoring" />
                        </Suspense>
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
