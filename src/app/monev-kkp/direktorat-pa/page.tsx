"use client";

import { Suspense, useState, useRef } from "react";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { DirektoratPaContent, DirektoratPaContentRef, RingkasanData } from "@/components/monev-kkp/direktorat-pa-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, LayoutList, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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
    const [isExporting, setIsExporting] = useState(false);
    const direktoratPaContentRef = useRef<DirektoratPaContentRef>(null);

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const data = direktoratPaContentRef.current?.getData() || [];

            if (data.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            // Prepare data for Excel export
            const excelData = data.map((row, index) => ({
                "No": index + 1,
                "Kode Kanwil": row.kodeKanwil || "-",
                "Nama Kanwil": row.namaKanwil || "-",
                "Kode KPPN": row.kodeKppn || "-",
                "Nama KPPN": row.namaKppn || "-",
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
                { wch: 12 },  // Kode Kanwil
                { wch: 25 },  // Nama Kanwil
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

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const data = direktoratPaContentRef.current?.getData() || [];

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
            doc.text("Laporan Monev KKP - Direktorat PA", 14, 15);

            doc.setFontSize(10);
            doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

            // Prepare table data
            const tableData = data.map((row, index) => [
                index + 1,
                row.kodeKanwil || "-",
                row.namaKanwil || "-",
                row.kodeKppn || "-",
                row.namaKppn || "-",
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
                    "Kd Kanwil",
                    "Nama Kanwil",
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
                    fontSize: 5,
                    cellPadding: 1,
                },
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { cellWidth: 6, halign: "center" },
                    1: { cellWidth: 12, halign: "center" },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 12, halign: "center" },
                    4: { cellWidth: 22 },
                    5: { cellWidth: 10, halign: "center" },
                    6: { cellWidth: 14, halign: "center" },
                    7: { cellWidth: 30 },
                    8: { cellWidth: 20, halign: "right" },
                    9: { cellWidth: 12, halign: "center" },
                    10: { cellWidth: 16 },
                    11: { cellWidth: 8, halign: "center" },
                    12: { cellWidth: 20, halign: "right" },
                    13: { cellWidth: 20, halign: "right" },
                    14: { cellWidth: 35 },
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
            });

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const filename = `monev-kkp-direktorat-pa-${timestamp}.pdf`;

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

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Monev KKP
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Kartu Kredit Pemerintah - Direktorat PA
                    </p>
                </div>
            </div>

            {/* Main Tabs Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Monev KKP Direktorat PA</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="ringkasan-kanwil" className="w-full gap-3">
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
                                {/* Action Buttons for Ringkasan */}
                                <div className="flex items-center justify-end">
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
                                    </div>
                                </div>
                                <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                                    <DirektoratPaContent ref={direktoratPaContentRef} contentType="ringkasan-kanwil" />
                                </Suspense>
                            </TabsContent>

                            <TabsContent value="ringkasan-kppn" className="space-y-4">
                                {/* Action Buttons for Ringkasan */}
                                <div className="flex items-center justify-end">
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
                                    </div>
                                </div>
                                <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                                    <DirektoratPaContent ref={direktoratPaContentRef} contentType="ringkasan-kppn" />
                                </Suspense>
                            </TabsContent>

                            <TabsContent value="monitoring-kanwil" className="space-y-4">
                                <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                                    <DirektoratPaContent contentType="monitoring-kanwil" />
                                </Suspense>
                            </TabsContent>

                            <TabsContent value="monitoring-kppn" className="space-y-4">
                                <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
                                    <DirektoratPaContent contentType="monitoring-kppn" />
                                </Suspense>
                            </TabsContent>
                        </TabsContents>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
