"use client";

import React, { useState, useEffect, useMemo } from "react";
import satkerData from "@/data/carisatker.json";
import kppnData from "@/data/kdkppn.json";
import {
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
    Loader2,
    Plus,
    FilePlus,
    Edit
} from "lucide-react";
import { ModalRekamIkpa } from "./modal-rekam";
import { ModalEditIkpa } from "./modal-edit";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/api/httpClient";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResetButton } from "@/components/ui/reset-button";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    LabelList
} from "recharts";

// Types
type IkpaRequest = {
    id: number;
    kdkanwil: string;
    nmkanwil: string;
    no_nd: string;
    tg_nd: string;
    kdkppn: string;
    nmkppn: string;
    kdsatker: string;
    nmsatker: string;
    nm_indikator: string;
    no_doc: string;
    approval: string;
    id_approval: string;
    keterangan?: string;
    alasan_penolakan?: string;
    kronologis?: string;
    perbaikan?: string;
    thang: string;
    date_input: string;
};

type IkpaStats = {
    summary: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    };
    sharePerKppn: { kdkppn: string; nmkppn: string; count: string }[];
    sharePerIndikator: { indikator: string; count: string }[];
    monthlyTrend: { name: string; count: number }[];
};

type IkpaResponse = {
    result: IkpaRequest[];
    page: number;
    limit: number;
    totalPages: number;
    totalRows: number;
};

