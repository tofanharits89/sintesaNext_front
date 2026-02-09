"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { Pencil, Eye, Building2 } from "lucide-react";
import { KendalaHambatanModal } from "./modals/kendala-hambatan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { useAuth } from "@/hooks/useAuth";

// Type for the KKP data
export interface KkpData {
    id: number;
    kodeBA: string;
    kodeSatker: string;
    namaSatker: string;
    upKkpPerBulan: number;
    porsiUpKkp: number;
    bankPenerbit: string;
    jumlahKartu: number;
    nilaiTagihan: number;
    nilaiTransaksi: number;
    kendala: string;
}

// Ref interface for parent component access
export interface KppnContentRef {
    getData: () => KkpData[];
}

// Props interface
interface KppnContentProps {
    statusLaporan?: "sent" | "not_sent";
}

// Mock data for demonstration - to be replaced with API integration
const mockData: KkpData[] = [
    {
        id: 1,
        kodeBA: "015",
        kodeSatker: "654321",
        namaSatker: "Satker Contoh A",
        upKkpPerBulan: 50000000,
        porsiUpKkp: 25.5,
        bankPenerbit: "Bank Mandiri",
        jumlahKartu: 10,
        nilaiTagihan: 45000000,
        nilaiTransaksi: 42000000,
        kendala: "Proses pengajuan masih dalam tahap verifikasi dokumen.",
    },
    {
        id: 2,
        kodeBA: "015",
        kodeSatker: "654322",
        namaSatker: "Satker Contoh B",
        upKkpPerBulan: 75000000,
        porsiUpKkp: 35.2,
        bankPenerbit: "BNI",
        jumlahKartu: 15,
        nilaiTagihan: 70000000,
        nilaiTransaksi: 68500000,
        kendala: "",
    },
    {
        id: 3,
        kodeBA: "020",
        kodeSatker: "789012",
        namaSatker: "Satker Contoh C",
        upKkpPerBulan: 100000000,
        porsiUpKkp: 45.0,
        bankPenerbit: "BRI",
        jumlahKartu: 20,
        nilaiTagihan: 95000000,
        nilaiTransaksi: 92000000,
        kendala: "Kendala teknis pada sistem pembayaran.",
    },
];

export const KppnContent = forwardRef<KppnContentRef, KppnContentProps>(function KppnContent({ statusLaporan = "not_sent" }, ref) {
    // Get authenticated user info
    const { user, isLoading: isAuthLoading } = useAuth();
    const now = new Date();
    const defaultYear = String(now.getFullYear());
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    // Expose getData method to parent component via ref
    useImperativeHandle(ref, () => ({
        getData: () => mockData,
    }));

    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Generate years from current year back to 2020
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
        (currentYear - i).toString()
    );

    const periodes = [
        { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
        { value: "Q2", label: "Triwulan 2 (Apr - Jun)" },
        { value: "Q3", label: "Triwulan 3 (Jul - Sep)" },
        { value: "Q4", label: "Triwulan 4 (Okt - Des)" },
    ];

    const handleReset = () => {
        setSelectedYear(defaultYear);
        setSelectedPeriode(defaultPeriode);
    };

    const handleEditKendala = (item: any) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleViewKendala = (item: any) => {
        setSelectedItem(item);
        setIsViewModalOpen(true);
    };

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const columns = [
        {
            accessorKey: "kodeBA",
            header: () => <div className="text-center font-medium">Kode BA</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeBA")}</div>
            ),
        },
        {
            accessorKey: "kodeSatker",
            header: () => <div className="text-center font-medium">Kode Satker</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeSatker")}</div>
            ),
        },
        {
            accessorKey: "namaSatker",
            header: () => <div className="text-center font-medium">Nama Satker</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[200px] truncate"
                    title={row.getValue("namaSatker")}
                >
                    {row.getValue("namaSatker")}
                </div>
            ),
        },
        {
            accessorKey: "upKkpPerBulan",
            header: () => <div className="text-center font-medium">UP KKP Per Bulan</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("upKkpPerBulan"))}
                </div>
            ),
        },
        {
            accessorKey: "porsiUpKkp",
            header: () => <div className="text-center font-medium">Porsi UP KKP dari Total UP</div>,
            cell: ({ row }: any) => (
                <div className="text-center">
                    {formatPercent(row.getValue("porsiUpKkp"))}
                </div>
            ),
        },
        {
            accessorKey: "bankPenerbit",
            header: () => <div className="text-center font-medium">Bank Penerbit KKP</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("bankPenerbit")}</div>
            ),
        },
        {
            accessorKey: "jumlahKartu",
            header: () => <div className="text-center font-medium">Jumlah Kartu</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("jumlahKartu")}</div>
            ),
        },
        {
            accessorKey: "nilaiTagihan",
            header: () => <div className="text-center font-medium">Nilai Tagihan</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("nilaiTagihan"))}
                </div>
            ),
        },
        {
            accessorKey: "nilaiTransaksi",
            header: () => <div className="text-center font-medium">Nilai Transaksi KKP</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("nilaiTransaksi"))}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-center font-medium">Kendala dan Hambatan</div>,
            cell: ({ row }: any) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => handleEditKendala(row.original)}
                        title="Edit Kendala/Hambatan"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                        onClick={() => handleViewKendala(row.original)}
                        title="Lihat Kendala/Hambatan"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Filter Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filter Data</CardTitle>
                        <div className="flex items-center gap-4">
                            <Badge
                                variant={statusLaporan === "sent" ? "success" : "destructive"}
                            >
                                {statusLaporan === "sent" ? "Sudah Dikirim" : "Belum Dikirim"}
                            </Badge>
                            <ResetButton onReset={handleReset} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* KPPN Info from Auth */}
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Informasi KPPN</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Kode KPPN:</span>
                                <span className="font-medium">{user?.kdkppn || "-"}</span>
                            </div>
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Nama KPPN:</span>
                                <span className="font-medium">{user?.nmkppn || user?.kdkppn || "-"}</span>
                            </div>
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Role:</span>
                                <Badge variant="outline">{user?.role || "-"}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tahun</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Periode</label>
                            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {periodes.map((periode) => (
                                        <SelectItem key={periode.value} value={periode.value}>
                                            {periode.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Laporan KPPN</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={mockData} />
                </CardContent>
            </Card>

            {/* Modals */}
            <KendalaHambatanModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                data={selectedItem}
            />
            <LihatKendalaModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                data={selectedItem}
            />
        </div>
    );
});
