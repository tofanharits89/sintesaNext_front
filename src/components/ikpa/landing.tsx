"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    Plus,
    FilePlus,
    Edit,
    ChevronsUpDown,
    Check,
    Search
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api/httpClient";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResetButton } from "@/components/ui/reset-button";
import { useAuth } from "@/hooks/useAuth";
import { filterSatkerByUserAccess } from "@/utils/satker-rbac";

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
    const { user } = useAuth();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedKppn, setSelectedKppn] = useState("all");
    const [selectedSatker, setSelectedSatker] = useState("all");
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<IkpaRequest | null>(null);
    const [satkerComboboxOpen, setSatkerComboboxOpen] = useState(false);

    // Fetch Global Stats
    const { data: statsData, isLoading: isStatsLoading } = useQuery<IkpaStats>({
        queryKey: ['ikpa-stats', user?.id, user?.role, user?.kdkanwil, user?.kdkppn, selectedKppn, selectedSatker, selectedYear],
        queryFn: async () => apiClient.get(
            `/ikpa/stats?kdkppn=${selectedKppn === 'all' ? '' : selectedKppn}&kdsatker=${selectedSatker === 'all' ? '' : selectedSatker}&thang=${selectedYear}`,
            {
                headers: {
                    "X-Bypass-Cache": "1",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                },
            }
        ),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false
    });

    // Memoize unique KPPN list from data
    const uniqueKppnList = useMemo(() => {
        const seen = new Set<string>();
        let scopedKppn = (kppnData as { kdkppn: string; nmkppn: string; kdkanwil?: string | null }[]);

        if (user?.role === "kanwil_djpb" && user.kdkanwil) {
            scopedKppn = scopedKppn.filter(item => item.kdkanwil === user.kdkanwil);
        } else if (user?.role === "kppn" && user.kdkppn) {
            scopedKppn = scopedKppn.filter(item => item.kdkppn === user.kdkppn);
        }

        return scopedKppn.filter(item => {
            if (seen.has(item.kdkppn)) return false;
            seen.add(item.kdkppn);
            return true;
        }).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));
    }, [user]);

    // Filter satker based on selected KPPN
    const filteredSatkerList = useMemo(() => {
        const scopedSatker = filterSatkerByUserAccess(
            satkerData as { kdsatker: string; nmsatker: string; kdkppn: string; kdkanwil: string }[],
            user
        );

        if (selectedKppn === "all") {
            if (user?.role === "kanwil_djpb" || user?.role === "kppn") {
                return scopedSatker;
            }
            return scopedSatker.slice(0, 100);
        }

        return scopedSatker.filter(s => s.kdkppn === selectedKppn);
    }, [selectedKppn, user]);

    useEffect(() => {
        if (user?.role === "kppn" && user.kdkppn && selectedKppn !== user.kdkppn) {
            setSelectedKppn(user.kdkppn);
            setSelectedSatker("all");
            setCurrentPage(0);
            return;
        }

        if (user?.role === "kanwil_djpb" && selectedKppn !== "all") {
            const hasSelectedKppn = uniqueKppnList.some((item) => item.kdkppn === selectedKppn);
            if (!hasSelectedKppn) {
                setSelectedKppn("all");
                setSelectedSatker("all");
                setCurrentPage(0);
            }
        }
    }, [selectedKppn, uniqueKppnList, user]);

    useEffect(() => {
        if (selectedSatker === "all") return;

        const hasSelectedSatker = filteredSatkerList.some((item) => item.kdsatker === selectedSatker);
        if (!hasSelectedSatker) {
            setSelectedSatker("all");
            setCurrentPage(0);
        }
    }, [filteredSatkerList, selectedSatker]);

    // Fetch Data from Backend
    const { data, isLoading } = useQuery<IkpaResponse>({
        queryKey: ['ikpa-data', user?.id, user?.role, user?.kdkanwil, user?.kdkppn, currentPage, searchQuery, selectedKppn, selectedSatker, selectedYear, statusFilter],
        queryFn: async () => apiClient.get(
            `/ikpa?page=${currentPage}&limit=10&search=${searchQuery}&kdkppn=${selectedKppn === 'all' ? '' : selectedKppn}&kdsatker=${selectedSatker === 'all' ? '' : selectedSatker}&thang=${selectedYear}&status=${statusFilter === 'all' ? '' : statusFilter}`,
            {
                headers: {
                    "X-Bypass-Cache": "1",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                },
            }
        ),
        keepPreviousData: true
    } as any);

    const ikpaData = useMemo(() => {
        const rows = data?.result || [];

        if (!user) return [];
        if (user.role === "super_admin" || user.role === "co_admin" || user.role === "kantor_pusat" || user.role === "ditpa") {
            return rows;
        }
        if (user.role === "kanwil_djpb" && user.kdkanwil) {
            return rows.filter((item) => item.kdkanwil === user.kdkanwil);
        }
        if (user.role === "kppn" && user.kdkppn) {
            return rows.filter((item) => item.kdkppn === user.kdkppn);
        }

        return rows;
    }, [data?.result, user]);

    const totalRows = data?.totalRows || 0;
    const totalPages = data?.totalPages || 0;

    const summary = statsData?.summary || { total: 0, approved: 0, rejected: 0, pending: 0 };

    // Reset filter handler
    const handleReset = () => {
        setSelectedYear(new Date().getFullYear().toString());
        setSelectedKppn("all");
        setSelectedSatker("all");
        setSearchQuery("");
        setStatusFilter("all");
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
                                setCurrentPage(0);
                            }}>
                                <SelectTrigger className="w-full" disabled={user?.role === "kppn"}>
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
                            <Popover open={satkerComboboxOpen} onOpenChange={setSatkerComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={satkerComboboxOpen}
                                        noAnimate
                                        className="w-full justify-between font-normal h-9 px-3 bg-zinc-100 hover:bg-zinc-200 hover:text-foreground dark:bg-black dark:hover:bg-zinc-950 border-input shadow-xs"
                                    >
                                        <span className="truncate">
                                            {selectedSatker === "all"
                                                ? "Semua Satker"
                                                : (() => {
                                                    const satker = filteredSatkerList.find(s => s.kdsatker === selectedSatker);
                                                    return satker ? `${satker.kdsatker} - ${satker.nmsatker}` : "Pilih Satker";
                                                })()}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari satker..." />
                                        <CommandList>
                                            <CommandEmpty>Satker tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="Semua Satker"
                                                    onSelect={() => {
                                                        setSelectedSatker("all");
                                                        setSearchQuery("");
                                                        setSatkerComboboxOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedSatker === "all" ? "opacity-100" : "opacity-0")} />
                                                    Semua Satker
                                                </CommandItem>
                                                {filteredSatkerList.map((satker) => (
                                                    <CommandItem
                                                        key={satker.kdsatker}
                                                        value={`${satker.kdsatker} - ${satker.nmsatker}`}
                                                        onSelect={() => {
                                                            setSelectedSatker(satker.kdsatker);
                                                            setSearchQuery(satker.nmsatker);
                                                            setSatkerComboboxOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedSatker === satker.kdsatker ? "opacity-100" : "opacity-0")} />
                                                        {satker.kdsatker} - {satker.nmsatker}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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

            {/* Main Table - Full Width */}
            <Card className="mb-6">
                <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>Daftar Permohonan</CardTitle>
                        <Select value={statusFilter} onValueChange={(val) => {
                            setStatusFilter(val);
                            setCurrentPage(0);
                        }}>
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="Disetujui">Disetujui</SelectItem>
                                <SelectItem value="Ditolak">Ditolak</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center w-10">No</TableHead>
                                        <TableHead className="text-center">No. ND</TableHead>
                                        <TableHead className="text-center">Satker / KPPN</TableHead>
                                        <TableHead className="text-center">Indikator</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 10 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-center">
                                                    <Skeleton className="h-3.5 w-5 mx-auto" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <Skeleton className="h-3.5 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <Skeleton className="h-3.5 w-40" />
                                                        <Skeleton className="h-3 w-28" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-3.5 w-32" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <Skeleton className="h-5 w-16 rounded-md" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <Skeleton className="h-8 w-8 rounded-md" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        ikpaData.length > 0 ? (
                                            ikpaData.map((item: IkpaRequest, index: number) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="text-center text-muted-foreground text-sm">
                                                        {currentPage * 10 + index + 1}
                                                    </TableCell>
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
                                                    <TableCell><div className="flex justify-center"><StatusBadge status={item.approval} /></div></TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            title="Edit Permohonan"
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 border-t text-xs text-muted-foreground">
                        <span>Total {totalRows} data</span>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        className={cn("cursor-pointer select-none", (currentPage === 0 || isLoading) && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>

                                {(() => {
                                    const total = totalPages || 1;
                                    const active = currentPage + 1;
                                    const items = [];

                                    if (total <= 7) {
                                        for (let i = 1; i <= total; i++) {
                                            items.push(
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        isActive={active === i}
                                                        onClick={() => setCurrentPage(i - 1)}
                                                        className="cursor-pointer select-none"
                                                    >
                                                        {i}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                    } else {
                                        items.push(
                                            <PaginationItem key={1}>
                                                <PaginationLink isActive={active === 1} onClick={() => setCurrentPage(0)} className="cursor-pointer select-none">1</PaginationLink>
                                            </PaginationItem>
                                        );
                                        if (active > 3) items.push(<PaginationEllipsis key="left-ellipsis" />);
                                        const start = Math.max(2, active - 1);
                                        const end = Math.min(total - 1, active + 1);
                                        for (let i = start; i <= end; i++) {
                                            items.push(
                                                <PaginationItem key={i}>
                                                    <PaginationLink isActive={active === i} onClick={() => setCurrentPage(i - 1)} className="cursor-pointer select-none">{i}</PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        if (active < total - 2) items.push(<PaginationEllipsis key="right-ellipsis" />);
                                        items.push(
                                            <PaginationItem key={total}>
                                                <PaginationLink isActive={active === total} onClick={() => setCurrentPage(total - 1)} className="cursor-pointer select-none">{total}</PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    return items;
                                })()}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                        className={cn("cursor-pointer select-none", (currentPage >= totalPages - 1 || isLoading) && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Analytics Row - All 4 cards side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SmallDetailCard title="Rincian Disetujui" icon={CheckCircle2} color="emerald" data={ikpaData.filter((i: IkpaRequest) => i.approval === 'Disetujui').slice(0, 5)} />
                <SmallDetailCard title="Rincian Ditolak" icon={XCircle} color="rose" data={ikpaData.filter((i: IkpaRequest) => i.approval === 'Ditolak').slice(0, 5)} />
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
    const variant = isApproved ? "success" : isRejected ? "destructive" : "secondary";

    return (
        <Badge variant={variant}>
            {status || "Pending"}
        </Badge>
    );
}