export function IkpaLanding() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedSatker, setSelectedSatker] = useState("all");
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<IkpaRequest | null>(null);

    // Fetch Global Stats
    const { data: statsData, isLoading: isStatsLoading } = useQuery<IkpaStats>({
        queryKey: ['ikpa-stats', selectedKppn, selectedSatker, selectedYear],
        queryFn: async () => apiClient.get(`/ikpa/stats?kdkppn=${selectedKppn === 'all' ? '' : selectedKppn}&kdsatker=${selectedSatker === 'all' ? '' : selectedSatker}&thang=${selectedYear}`),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false
    });

    // Memoize unique KPPN list from data
    const uniqueKppnList = useMemo(() => {
        const seen = new Set<string>();
        return (kppnData as { kdkppn: string; nmkppn: string }[]).filter(item => {
            if (seen.has(item.kdkppn)) return false;
            seen.add(item.kdkppn);
            return true;
        }).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));
    }, []);

    // Filter satker based on selected KPPN
    const filteredSatkerList = useMemo(() => {
        if (selectedKppn === "all") {
            return (satkerData as { kdsatker: string; nmsatker: string; kdkppn: string }[]).slice(0, 100);
        }
        return (satkerData as { kdsatker: string; nmsatker: string; kdkppn: string }[])
            .filter(s => s.kdkppn === selectedKppn);
    }, [selectedKppn]);

    // Fetch Data from Backend
    const { data, isLoading } = useQuery<IkpaResponse>({
        queryKey: ['ikpa-data', currentPage, searchQuery, selectedKppn, selectedSatker, selectedYear], // Add filters to queryKey
        queryFn: async () => apiClient.get(`/ikpa?page=${currentPage}&limit=10&search=${searchQuery}&kdkppn=${selectedKppn === 'all' ? '' : selectedKppn}&kdsatker=${selectedSatker === 'all' ? '' : selectedSatker}&thang=${selectedYear}`),
        keepPreviousData: true
    } as any);

    const ikpaData = data?.result || [];
    const totalRows = data?.totalRows || 0;
    const totalPages = data?.totalPages || 0;

    const filteredData = ikpaData.filter((item: IkpaRequest) => {
        if (statusFilter === "all") return true;
        return item.approval?.toLowerCase() === statusFilter.toLowerCase();
    });

    const summary = statsData?.summary || { total: 0, approved: 0, rejected: 0, pending: 0 };

    // Reset filter handler
    const handleReset = () => {
        setSelectedYear(new Date().getFullYear().toString());
        setSelectedKppn("all");
        setSelectedSatker("all");
        setSearchQuery("");
        setCurrentPage(0);
    };

    return (
        <div className="section">
            {/* Context Filters - Inline with the dashboard style */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filter Data</CardTitle>
                        <ResetButton onReset={handleReset} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pilih Tahun</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2026">2026</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2023">2023</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pilih KPPN</label>
                            <Select value={selectedKppn} onValueChange={(val) => {
                                setSelectedKppn(val);
                                setSelectedSatker("all");
                                setSearchQuery("");
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Semua KPPN" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="all">Semua KPPN</SelectItem>
                                    {uniqueKppnList.map((kppn) => (
                                        <SelectItem key={kppn.kdkppn} value={kppn.kdkppn}>
                                            {kppn.kdkppn} - {kppn.nmkppn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pilih Satker</label>
                            <Select value={selectedSatker} onValueChange={(val) => {
                                setSelectedSatker(val);
                                const satker = (satkerData as { kdsatker: string; nmsatker: string }[]).find(s => s.kdsatker === val);
                                setSearchQuery(satker ? satker.nmsatker : "");
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Satker" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="all">Semua Satker</SelectItem>
                                    {filteredSatkerList.map((satker) => (
                                        <SelectItem key={satker.kdsatker} value={satker.kdsatker}>
                                            {satker.kdsatker} - {satker.nmsatker}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ModalRekamIkpa
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
            />

            <ModalEditIkpa
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                }}
                data={editingItem}
            />

            {/* Top Dashboard Grid */}
            <div className="space-y-6 mb-8">
                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Permohonan"
                        icon={<FileText className="h-4 w-4 text-blue-500" />}
                        value={summary.total.toLocaleString()}
                    />
                    <StatCard
                        label="Disetujui"
                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        value={summary.approved.toLocaleString()}
                    />
                    <StatCard
                        label="Ditolak"
                        icon={<XCircle className="h-4 w-4 text-rose-500" />}
                        value={summary.rejected.toLocaleString()}
                    />
                    <StatCard
                        label="Pending"
                        icon={<Clock className="h-4 w-4 text-amber-500" />}
                        value={summary.pending.toLocaleString()}
                    />
                </div>

                {/* Main Trend Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Trend Permohonan Bulanan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={statsData?.monthlyTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} padding={{ left: 20, right: 20 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} activeDot={{ r: 6 }}>
                                    <LabelList dataKey="count" position="top" offset={10} style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }} />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Section: Table & Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Table Section */}
                <div className="xl:col-span-8 space-y-6">
                    <Card>
                        <CardHeader className="pb-2 border-b">
                            <div className="flex items-center justify-between">
                                <Tabs defaultValue="all" onValueChange={(val) => setStatusFilter(val)}>
                                    <TabsList className="bg-background/50 border">
                                        <TabsTrigger value="all">Semua</TabsTrigger>
                                        <TabsTrigger value="Disetujui">Disetujui</TabsTrigger>
                                        <TabsTrigger value="Ditolak">Ditolak</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <h3 className="font-semibold text-sm">Daftar Permohonan</h3>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6">
                            <div className="rounded-md border">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">No. ND</TableHead>
                                                <TableHead className="text-center">Satker / KPPN</TableHead>
                                                <TableHead className="text-center">Indikator</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
                                            ) : (
                                                filteredData.length > 0 ? (
                                                    filteredData.map((item: IkpaRequest) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{item.no_nd}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{new Date(item.tg_nd).toLocaleDateString()}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">{item.nmsatker}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase">{item.nmkppn?.toLowerCase()} ({item.kdkppn})</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{item.nm_indikator}</TableCell>
                                                            <TableCell><StatusBadge status={item.approval} /></TableCell>
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                    onClick={() => {
                                                                        setEditingItem(item);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                <span>Total {totalRows} data</span>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                                className={currentPage === 0 || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <span className="text-xs">Hal. {currentPage + 1} / {totalPages || 1}</span>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                className={currentPage >= totalPages - 1 || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Detail Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SmallDetailCard title="Rincian Disetujui" icon={CheckCircle2} color="emerald" data={ikpaData.filter((i: IkpaRequest) => i.approval === 'Disetujui').slice(0, 5)} />
                        <SmallDetailCard title="Rincian Ditolak" icon={XCircle} color="rose" data={ikpaData.filter((i: IkpaRequest) => i.approval === 'Ditolak').slice(0, 5)} />
                    </div>
                </div>

                {/* Right Analytics Section */}
                <div className="xl:col-span-4 space-y-6">
                    <ShareChartCard
                        title="Share Permohonan Per KPPN"
                        data={statsData?.sharePerKppn.map(item => ({
                            name: `${item.nmkppn} (${item.kdkppn})`,
                            value: parseInt(item.count)
                        })) || []}
                    />
                    <ShareChartCard
                        title="Share Permohonan Per Indikator"
                        data={statsData?.sharePerIndikator.map(item => ({ name: item.indikator, value: parseInt(item.count) })) || []}
                        horizontal={true}
                    />
                </div>
            </div>
        </div>
    );
}

function ShareChartCard({ title, data, horizontal = false }: { title: string; data: any[]; horizontal?: boolean }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout={horizontal ? "vertical" : "horizontal"} data={data} margin={{ left: horizontal ? 20 : 0 }}>
                            <XAxis type={horizontal ? "number" : "category"} dataKey={horizontal ? "value" : "name"} hide />
                            <YAxis type={horizontal ? "category" : "number"} dataKey={horizontal ? "name" : "value"} hide />
                            <RechartsTooltip cursor={{ fill: 'var(--muted)', opacity: 0.3 }} contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }} />
                            <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={20}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 rounded-md border">
                    <ScrollArea className="h-[120px]">
                        <div className="p-3 space-y-1.5">
                            {data.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px] border-b border-muted pb-1 last:border-0">
                                    <span className="truncate max-w-[180px] text-muted-foreground">{item.name}</span>
                                    <span className="font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

function SmallDetailCard({ title, icon: Icon, color, data }: { title: string; icon: any; color: string; data: IkpaRequest[] }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", color === 'emerald' ? 'text-emerald-500' : 'text-rose-500')} />
                    <CardTitle className="text-sm">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-muted last:border-0 last:pb-0">
                            <div className="flex flex-col truncate pr-2">
                                <span className="font-medium truncate">{item.nmsatker}</span>
                                <span className="text-muted-foreground text-[11px] truncate">{item.no_nd}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-normal">{item.kdkppn}</Badge>
                        </div>
                    ))}
                    {data.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">Tidak ada data</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = (status || "").toLowerCase();
    const isApproved = s === "disetujui";
    const isRejected = s === "ditolak";

    return (
        <Badge variant="outline" className={cn(
            "text-[10px] font-medium py-0 px-2",
            isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30" :
                isRejected ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30" :
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30"
        )}>
            {status || "Pending"}
        </Badge>
    );
}
