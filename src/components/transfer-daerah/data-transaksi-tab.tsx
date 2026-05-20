"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RekamDataTransaksiModal } from "./modals/rekam-data-transaksi-modal";
import { KertasKerjaModal } from "./modals/kertas-kerja-modal";
import tkdData from "@/data/kdkppn_tkd.json";
import { useDauTransaksi } from "@/hooks/use-dau-transaksi";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { FilePenLine, FileText, ReceiptText } from "lucide-react";

interface DataTransaksiTabProps {
  // Remove selectedYear prop as this tab will manage its own year state
  kdkanwil?: string;
  kdkppn?: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function DataTransaksiTab({ kdkanwil, kdkppn }: DataTransaksiTabProps) {
  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = MONTHS[now.getMonth()];

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth); // Default to current month
  const [selectedKppn, setSelectedKppn] = useState("");
  const [selectedKabKota, setSelectedKabKota] = useState("");
  const fallbackStageRef = useRef<"none" | "clearedMonth" | "switchedYear">("none");
  const [isRekamDataModalOpen, setIsRekamDataModalOpen] = useState(false);
  const [isKertasKerjaModalOpen, setIsKertasKerjaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Sync props to internal state
  useEffect(() => {
    if (kdkppn) {
      setSelectedKppn(kdkppn);
    } else {
      setSelectedKppn("");
    }
  }, [kdkppn]);

  // Build unique KPPN list from TKD mapping
  const uniqueKppn = useMemo(() => {
    let base = Array.from(
      new Map(
        (tkdData as Array<any>).map((d) => [
          d.kdkppn,
          { kdkppn: d.kdkppn, nmkppn: d.nmkppn, kdkanwil: d.kdkanwil },
        ])
      ).values()
    );

    if (kdkanwil) {
      base = base.filter(k => k.kdkanwil === kdkanwil);
    }

    return base.sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));
  }, [kdkanwil]);

  // Hierarchical: Kab/Kota depends on selected KPPN from TKD mapping
  const filteredKabKotaOptions = useMemo(() => {
    return selectedKppn
      ? (tkdData as Array<any>)
          .filter(
            (row) =>
              row.kdkppn === selectedKppn
          )
          .sort((a, b) => String(a.kdkabkota).localeCompare(String(b.kdkabkota)))
      : [];
  }, [selectedKppn]);

  // Clear Kab/Kota when KPPN changes
  useEffect(() => {
    if (selectedKppn !== kdkppn) {
      setSelectedKabKota("");
    }
  }, [selectedKppn, kdkppn]);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const months = MONTHS;

  const handleReset = () => {
    fallbackStageRef.current = "none";
    setSelectedYear(defaultYear);
    setSelectedMonth(defaultMonth); // Reset to default (current month)
    setSelectedKppn(kdkppn || "");
    setSelectedKabKota("");
  };

  const handleRekamData = (item: any) => {
    setSelectedItem(item);
    setIsRekamDataModalOpen(true);
  };

  const handleKertasKerja = (item: any) => {
    setSelectedItem(item);
    setIsKertasKerjaModalOpen(true);
  };

  const formatNumberId = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const columns = [
    {
      accessorKey: "no",
      header: ({ column }: any) => (
        <div className="text-center font-medium">No</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("no")}</div>
      ),
    },
    {
      accessorKey: "tahun",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tahun</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("tahun")}</div>
      ),
    },
    {
      accessorKey: "bulan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Bulan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("bulan")}</div>
      ),
    },
    {
      accessorKey: "kppn",
      header: ({ column }: any) => (
        <div className="text-center font-medium">KPPN</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[150px] truncate mx-auto"
          title={row.getValue("kppn")}
        >
          {row.getValue("kppn")}
        </div>
      ),
    },
    {
      accessorKey: "kabkota",
      header: ({ column }: any) => (
        <div className="text-center font-medium w-56 mx-auto">Kab/Kota</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center w-56 truncate mx-auto"
          title={row.getValue("kabkota")}
        >
          {row.getValue("kabkota")}
        </div>
      ),
    },
    {
      accessorKey: "alokasi",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Alokasi</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {formatNumberId(row.getValue("alokasi"))}
        </div>
      ),
    },
    {
      accessorKey: "nilaiPotongan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Nilai Potongan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {formatNumberId(row.getValue("nilaiPotongan"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            title="Rekam Data Transaksi"
            aria-label="Rekam Data Transaksi"
            onClick={() => handleRekamData(row.original)}
          >
            <FilePenLine className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            title="Kertas Kerja"
            aria-label="Kertas Kerja"
            onClick={() => handleKertasKerja(row.original)}
          >
            <FileText className="h-4 w-4 text-amber-600" />
          </Button>
        </div>
      ),
    },
  ];

  // Build query params and fetch live data
  const bulanNum = selectedMonth ? months.indexOf(selectedMonth) + 1 : undefined;
  const params = {
    thang: selectedYear,
    ...(bulanNum !== undefined ? { bulan: bulanNum } : {}),
    ...(selectedKppn ? { kppn: selectedKppn } : {}),
    ...(selectedKabKota ? { kabkota: selectedKabKota } : {}),
    kdkanwil: kdkanwil,
    kdkppn: kdkppn,
  } as const;

  
  const { rows: rawRows, isLoading, error } = useDauTransaksi(params as any);

  // Client-side filter fallback: If kdkanwil is provided, ensure we only show rows belonging to that kanwil's KPPNs.
  // This handles cases where the backend might not strictly filter by kdkanwil when kppn is empty.
  const rows = useMemo(() => {
    if (!kdkanwil || !rawRows) return rawRows || [];
    
    // Get list of KPPNs belonging to this Kanwil
    const kppnsInKanwil = new Set(
      (tkdData as any[])
        .filter((d) => d.kdkanwil === kdkanwil)
        .map((d) => d.kdkppn)
    );

    return rawRows.filter((r) => kppnsInKanwil.has(r.kppn?.split(" - ")[0] || r.kppn));
  }, [rawRows, kdkanwil]);

  const handleYearSelect = (value: string) => {
    fallbackStageRef.current = "none";
    setSelectedYear(value);
  };

  const handleMonthSelect = (value: string) => {
    fallbackStageRef.current = "none";
    setSelectedMonth(value);
  };

  const handleKppnSelect = (value: string) => {
    fallbackStageRef.current = "none";
    setSelectedKppn(value);
  };

  const handleKabKotaSelect = (value: string) => {
    fallbackStageRef.current = "none";
    setSelectedKabKota(value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Filter Data Transaksi</CardTitle>
            </div>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="transaksi-year" className="text-sm font-medium">Tahun</Label>
              <Select value={selectedYear ?? ""} onValueChange={handleYearSelect}>
                <SelectTrigger id="transaksi-year" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transaksi-month" className="text-sm font-medium">Bulan</Label>
              <Select value={selectedMonth ?? ""} onValueChange={handleMonthSelect}>
                <SelectTrigger id="transaksi-month" className="w-full">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transaksi-kppn" className="text-sm font-medium">KPPN</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Semua KPPN" },
                  ...uniqueKppn.map(kppn => ({ value: kppn.kdkppn, label: `${kppn.kdkppn} - ${kppn.nmkppn}` }))
                ]}
                value={selectedKppn ?? ""}
                onValueChange={handleKppnSelect}
                placeholder="Semua KPPN"
                searchPlaceholder="Cari KPPN..."
                emptyMessage="KPPN tidak ditemukan."
                disabled={!!kdkppn}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transaksi-kabkota" className="text-sm font-medium">Kab/Kota</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Semua Kab/Kota" },
                  ...filteredKabKotaOptions.map(lokasi => ({ value: String(lokasi.kdkabkota), label: `${lokasi.kdkabkota} - ${lokasi.nmkabkota}` }))
                ]}
                value={selectedKabKota ?? ""}
                onValueChange={handleKabKotaSelect}
                placeholder={selectedKppn ? "Semua Kab/Kota" : "Pilih KPPN dulu"}
                searchPlaceholder="Cari Kab/Kota..."
                emptyMessage="Kab/Kota tidak ditemukan."
                disabled={!selectedKppn}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Transaksi DAU</CardTitle>
            {rows && (
              <span className="text-xs text-muted-foreground">{rows.length.toLocaleString("id-ID")} baris</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive mb-3">
              {String(error.message || error)}
            </div>
          ) : null}
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <DataTable columns={columns} data={rows} />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <RekamDataTransaksiModal
        open={isRekamDataModalOpen}
        onOpenChange={setIsRekamDataModalOpen}
        data={selectedItem}
      />
      <KertasKerjaModal
        open={isKertasKerjaModalOpen}
        onOpenChange={setIsKertasKerjaModalOpen}
        data={selectedItem}
      />
    </div>
  );
}
