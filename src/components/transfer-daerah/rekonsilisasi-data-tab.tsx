"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ResetButton } from "@/components/ui/reset-button";
import kppnData from "@/data/kdkppn.json";
import kabkotaData from "@/data/kdlokasi.json";

interface RekonsiliasiDataTabProps {
  selectedYear: string;
}

// Mock data for reconciliation table
const mockRekonsiliasiData = [
  {
    id: "1",
    no: 1,
    tahun: "2024",
    bulan: "Januari",
    kppn: "KPPN Jakarta I",
    kabkota: "Jakarta Pusat",
    status: "Selesai",
  },
  {
    id: "2",
    no: 2,
    tahun: "2024",
    bulan: "Februari",
    kppn: "KPPN Jakarta II",
    kabkota: "Jakarta Selatan",
    status: "Pending",
  },
  {
    id: "3",
    no: 3,
    tahun: "2024",
    bulan: "Maret",
    kppn: "KPPN Bandung I",
    kabkota: "Bandung",
    status: "Dalam Proses",
  },
  // Add more mock data as needed
];

export function RekonsiliasiDataTab({
  selectedYear,
}: RekonsiliasiDataTabProps) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedKppn, setSelectedKppn] = useState("");
  const [selectedKabKota, setSelectedKabKota] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

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

  const statusOptions = ["Selesai", "Pending", "Dalam Proses", "Ditolak"];

  const handleReset = () => {
    setSelectedMonth("");
    setSelectedKppn("");
    setSelectedKabKota("");
    setSelectedStatus("");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Selesai":
        return "default";
      case "Pending":
        return "secondary";
      case "Dalam Proses":
        return "outline";
      case "Ditolak":
        return "destructive";
      default:
        return "secondary";
    }
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
        <div className="text-center font-medium">Kab/Kota</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[150px] truncate mx-auto"
          title={row.getValue("kabkota")}
        >
          {row.getValue("kabkota")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Status</div>
      ),
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        return (
          <div className="flex justify-center">
            <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
          </div>
        );
      },
    },
  ];

  // Filter data based on selections
  const filteredData = mockRekonsiliasiData.filter((item) => {
    return (
      item.tahun === selectedYear &&
      (selectedMonth === "" || item.bulan === selectedMonth) &&
      (selectedKppn === "" || item.kppn.includes(selectedKppn)) &&
      (selectedKabKota === "" || item.kabkota.includes(selectedKabKota)) &&
      (selectedStatus === "" || item.status === selectedStatus)
    );
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={selectedYear} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
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
                  {kppnData.map((kppn) => (
                    <SelectItem
                      key={kppn.kdkppn}
                      value={kppn.nmkppn}
                      title={kppn.nmkppn}
                    >
                      <span className="truncate">{kppn.nmkppn}</span>
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kab/Kota" />
                </SelectTrigger>
                <SelectContent>
                  {kabkotaData.map((lokasi) => (
                    <SelectItem
                      key={lokasi.kdlokasi}
                      value={lokasi.nmlokasi}
                      title={lokasi.nmlokasi}
                    >
                      <span className="truncate">{lokasi.nmlokasi}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
          <CardTitle>Data Rekonsilisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>
    </div>
  );
}
