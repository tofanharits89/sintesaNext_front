"use client";

import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    MoreHorizontal,
    Download,
    Calendar,
    Building2,
    Landmark,
    FileCheck,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/httpClient";
import { useQuery } from "@tanstack/react-query";

// Types
type IkpaRequest = {
    id: number;
    kanwil: string;
    nota_dinas: string;
    kppn: string;
    satker: string;
    indikator: string;
    dokumen: string;
    status: string;
    tanggal: string;
    keterangan?: string;
    created_at?: string;
};

type IkpaApiResponse = {
    result: IkpaRequest[];
    page: number;
    limit: number;
    totalPages: number;
    totalRows: number;
};

export function IkpaLanding() {
    const [selectedYear, setSelectedYear] = useState("2025");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);

    // Fetch Data from Backend
    const { data, isLoading, isError } = useQuery<IkpaApiResponse>({
        queryKey: ['ikpa', currentPage, searchQuery],
        queryFn: async () => {
            return apiClient.get(`/ikpa?page=${currentPage}&limit=10&search=${searchQuery}`);
        },
        keepPreviousData: true
    } as any); // Type assertion needed for keepPreviousData in newer tanstack versions if not using placeholderData

    const ikpaData = data?.result || [];
    const totalRows = data?.totalRows || 0;
    const totalPages = data?.totalPages || 0;

    // Client-side filtering for status (since backend only does search text currently)
    // Ideally backend should handle status filtering too, but for now we do it here or update backend
    const filteredData = ikpaData.filter(item => {
        if (statusFilter === "all") return true;
        // Case insensitive comparison
        return item.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    // Calculate Summary Stats (from current page/fetched data - ideally should be a separate API call for accurate global stats)
    // For now we will just show stats based on the current view or mock if we want global stats
    // Let's rely on the filteredData for displayed stats or simple counts for now
    const stats = {
        total: totalRows, // Total from API
        // Estimations based on loaded data is inaccurate for paginated tables. 
        // We really need a stats API endpoint. For now, placeholders or simple counts from current page.
        approved: ikpaData.filter(d => d.status?.toLowerCase() === "disetujui").length,
        rejected: ikpaData.filter(d => d.status?.toLowerCase() === "ditolak").length,
        pending: ikpaData.filter(d => d.status?.toLowerCase() === "pending").length,
    };

    return (
        <div className="flex flex-col gap-6 p-1">
            {/* Header Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-card p-6 rounded-xl border shadow-sm">
                <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium">Periode Tahun</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium">Nama Instansi / Satker</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari satker, kanwil..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium">Kode KPPN</label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Semua KPPN" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua KPPN</SelectItem>
                            <SelectItem value="018">018 - Jakarta III</SelectItem>
                            <SelectItem value="019">019 - Bandung I</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-3 flex justify-end pb-0.5">
                    <Button variant="outline" className="w-full md:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total Permohonan (All)"
                    value={stats.total}
                    icon={FileText}
                    className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                />
                <SummaryCard
                    title="Disetujui (Page)"
                    value={stats.approved}
                    icon={CheckCircle2}
                    className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                />
                <SummaryCard
                    title="Ditolak (Page)"
                    value={stats.rejected}
                    icon={XCircle}
                    className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                />
                <SummaryCard
                    title="Pending (Page)"
                    value={stats.pending}
                    icon={Clock}
                    className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={(val) => setStatusFilter(val === "all" ? "all" : val === "disetujui" ? "Disetujui" : val === "ditolak" ? "Ditolak" : "all")}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <TabsList className="grid w-full sm:w-auto grid-cols-3">
                        <TabsTrigger value="all">Semua Data</TabsTrigger>
                        <TabsTrigger value="disetujui">Disetujui</TabsTrigger>
                        <TabsTrigger value="ditolak">Ditolak</TabsTrigger>
                    </TabsList>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-primary" />
                            Daftar Permohonan Dispensasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[200px]">Kanwil / Eselon I</TableHead>
                                        <TableHead>No. Nota Dinas</TableHead>
                                        <TableHead>KPPN / Satker</TableHead>
                                        <TableHead>Indikator</TableHead>
                                        <TableHead>Dokumen</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Memuat data...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium align-top">
                                                    <div className="flex flex-col">
                                                        <span>{item.kanwil}</span>
                                                        <span className="text-xs text-muted-foreground mt-1">ID: {item.id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium">{item.nota_dinas}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" /> {new Date(item.tanggal).toLocaleDateString("id-ID")}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Landmark className="h-3 w-3" /> {item.kppn}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Building2 className="h-3 w-3 text-muted-foreground" /> {item.satker}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <Badge variant="outline" className="font-normal">
                                                        {item.indikator}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="align-top text-sm font-mono text-muted-foreground">
                                                    {item.dokumen}
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <StatusBadge status={item.status} />
                                                </TableCell>
                                                <TableCell className="text-right align-top">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Tidak ada data yang ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4 flex items-center justify-between px-2">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {filteredData.length} dari {totalRows} data
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm">Page {currentPage + 1} of {totalPages || 1}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= totalPages - 1 || isLoading}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Breakdown Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Approved Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-emerald-700 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Rincian Permohonan Disetujui
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ikpaData.filter(i => i.status?.toLowerCase() === "disetujui").slice(0, 3).map(item => (
                                    <div key={item.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-medium">{item.satker}</p>
                                            <p className="text-xs text-muted-foreground">{item.indikator}</p>
                                        </div>
                                        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                            {item.keterangan || "Disetujui"}
                                        </span>
                                    </div>
                                ))}
                                {ikpaData.filter(i => i.status?.toLowerCase() === "disetujui").length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data disetujui</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rejected Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-rose-700 flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Rincian Permohonan Ditolak
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ikpaData.filter(i => i.status?.toLowerCase() === "ditolak").slice(0, 3).map(item => (
                                    <div key={item.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-medium">{item.satker}</p>
                                            <p className="text-xs text-muted-foreground">{item.indikator}</p>
                                        </div>
                                        <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-full">
                                            {item.keterangan || "Ditolak"}
                                        </span>
                                    </div>
                                ))}
                                {ikpaData.filter(i => i.status?.toLowerCase() === "ditolak").length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data ditolak</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </Tabs>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    icon: Icon,
    className
}: {
    title: string;
    value: number;
    icon: any;
    className?: string;
}) {
    return (
        <Card className={cn("border-l-4 shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <Icon className="h-4 w-4 opacity-70" />
                </div>
                <div className="flex items-center pt-2">
                    <div className="text-2xl font-bold">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    // Normalize status to lowercase for matching
    const s = (status || "").toLowerCase();

    let style = "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200";
    let Icon = Clock;
    let label = status;

    if (s === "disetujui") {
        style = "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200";
        Icon = CheckCircle2;
        label = "Disetujui";
    } else if (s === "ditolak") {
        style = "bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200";
        Icon = XCircle;
        label = "Ditolak";
    } else if (s === "pending") {
        style = "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200";
        Icon = Clock;
        label = "Pending";
    }

    return (
        <Badge variant="outline" className={cn("pl-1 pr-2.5 py-0.5 gap-1", style)}>
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}
