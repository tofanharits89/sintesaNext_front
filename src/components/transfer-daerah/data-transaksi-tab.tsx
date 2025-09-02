"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { RekamDataTransaksiModal } from "./modals/rekam-data-transaksi-modal";
import { KertasKerjaModal } from "./modals/kertas-kerja-modal";
import tkdData from "@/data/kdkppn_tkd.json";
import { useDauTransaksi } from "@/hooks/use-dau-transaksi";
import { FilePenLine, FileText } from "lucide-react";

interface DataTransaksiTabProps {
  // Remove selectedYear prop as this tab will manage its own year state
}

// Live data now fetched via useDauTransaksi

export function DataTransaksiTab({}: DataTransaksiTabProps) {
  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonthName = [
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
  ][now.getMonth()];

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthName);
  const [selectedKppn, setSelectedKppn] = useState("");
  const [selectedKabKota, setSelectedKabKota] = useState("");
  const [isRekamDataModalOpen, setIsRekamDataModalOpen] = useState(false);
  const [isKertasKerjaModalOpen, setIsKertasKerjaModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Build unique KPPN list from TKD mapping
  const uniqueKppn = Array.from(
    new Map(
      (tkdData as Array<any>).map((d) => [
        d.kdkppn,
        { kdkppn: d.kdkppn, nmkppn: d.nmkppn },
      ])
    ).values()
  ).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn));

  // Hierarchical: Kab/Kota depends on selected KPPN from TKD mapping
  const filteredKabKotaOptions = selectedKppn
    ? (tkdData as Array<any>)
        .filter(
          (row) =>
            row.kdkppn === selectedKppn
        )
        .sort((a, b) => String(a.kdkabkota).localeCompare(String(b.kdkabkota)))
    : [];

  // Clear Kab/Kota when KPPN changes
  useEffect(() => {
    setSelectedKabKota("");
  }, [selectedKppn]);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const months = [
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

  const handleReset = () => {
    setSelectedYear(defaultYear);
    setSelectedMonth(defaultMonthName);
    setSelectedKppn("");
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
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            title="Rekam Data Transaksi"
            aria-label="Rekam Data Transaksi"
            onClick={() => handleRekamData(row.original)}
          >
            <FilePenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
            title="Kertas Kerja"
            aria-label="Kertas Kerja"
            onClick={() => handleKertasKerja(row.original)}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Build query params and fetch live data
  const bulanNum = selectedMonth ? months.indexOf(selectedMonth) + 1 : undefined;
  const { rows, isLoading, error } = useDauTransaksi({
    thang: selectedYear,
    bulan: bulanNum,
    kppn: selectedKppn || undefined,
    kabkota: selectedKabKota || undefined,
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" />
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
              <label className="text-sm font-medium">Bulan</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">KPPN</label>
              <Select value={selectedKppn} onValueChange={setSelectedKppn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih KPPN" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueKppn.map((kppn) => (
                    <SelectItem
                      key={kppn.kdkppn}
                      value={kppn.kdkppn}
                      title={`${kppn.kdkppn} - ${kppn.nmkppn}`}
                    >
                      <span className="truncate">
                        {kppn.kdkppn} - {kppn.nmkppn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kab/Kota</label>
              <Select
                value={selectedKabKota}
                onValueChange={setSelectedKabKota}
              >
                <SelectTrigger className="w-full" disabled={!selectedKppn}>
                  <SelectValue
                    placeholder={
                      selectedKppn
                        ? "Pilih Kab/Kota"
                        : "Pilih KPPN terlebih dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredKabKotaOptions.map((lokasi) => (
                    <SelectItem
                      key={lokasi.kdkabkota}
                      value={lokasi.kdkabkota}
                      title={`${lokasi.kdkabkota} - ${lokasi.nmkabkota}`}
                    >
                      <span className="truncate">
                        {lokasi.kdkabkota} - {lokasi.nmkabkota}
                      </span>
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
          <CardTitle>Data Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-sm text-muted-foreground mb-2">Memuat data...</div>
          )}
          {error ? (
            <div className="text-sm text-red-600">{String(error.message || error)}</div>
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
