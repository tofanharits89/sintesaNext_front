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
  Loader2,
  Plus,
  FilePlus,
  Edit,
  ChevronsUpDown,
  Check,
  Search,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LabelList,
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
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedKppn, setSelectedKppn] = useState("all");
  const [selectedSatker, setSelectedSatker] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IkpaRequest | null>(null);
  const [satkerComboboxOpen, setSatkerComboboxOpen] = useState(false);

  // Fetch Global Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery<IkpaStats>({
    queryKey: [
      "ikpa-stats",
      user?.id,
      user?.role,
      user?.kdkanwil,
      user?.kdkppn,
      selectedKppn,
      selectedSatker,
      selectedYear,
    ],
    queryFn: async () =>
      apiClient.get(
        `/ikpa/stats?kdkppn=${selectedKppn === "all" ? "" : selectedKppn}&kdsatker=${selectedSatker === "all" ? "" : selectedSatker}&thang=${selectedYear}`,
        {
          headers: {
            "X-Bypass-Cache": "1",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      ),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  // Memoize unique KPPN list from data
  const uniqueKppnList = useMemo(() => {
    const seen = new Set<string>();
    let scopedKppn = kppnData as {
      kdkppn: string;
      nmkppn: string;
      kdkanwil?: string | null;
    }[];

    if (user?.role === "kanwil_djpb" && user.kdkanwil) {
      scopedKppn = scopedKppn.filter((item) => item.kdkanwil === user.kdkanwil);
    } else if (user?.role === "kppn" && user.kdkppn) {
      scopedKppn = scopedKppn.filter((item) => item.kdkppn === user.kdkppn);
    }

    return scopedKppn
      .filter((item) => {
        if (seen.has(item.kdkppn)) return false;
        seen.add(item.kdkppn);
        return true;
      })
      .sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));
  }, [user]);

  // Filter satker based on selected KPPN
  const filteredSatkerList = useMemo(() => {
    const scopedSatker = filterSatkerByUserAccess(
      satkerData as {
        kdsatker: string;
        nmsatker: string;
        kdkppn: string;
        kdkanwil: string;
      }[],
      user,
    );

    if (selectedKppn === "all") {
      if (user?.role === "kanwil_djpb" || user?.role === "kppn") {
        return scopedSatker;
      }
      return scopedSatker.slice(0, 100);
    }

    return scopedSatker.filter((s) => s.kdkppn === selectedKppn);
  }, [selectedKppn, user]);

  useEffect(() => {
    if (user?.role === "kppn" && user.kdkppn && selectedKppn !== user.kdkppn) {
      setSelectedKppn(user.kdkppn);
      setSelectedSatker("all");
      setCurrentPage(0);
      return;
    }

    if (user?.role === "kanwil_djpb" && selectedKppn !== "all") {
      const hasSelectedKppn = uniqueKppnList.some(
        (item) => item.kdkppn === selectedKppn,
      );
      if (!hasSelectedKppn) {
        setSelectedKppn("all");
        setSelectedSatker("all");
        setCurrentPage(0);
      }
    }
  }, [selectedKppn, uniqueKppnList, user]);

  useEffect(() => {
    if (selectedSatker === "all") return;

    const hasSelectedSatker = filteredSatkerList.some(
      (item) => item.kdsatker === selectedSatker,
    );
    if (!hasSelectedSatker) {
      setSelectedSatker("all");
      setCurrentPage(0);
    }
  }, [filteredSatkerList, selectedSatker]);

  // Fetch Data from Backend
  const { data, isLoading } = useQuery<IkpaResponse>({
    queryKey: [
      "ikpa-data",
      currentPage,
      searchQuery,
      selectedKppn,
      selectedSatker,
      selectedYear,
    ], // Add filters to queryKey
    queryFn: async () =>
      apiClient.get(
        `/ikpa?page=${currentPage}&limit=10&search=${searchQuery}&kdkppn=${selectedKppn === "all" ? "" : selectedKppn}&kdsatker=${selectedSatker === "all" ? "" : selectedSatker}&thang=${selectedYear}`,
      ),
    keepPreviousData: true,
  } as any);

  const ikpaData = useMemo(() => {
    let rows = data?.result || [];

    // Deduplicate by ID
    const seen = new Set();
    rows = rows.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    if (!user) return [];
    if (
      user.role === "super_admin" ||
      user.role === "co_admin" ||
      user.role === "kantor_pusat" ||
      user.role === "ditpa"
    ) {
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

  const filteredData = ikpaData.filter((item: IkpaRequest) => {
    if (statusFilter === "all") return true;
    return item.approval?.toLowerCase() === statusFilter.toLowerCase();
  });

  const summary = statsData?.summary || {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  };

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
              <Select
                value={selectedKppn}
                onValueChange={(val) => {
                  setSelectedKppn(val);
                  setSelectedSatker("all");
                  setSearchQuery("");
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger
                  className="w-full"
                  disabled={user?.role === "kppn"}
                >
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
              <Popover
                open={satkerComboboxOpen}
                onOpenChange={setSatkerComboboxOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={satkerComboboxOpen}
                    className="w-full justify-between font-normal h-10 px-3"
                  >
                    <span className="truncate">
                      {selectedSatker === "all"
                        ? "Semua Satker"
                        : (() => {
                            const satker = filteredSatkerList.find(
                              (s) => s.kdsatker === selectedSatker,
                            );
                            return satker
                              ? `${satker.kdsatker} - ${satker.nmsatker}`
                              : "Pilih Satker";
                          })()}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
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
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSatker === "all"
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSatker === satker.kdsatker
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
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
              <LineChart
                data={statsData?.monthlyTrend || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={10}
                    style={{
                      fill: "var(--foreground)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
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
          <Card className="mb-6 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Permohonan</CardTitle>
                <Select value={statusFilter} onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(0);
                }}>
                  <SelectTrigger className="w-[160px] h-9 bg-background">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Disetujui">Disetujui</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="rounded-md border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <Table className="border-separate border-spacing-0">
                    <TableHeader className="bg-background sticky top-0 z-10 shadow-sm text-center">
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableHead className="bg-background text-center w-12 h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">No</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b w-96">No. ND</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">Kode KPPN</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">Nama KPPN</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">Kode Satker</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">Nama Satker</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b">Indikator</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b w-36">Status</TableHead>
                        <TableHead className="bg-background text-center h-11 font-medium text-zinc-700 dark:text-zinc-300 border-b w-24">Aksi</TableHead>
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
                                <Skeleton className="h-3.5 w-24 mx-auto" />
                                <Skeleton className="h-3 w-16 mx-auto" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-3.5 w-16 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-3.5 w-24 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-3.5 w-16 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-3.5 w-40 mx-auto" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-3.5 w-32 mx-auto" />
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
                      ) : ikpaData.length > 0 ? (
                        ikpaData.map((item: IkpaRequest, index: number) => (
                          <TableRow key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                            <TableCell className="text-center text-muted-foreground text-xs font-normal">
                              {currentPage * 10 + index + 1}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-normal text-zinc-900 dark:text-zinc-100">{item.no_nd}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(item.tg_nd).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono text-xs font-normal bg-zinc-50 dark:bg-zinc-900 uppercase">
                                {item.kdkppn}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm font-normal text-foreground whitespace-nowrap px-2">
                                {item.nmkppn}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm font-normal text-foreground">
                              {item.kdsatker}
                            </TableCell>
                            <TableCell className="text-left max-w-0 w-[35%]">
                              <div className="text-sm font-normal text-foreground truncate" title={item.nmsatker}>
                                {item.nmsatker}
                              </div>
                            </TableCell>
                            <TableCell className="text-center max-w-0 w-[20%]">
                              <div className="text-sm text-foreground font-normal truncate mx-auto" title={item.nm_indikator}>
                                {item.nm_indikator}
                              </div>
                            </TableCell>
                            <TableCell><div className="flex justify-center"><StatusBadge status={item.approval} /></div></TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
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
                        <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Rows per page
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center">
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.max(0, p - 1));
                          }}
                          className={cn(
                            "cursor-pointer select-none",
                            currentPage === 0 && "pointer-events-none opacity-50",
                          )}
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
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(i - 1);
                                  }}
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
                              <PaginationLink
                                isActive={active === 1}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(0);
                                }}
                                className="cursor-pointer select-none"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                          if (active > 3) {
                            items.push(
                              <PaginationItem key="start-ellipsis">
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          const start = Math.max(2, active - 1);
                          const end = Math.min(total - 1, active + 1);
                          for (let i = start; i <= end; i++) {
                            items.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={active === i}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(i - 1);
                                  }}
                                  className="cursor-pointer select-none"
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          if (active < total - 2) {
                            items.push(
                              <PaginationItem key="end-ellipsis">
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          items.push(
                            <PaginationItem key={total}>
                              <PaginationLink
                                isActive={active === total}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(total - 1);
                                }}
                                className="cursor-pointer select-none"
                              >
                                {total}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return items;
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.min(totalPages - 1, p + 1));
                          }}
                          className={cn(
                            "cursor-pointer select-none",
                            currentPage >= totalPages - 1 && "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap md:text-right">
                  Showing{" "}
                  {(() => {
                    const start = totalRows === 0 ? 0 : currentPage * pageSize + 1;
                    const end = Math.min((currentPage + 1) * pageSize, totalRows);
                    return `${start}-${end} of ${totalRows}`;
                  })()}{" "}
                  entries
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Detail Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SmallDetailCard
              title="Rincian Disetujui"
              icon={CheckCircle2}
              color="emerald"
              data={ikpaData
                .filter((i: IkpaRequest) => i.approval === "Disetujui")
                .slice(0, 5)}
            />
            <SmallDetailCard
              title="Rincian Ditolak"
              icon={XCircle}
              color="rose"
              data={ikpaData
                .filter((i: IkpaRequest) => i.approval === "Ditolak")
                .slice(0, 5)}
            />
          </div>
        </div>

        {/* Right Analytics Section */}
        <div className="xl:col-span-4 space-y-6">
          <ShareChartCard
            title="Share Permohonan Per KPPN"
            data={
              statsData?.sharePerKppn.map((item) => ({
                name: `${item.nmkppn} (${item.kdkppn})`,
                value: parseInt(item.count),
              })) || []
            }
          />
          <ShareChartCard
            title="Share Permohonan Per Indikator"
            data={
              statsData?.sharePerIndikator.map((item) => ({
                name: item.indikator,
                value: parseInt(item.count),
              })) || []
            }
            horizontal={true}
          />
        </div>
      </div>
    </div>
  );
}

function ShareChartCard({
  title,
  data,
  horizontal = false,
}: {
  title: string;
  data: any[];
  horizontal?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout={horizontal ? "vertical" : "horizontal"}
              data={data}
              margin={{ left: horizontal ? 20 : 0 }}
            >
              <XAxis
                type={horizontal ? "number" : "category"}
                dataKey={horizontal ? "value" : "name"}
                hide
              />
              <YAxis
                type={horizontal ? "category" : "number"}
                dataKey={horizontal ? "name" : "value"}
                hide
              />
              <RechartsTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                contentStyle={{
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              />
              <Bar
                dataKey="value"
                radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                barSize={20}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`var(--chart-${(index % 5) + 1})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 rounded-md border">
          <ScrollArea className="h-[120px]">
            <div className="p-3 space-y-1.5">
              {data.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] border-b border-muted pb-1 last:border-0"
                >
                  <span className="truncate max-w-[180px] text-muted-foreground">
                    {item.name}
                  </span>
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

function SmallDetailCard({
  title,
  icon: Icon,
  color,
  data,
}: {
  title: string;
  icon: any;
  color: string;
  data: IkpaRequest[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4",
              color === "emerald" ? "text-emerald-500" : "text-rose-500",
            )}
          />
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-xs pb-2 border-b border-muted last:border-0 last:pb-0"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="font-medium truncate">{item.nmsatker}</span>
                <span className="text-muted-foreground text-[11px] truncate">
                  {item.no_nd}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal">
                {item.kdkppn}
              </Badge>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Tidak ada data
            </p>
          )}
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
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium py-0 px-2",
        isApproved
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30"
          : isRejected
            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30"
            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30",
      )}
    >
      {status || "Pending"}
    </Badge>
  );
}
