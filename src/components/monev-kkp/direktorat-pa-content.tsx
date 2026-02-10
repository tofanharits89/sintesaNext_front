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
import { Eye, Building2, MapPin } from "lucide-react";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";

// Type for the Ringkasan data (for both Kanwil and KPPN aggregation)
export interface RingkasanData {
    id: number;
    kodeKanwil?: string;
    namaKanwil?: string;
    kodeKppn?: string;
    namaKppn?: string;
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
export interface DirektoratPaContentRef {
    getData: () => RingkasanData[];
}

// Mock data for Ringkasan per Kanwil
const mockRingkasanKanwilData: RingkasanData[] = [
    {
        id: 1,
        kodeKanwil: "010",
        namaKanwil: "Kanwil DJPb Prov. DKI Jakarta",
        kodeBA: "015",
        kodeSatker: "654321",
        namaSatker: "Satker Contoh A",
        upKkpPerBulan: 150000000,
        porsiUpKkp: 35.5,
        bankPenerbit: "Bank Mandiri",
        jumlahKartu: 25,
        nilaiTagihan: 140000000,
        nilaiTransaksi: 135000000,
        kendala: "Proses pengajuan masih dalam tahap verifikasi dokumen.",
    },
    {
        id: 2,
        kodeKanwil: "020",
        namaKanwil: "Kanwil DJPb Prov. Jawa Barat",
        kodeBA: "015",
        kodeSatker: "654322",
        namaSatker: "Satker Contoh B",
        upKkpPerBulan: 200000000,
        porsiUpKkp: 42.2,
        bankPenerbit: "BNI",
        jumlahKartu: 35,
        nilaiTagihan: 190000000,
        nilaiTransaksi: 185000000,
        kendala: "",
    },
    {
        id: 3,
        kodeKanwil: "030",
        namaKanwil: "Kanwil DJPb Prov. Jawa Tengah",
        kodeBA: "020",
        kodeSatker: "789012",
        namaSatker: "Satker Contoh C",
        upKkpPerBulan: 175000000,
        porsiUpKkp: 38.0,
        bankPenerbit: "BRI",
        jumlahKartu: 28,
        nilaiTagihan: 165000000,
        nilaiTransaksi: 160000000,
        kendala: "Kendala teknis pada sistem pembayaran.",
    },
];

// Mock data for Ringkasan per KPPN
const mockRingkasanKppnData: RingkasanData[] = [
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
        kodeKppn: "002",
        namaKppn: "KPPN Jakarta II",
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
        kodeKppn: "003",
        namaKppn: "KPPN Bandung",
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

// Mock Kanwil list
const mockKanwilList = [
    { value: "all", label: "Semua Kanwil" },
    { value: "010", label: "Kanwil DJPb Prov. DKI Jakarta" },
    { value: "020", label: "Kanwil DJPb Prov. Jawa Barat" },
    { value: "030", label: "Kanwil DJPb Prov. Jawa Tengah" },
];

// Mock KPPN list
const mockKppnList = [
    { value: "all", label: "Semua KPPN" },
    { value: "001", label: "KPPN Jakarta I" },
    { value: "002", label: "KPPN Jakarta II" },
    { value: "003", label: "KPPN Bandung" },
];

// Mock data for Monitoring Kanwil
const mockMonitoringKanwilData = [
    {
        id: 1,
        kodeKanwil: "010",
        namaKanwil: "Kanwil DJPb Prov. DKI Jakarta",
        jumlahKppn: 5,
        jumlahKppnKirim: 4,
        totalSatkerUpKkp: 150,
        totalNilaiTransaksi: 5250000000,
        status: "sent",
        tanggalKirim: "2025-01-15",
        satkerData: [],
    },
    {
        id: 2,
        kodeKanwil: "020",
        namaKanwil: "Kanwil DJPb Prov. Jawa Barat",
        jumlahKppn: 8,
        jumlahKppnKirim: 8,
        totalSatkerUpKkp: 220,
        totalNilaiTransaksi: 7800000000,
        status: "sent",
        tanggalKirim: "2025-01-14",
        satkerData: [],
    },
    {
        id: 3,
        kodeKanwil: "030",
        namaKanwil: "Kanwil DJPb Prov. Jawa Tengah",
        jumlahKppn: 6,
        jumlahKppnKirim: 3,
        totalSatkerUpKkp: 180,
        totalNilaiTransaksi: 0,
        status: "not_sent",
        tanggalKirim: null,
        satkerData: [],
    },
];

// Mock data for Monitoring KPPN
const mockMonitoringKppnData = [
    {
        id: 1,
        kodeKanwil: "010",
        namaKanwil: "Kanwil DJPb Prov. DKI Jakarta",
        kodeKppn: "001",
        namaKppn: "KPPN Jakarta I",
        jumlahSatkerUpKkp: 45,
        jumlahSatkerTransaksi: 38,
        nilaiTransaksi: 1250000000,
        status: "sent",
        tanggalKirim: "2025-01-15",
        satkerData: [],
    },
    {
        id: 2,
        kodeKanwil: "010",
        namaKanwil: "Kanwil DJPb Prov. DKI Jakarta",
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
        kodeKanwil: "020",
        namaKanwil: "Kanwil DJPb Prov. Jawa Barat",
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

interface DirektoratPaContentProps {
    contentType?: "ringkasan-kanwil" | "ringkasan-kppn" | "monitoring-kanwil" | "monitoring-kppn";
}

export const DirektoratPaContent = forwardRef<DirektoratPaContentRef, DirektoratPaContentProps>(function DirektoratPaContent({ contentType = "ringkasan-kanwil" }, ref) {
    const now = new Date();
    const defaultYear = String(now.getFullYear());
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    // Expose getData method to parent component via ref
    useImperativeHandle(ref, () => ({
        getData: () => contentType === "ringkasan-kanwil" ? mockRingkasanKanwilData : mockRingkasanKppnData,
    }));

    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedKanwil, setSelectedKanwil] = useState("all");
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);

    const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
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
        setSelectedKanwil("all");
        setSelectedKppn("all");
        setSelectedPeriode(defaultPeriode);
    };

    const handleViewRingkasan = (item: any) => {
        setSelectedItem(item);
        setIsRingkasanModalOpen(true);
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

    // Filter data based on selections
    const filteredRingkasanKanwilData = selectedKanwil === "all"
        ? mockRingkasanKanwilData
        : mockRingkasanKanwilData.filter((item) => item.kodeKanwil === selectedKanwil);

    const filteredRingkasanKppnData = selectedKppn === "all"
        ? mockRingkasanKppnData
        : mockRingkasanKppnData.filter((item) => item.kodeKppn === selectedKppn);

    const filteredMonitoringKanwilData = selectedKanwil === "all"
        ? mockMonitoringKanwilData
        : mockMonitoringKanwilData.filter((item) => item.kodeKanwil === selectedKanwil);

    const filteredMonitoringKppnData = selectedKanwil === "all"
        ? mockMonitoringKppnData
        : mockMonitoringKppnData.filter((item) => item.kodeKanwil === selectedKanwil);

    // Columns for Ringkasan Laporan per Kanwil
    const ringkasanKanwilColumns = [
        {
            accessorKey: "kodeKanwil",
            header: () => <div className="text-center font-medium">Kode Kanwil</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeKanwil")}</div>
            ),
        },
        {
            accessorKey: "namaKanwil",
            header: () => <div className="text-center font-medium">Nama Kanwil</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[200px] truncate"
                    title={row.getValue("namaKanwil")}
                >
                    {row.getValue("namaKanwil")}
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

    // Columns for Ringkasan Laporan per KPPN (similar but with KPPN fields)
    const ringkasanKppnColumns = [
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

    // Columns for Monitoring Kanwil
    const monitoringKanwilColumns = [
        {
            accessorKey: "kodeKanwil",
            header: () => <div className="text-center font-medium">Kode Kanwil</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeKanwil")}</div>
            ),
        },
        {
            accessorKey: "namaKanwil",
            header: () => <div className="text-center font-medium">Nama Kanwil</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[200px] truncate"
                    title={row.getValue("namaKanwil")}
                >
                    {row.getValue("namaKanwil")}
                </div>
            ),
        },
        {
            accessorKey: "jumlahKppn",
            header: () => <div className="text-center font-medium">Jumlah KPPN</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("jumlahKppn")}</div>
            ),
        },
        {
            accessorKey: "jumlahKppnKirim",
            header: () => <div className="text-center font-medium">KPPN Sudah Kirim</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("jumlahKppnKirim")}</div>
            ),
        },
        {
            accessorKey: "totalSatkerUpKkp",
            header: () => <div className="text-center font-medium">Total Satker UP KKP</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("totalSatkerUpKkp")}</div>
            ),
        },
        {
            accessorKey: "totalNilaiTransaksi",
            header: () => <div className="text-center font-medium">Total Nilai Transaksi</div>,
            cell: ({ row }: any) => (
                <div className="text-right font-mono tabular-nums pr-2">
                    {formatRupiah(row.getValue("totalNilaiTransaksi"))}
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

    // Columns for Monitoring KPPN
    const monitoringKppnColumns = [
        {
            accessorKey: "kodeKanwil",
            header: () => <div className="text-center font-medium">Kode Kanwil</div>,
            cell: ({ row }: any) => (
                <div className="text-center">{row.getValue("kodeKanwil")}</div>
            ),
        },
        {
            accessorKey: "namaKanwil",
            header: () => <div className="text-center font-medium">Nama Kanwil</div>,
            cell: ({ row }: any) => (
                <div
                    className="text-left max-w-[180px] truncate"
                    title={row.getValue("namaKanwil")}
                >
                    {row.getValue("namaKanwil")}
                </div>
            ),
        },
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

    // Determine which columns and data to use based on contentType
    const getColumnsAndData = (): { columns: any[]; data: any[] } => {
        switch (contentType) {
            case "ringkasan-kanwil":
                return { columns: ringkasanKanwilColumns, data: filteredRingkasanKanwilData };
            case "ringkasan-kppn":
                return { columns: ringkasanKppnColumns, data: filteredRingkasanKppnData };
            case "monitoring-kanwil":
                return { columns: monitoringKanwilColumns, data: filteredMonitoringKanwilData };
            case "monitoring-kppn":
                return { columns: monitoringKppnColumns, data: filteredMonitoringKppnData };
            default:
                return { columns: ringkasanKanwilColumns, data: filteredRingkasanKanwilData };
        }
    };

    const { columns, data } = getColumnsAndData();

    // Get title based on content type
    const getTitle = () => {
        switch (contentType) {
            case "ringkasan-kanwil":
                return "Ringkasan Laporan per Kanwil";
            case "ringkasan-kppn":
                return "Ringkasan Laporan per KPPN";
            case "monitoring-kanwil":
                return "Monitoring Laporan Kanwil";
            case "monitoring-kppn":
                return "Monitoring Laporan KPPN";
            default:
                return "Ringkasan Laporan per Kanwil";
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filter Data</CardTitle>
                        <ResetButton onReset={handleReset} />
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Direktorat PA Info */}
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Direktorat Pelaksanaan Anggaran</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Menampilkan data agregat dari seluruh Kanwil dan KPPN
                        </p>
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

                        {(contentType === "ringkasan-kanwil" || contentType === "monitoring-kanwil" || contentType === "monitoring-kppn") && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kanwil</label>
                                <Select value={selectedKanwil} onValueChange={setSelectedKanwil}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockKanwilList.map((kanwil) => (
                                            <SelectItem key={kanwil.value} value={kanwil.value}>
                                                {kanwil.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {contentType === "ringkasan-kppn" && (
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
                        )}

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
                    <CardTitle>{getTitle()}</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={data} />
                </CardContent>
            </Card>

            {/* Ringkasan Modal */}
            <RingkasanLaporanModal
                open={isRingkasanModalOpen}
                onOpenChange={setIsRingkasanModalOpen}
                data={selectedItem}
                periode={selectedPeriode}
            />

            {/* Kendala Modal */}
            <LihatKendalaModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                data={selectedItem}
            />
        </div>
    );
});
