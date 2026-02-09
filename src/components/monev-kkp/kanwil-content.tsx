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
import { Eye, Building2, Pencil } from "lucide-react";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { KendalaHambatanModal } from "./modals/kendala-hambatan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { useAuth } from "@/hooks/useAuth";

// Type for the Ringkasan Kanwil data
export interface RingkasanKanwilData {
    id: number;
    kodeKppn: string;
    namaKppn: string;
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
export interface KanwilContentRef {
    getData: () => RingkasanKanwilData[];
}

// Mock data for Ringkasan Kanwil
const mockRingkasanData: RingkasanKanwilData[] = [
    {
        id: 1,
        kodeKppn: "001",
        namaKppn: "KPPN Jakarta I",
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
        kodeKppn: "001",
        namaKppn: "KPPN Jakarta I",
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
        kodeKppn: "002",
        namaKppn: "KPPN Jakarta II",
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
    {
        id: 4,
        kodeKppn: "003",
        namaKppn: "KPPN Bandung",
        kodeBA: "025",
        kodeSatker: "789013",
        namaSatker: "Satker Contoh D",
        upKkpPerBulan: 60000000,
        porsiUpKkp: 30.0,
        bankPenerbit: "Bank Mandiri",
        jumlahKartu: 12,
        nilaiTagihan: 55000000,
        nilaiTransaksi: 52000000,
        kendala: "",
    },
];

// Mock data for demonstration - to be replaced with API integration
const mockKppnList = [
    { value: "all", label: "Semua KPPN" },
    { value: "001", label: "KPPN Jakarta I" },
    { value: "002", label: "KPPN Jakarta II" },
    { value: "003", label: "KPPN Bandung" },
];

const mockMonitoringData = [
    {
        id: 1,
        kodeKppn: "001",
        namaKppn: "KPPN Jakarta I",
        jumlahSatkerUpKkp: 45,
        jumlahSatkerTransaksi: 38,
        nilaiTransaksi: 1250000000,
        status: "sent",
        tanggalKirim: "2025-01-15",
        // Nested data for ringkasan modal
        satkerData: [
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
                kendala: "Proses pengajuan masih dalam tahap verifikasi.",
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
        ],
    },
    {
        id: 2,
        kodeKppn: "002",
        namaKppn: "KPPN Jakarta II",
        jumlahSatkerUpKkp: 52,
        jumlahSatkerTransaksi: 48,
        nilaiTransaksi: 1580000000,
        status: "sent",
        tanggalKirim: "2025-01-14",
        satkerData: [],
    },
    {
        id: 3,
        kodeKppn: "003",
        namaKppn: "KPPN Bandung",
        jumlahSatkerUpKkp: 35,
        jumlahSatkerTransaksi: 0,
        nilaiTransaksi: 0,
        status: "not_sent",
        tanggalKirim: null,
        satkerData: [],
    },
];

interface KanwilContentProps {
    contentType?: "ringkasan" | "monitoring";
    statusLaporan?: "sent" | "not_sent";
}

export const KanwilContent = forwardRef<KanwilContentRef, KanwilContentProps>(function KanwilContent({ contentType = "monitoring", statusLaporan = "not_sent" }, ref) {
    // Get authenticated user info
    const { user, isLoading: isAuthLoading } = useAuth();

    const now = new Date();
    const defaultYear = String(now.getFullYear());
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    // Expose getData method to parent component via ref
    useImperativeHandle(ref, () => ({
        getData: () => mockRingkasanData,
    }));

    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);

    const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
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
        setSelectedKppn("all");
        setSelectedPeriode(defaultPeriode);
    };

    const handleViewRingkasan = (item: any) => {
        setSelectedItem(item);
        setIsRingkasanModalOpen(true);
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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Filter data based on selected KPPN
    const filteredMonitoringData = selectedKppn === "all"
        ? mockMonitoringData
        : mockMonitoringData.filter((item) => item.kodeKppn === selectedKppn);

    const filteredRingkasanData = selectedKppn === "all"
        ? mockRingkasanData
        : mockRingkasanData.filter((item) => item.kodeKppn === selectedKppn);

    // Columns for Ringkasan Laporan Kanwil
    const ringkasanColumns = [
        {
            accessorKey: "kodeKppn",
            header: () => <div className="text-center font-medium">Kode KPPN</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeKppn")}</div>
            ),
        },
        {
            accessorKey: "namaKppn",
            header: () => <div className="text-center font-medium">Nama KPPN</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[150px] truncate"
                    title={row.getValue("namaKppn")}
                >
                    {row.getValue("namaKppn")}
                </div>
            ),
        },
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
            header: () => <div className="text-center font-medium">UP KKP Per Bulan (Rp)</div>,
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
            header: () => <div className="text-center font-medium">Nilai Tagihan (Rp)</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("nilaiTagihan"))}
                </div>
            ),
        },
        {
            accessorKey: "nilaiTransaksi",
            header: () => <div className="text-center font-medium">Nilai Transaksi KKP (Rp)</div>,
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

    // Columns for Monitoring KPPN
    const monitoringColumns = [
        {
            accessorKey: "kodeKppn",
            header: () => <div className="text-center font-medium">Kode KPPN</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeKppn")}</div>
            ),
        },
        {
            accessorKey: "namaKppn",
            header: () => <div className="text-center font-medium">Nama KPPN</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[200px] truncate"
                    title={row.getValue("namaKppn")}
                >
                    {row.getValue("namaKppn")}
                </div>
            ),
        },
        {
            accessorKey: "jumlahSatkerUpKkp",
            header: () => <div className="text-center font-medium">Jumlah Satker dengan UP KKP</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("jumlahSatkerUpKkp")}</div>
            ),
        },
        {
            accessorKey: "jumlahSatkerTransaksi",
            header: () => <div className="text-center font-medium">Jumlah Satker (Transaksi)</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("jumlahSatkerTransaksi")}</div>
            ),
        },
        {
            accessorKey: "nilaiTransaksi",
            header: () => <div className="text-center font-medium">Nilai Transaksi</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("nilaiTransaksi"))}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: () => <div className="text-center font-medium">Status</div>,
            cell: ({ row }: any) => {
                const status = row.getValue("status");
                return (
                    <div className="flex justify-center">
                        <Badge variant={status === "sent" ? "success" : "destructive"}>
                            {status === "sent" ? "Sudah Kirim" : "Belum Kirim"}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "tanggalKirim",
            header: () => <div className="text-center font-medium">Tanggal Kirim Laporan</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{formatDate(row.getValue("tanggalKirim"))}</div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-center font-medium">Ringkasan Laporan</div>,
            cell: ({ row }: any) => (
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                        onClick={() => handleViewRingkasan(row.original)}
                        title="Lihat Ringkasan Laporan"
                        disabled={row.original.status !== "sent"}
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
                            {contentType === "ringkasan" && (
                                <Badge
                                    variant={statusLaporan === "sent" ? "success" : "destructive"}
                                >
                                    {statusLaporan === "sent" ? "Sudah Dikirim" : "Belum Dikirim"}
                                </Badge>
                            )}
                            <ResetButton onReset={handleReset} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Kanwil Info from Auth */}
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Informasi Kanwil</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Kode Kanwil:</span>
                                <span className="font-medium">{user?.kdkanwil || "-"}</span>
                            </div>
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Nama Kanwil:</span>
                                <span className="font-medium">{user?.nmkanwil || user?.kdkanwil || "-"}</span>
                            </div>
                            <div className="flex justify-between md:flex-col md:gap-0.5">
                                <span className="text-muted-foreground">Role:</span>
                                <Badge variant="outline">{user?.role || "-"}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <label className="text-sm font-medium">KPPN</label>
                            <Select value={selectedKppn} onValueChange={setSelectedKppn}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockKppnList.map((kppn) => (
                                        <SelectItem key={kppn.value} value={kppn.value}>
                                            {kppn.label}
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
                    <CardTitle>
                        {contentType === "ringkasan" ? "Ringkasan Laporan Kanwil" : "Monitoring Laporan KPPN"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {contentType === "ringkasan" ? (
                        <DataTable columns={ringkasanColumns} data={filteredRingkasanData} />
                    ) : (
                        <DataTable columns={monitoringColumns} data={filteredMonitoringData} />
                    )}
                </CardContent>
            </Card>

            {/* Ringkasan Modal */}
            <RingkasanLaporanModal
                open={isRingkasanModalOpen}
                onOpenChange={setIsRingkasanModalOpen}
                data={selectedItem}
                periode={selectedPeriode}
            />

            {/* Kendala Modals */}
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
