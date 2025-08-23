"use client";

import { useState } from "react";
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
import { Edit, Trash2 } from "lucide-react";
import { PerkembanganLainnyaModal } from "./modals/perkembangan-lainnya-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";

// Mock data for Perkembangan Lainnya table
const mockPerkembanganLainnyaData = [
  {
    id: "1",
    no: 1,
    tahun: "2024",
    kanwil: "Kanwil DJPb Sumut",
    triwulan: "I",
    indikator: "Nilai Tukar Petani",
    satuan: "Indeks",
    keterangan: "NTP komposit regional",
    update: "2024-03-15T10:30:00Z",
  },
  {
    id: "2",
    no: 2,
    tahun: "2024",
    kanwil: "Kanwil DJPb Jabar",
    triwulan: "I",
    indikator: "Indeks Pembangunan Manusia",
    satuan: "Indeks",
    keterangan: "IPM menurut provinsi",
    update: "2024-03-16T14:20:00Z",
  },
  {
    id: "3",
    no: 3,
    tahun: "2024",
    kanwil: "Kanwil DJPb Jateng",
    triwulan: "II",
    indikator: "Gini Ratio",
    satuan: "Rasio",
    keterangan: "Tingkat ketimpangan pendapatan",
    update: "2024-06-10T09:15:00Z",
  },
];

export function PerkembanganLainnyaTab() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isPerkembanganLainnyaModalOpen, setIsPerkembanganLainnyaModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsPerkembanganLainnyaModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      accessorKey: "kanwil",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kanwil</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("kanwil")}</div>
      ),
    },
    {
      accessorKey: "triwulan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Triwulan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("triwulan")}</div>
      ),
    },
    {
      accessorKey: "indikator",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Indikator</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[200px] truncate mx-auto"
          title={row.getValue("indikator")}
        >
          {row.getValue("indikator")}
        </div>
      ),
    },
    {
      accessorKey: "satuan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Satuan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("satuan")}</div>
      ),
    },
    {
      accessorKey: "keterangan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Keterangan</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[300px] truncate mx-auto"
          title={row.getValue("keterangan")}
        >
          {row.getValue("keterangan")}
        </div>
      ),
    },
    {
      accessorKey: "update",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Update</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center text-sm">
          {formatDateTime(row.getValue("update"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg font-semibold">
              Data Perkembangan Lainnya
            </CardTitle>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">
                  Tahun:
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[120px]">
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

              {/* Action Button */}
              <Button
                onClick={() => setIsPerkembanganLainnyaModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
              >
                Rekam
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={mockPerkembanganLainnyaData.filter(
                (item) => item.tahun === selectedYear
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <PerkembanganLainnyaModal
        open={isPerkembanganLainnyaModalOpen}
        onOpenChange={setIsPerkembanganLainnyaModalOpen}
        data={selectedItem}
        onSave={() => {
          setIsPerkembanganLainnyaModalOpen(false);
          setSelectedItem(null);
        }}
      />
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        data={selectedItem}
        title="Hapus Data Perkembangan Lainnya"
        description="Apakah Anda yakin ingin menghapus data perkembangan lainnya ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          console.log("Deleting perkembangan lainnya item:", selectedItem);
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
