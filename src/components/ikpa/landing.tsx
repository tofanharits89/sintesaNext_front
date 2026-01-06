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
    FilePlus
} from "lucide-react";
import { ModalRekamIkpa } from "./modal-rekam";
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
import { apiClient } from "@/lib/api/httpClient";
import { useQuery } from "@tanstack/react-query";

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
    Cell
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
    const [selectedYear, setSelectedYear] = useState("2025");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedSatker, setSelectedSatker] = useState("all");
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

    // Fetch Global Stats
    const { data: statsData, isLoading: isStatsLoading } = useQuery<IkpaStats>({
        queryKey: ['ikpa-stats', selectedKppn, selectedSatker, selectedYear],
        queryFn: async () => apiClient.get(`/ikpa/stats?kdkppn=${selectedKppn === 'all' ? '' : selectedKppn}&kdsatker=${selectedSatker === 'all' ? '' : selectedSatker}&thang=${selectedYear}`)
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

    return (
        <div className="section">
            {/* Context Filters - Inline with the dashboard style */}
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-card p-3 rounded-lg border shadow-sm">
                <div className="w-32">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-48">
                    <Select value={selectedKppn} onValueChange={(val) => {
                        setSelectedKppn(val);
                        setSelectedSatker("all");
                        setSearchQuery("");
                    }}>
                        <SelectTrigger className="bg-background">
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
                <div className="w-64">
                    <Select value={selectedSatker} onValueChange={(val) => {
                        setSelectedSatker(val);
                        const satker = (satkerData as { kdsatker: string; nmsatker: string }[]).find(s => s.kdsatker === val);
                        setSearchQuery(satker ? satker.nmsatker : "");
                    }}>
                        <SelectTrigger className="bg-background">
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
                <Button variant="outline" size="icon" title="Export Excel">
                    <Download className="h-4 w-4" />
                </Button>
                <div className="ml-auto">
                    <Button onClick={() => setIsRecordModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Rekam Data
                    </Button>
                </div>
            </div>

            <ModalRekamIkpa
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
            />

            {/* Top Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Metrics */}
                <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-2 gap-4">
                    <MetricCard title="Total Permohonan" value={summary.total.toLocaleString()} icon={FileText} color="blue" />
                    <MetricCard title="Disetujui" value={summary.approved.toLocaleString()} icon={CheckCircle2} color="emerald" />
                    <MetricCard title="Ditolak" value={summary.rejected.toLocaleString()} icon={XCircle} color="rose" />
                    <MetricCard title="Pending" value={summary.pending.toLocaleString()} icon={Clock} color="amber" />
                </div>

                {/* Main Trend Chart */}
                <Card className="lg:col-span-12 xl:col-span-7">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Trend Permohonan Bulanan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={statsData?.monthlyTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Section: Table & Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Table Section */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="card-container overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                            <Tabs defaultValue="all" onValueChange={(val) => setStatusFilter(val)}>
                                <TabsList className="bg-background/50 border">
                                    <TabsTrigger value="all">Semua</TabsTrigger>
                                    <TabsTrigger value="Disetujui">Disetujui</TabsTrigger>
                                    <TabsTrigger value="Ditolak">Ditolak</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <h3 className="font-semibold text-sm">Daftar Permohonan</h3>
                        </div>
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. ND</TableHead>
                                        <TableHead>Satker / KPPN</TableHead>
                                        <TableHead>Indikator</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
                                    ) : (
                                        filteredData.length > 0 ? (
                                            filteredData.map((item: IkpaRequest) => (
                                                <TableRow key={item.id} className="hover:bg-muted transition-colors">
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
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                            <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                <span>Total {totalRows} data</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || isLoading}>Prev</Button>
                                    <span>Hal. {currentPage + 1} / {totalPages || 1}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1 || isLoading}>Next</Button>
                                </div>
                            </div>
                        </div>
                    </div>

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

function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800",
        rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800",
        amber: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800"
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-3">
                <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg border", colorMap[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}

function ShareChartCard({ title, data, horizontal = false }: { title: string; data: any[]; horizontal?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{title}</CardTitle>
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
                <div className="mt-4 space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] border-b border-muted pb-1 last:border-0">
                            <span className="truncate max-w-[180px] text-muted-foreground">{item.name}</span>
                            <span className="font-bold">{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function SmallDetailCard({ title, icon: Icon, color, data }: { title: string; icon: any; color: string; data: IkpaRequest[] }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className={cn("py-2 px-4 border-b", color === 'emerald' ? 'bg-emerald-50/30' : 'bg-rose-50/30')}>
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", color === 'emerald' ? 'text-emerald-500' : 'text-rose-500')} />
                    <span className="text-[10px] font-bold uppercase">{title}</span>
                </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
                {data.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] pb-1.5 border-b border-muted last:border-0 last:pb-0">
                        <div className="flex flex-col truncate pr-2">
                            <span className="font-semibold truncate">{item.nmsatker}</span>
                            <span className="text-muted-foreground truncate">{item.no_nd}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-normal border-muted">{item.kdkppn}</Badge>
                    </div>
                ))}
                {data.length === 0 && <p className="text-center text-muted-foreground py-4 text-[10px]">Tidak ada data</p>}
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
