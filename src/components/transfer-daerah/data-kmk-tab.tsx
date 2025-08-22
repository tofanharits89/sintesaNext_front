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
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Trash2 } from "lucide-react";
import { DataKmkModal } from "./modals/data-kmk-modal";
import { PencabutanModal } from "./modals/pencabutan-modal";
import { DataPotonganModal } from "./modals/data-potongan-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";

interface DataKmkTabProps {
  // Remove the selectedYear prop as this tab will manage its own year state
}

// Mock data for KMK table
const mockKmkData = [
  {
    id: "1",
    no: 1,
    tahun: "2024",
    tanggalKmk: "2024-01-15",
    nomorKmk: "KMK-001/2024",
    uraian: "Alokasi DAU Triwulan I",
    jenis: "1",
    kriteria: "Tunggakan PHLN",
    fileUrl: "/files/kmk-001-2024.pdf",
  },
  {
    id: "2",
    no: 2,
    tahun: "2024",
    tanggalKmk: "2024-04-15",
    nomorKmk: "KMK-002/2024",
    uraian: "Alokasi DAU Triwulan II",
    jenis: "2",
    kriteria: "Pinjaman PEN",
    fileUrl: "/files/kmk-002-2024.pdf",
  },
  {
    id: "3",
    no: 3,
    tahun: "2024",
    tanggalKmk: "2024-07-10",
    nomorKmk: "KMK-003/2024",
    uraian: "Alokasi DAU Triwulan III",
    jenis: "3",
    kriteria: "Intercept Earmarked",
    fileUrl: "/files/kmk-003-2024.pdf",
  },
  {
    id: "4",
    no: 4,
    tahun: "2024",
    tanggalKmk: "2024-10-05",
    nomorKmk: "KMK-004/2024",
    uraian: "Penyesuaian Alokasi DAU",
    jenis: "4",
    kriteria: "Potongan Dana Transfer",
    fileUrl: "/files/kmk-004-2024.pdf",
  },
  // Add more mock data as needed
];

export function DataKmkTab({}: DataKmkTabProps) {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isDataKmkModalOpen, setIsDataKmkModalOpen] = useState(false);
  const [isPencabutanModalOpen, setIsPencabutanModalOpen] = useState(false);
  const [isDataPotonganModalOpen, setIsDataPotonganModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleDataPotongan = (item: any) => {
    setSelectedItem(item);
    setIsDataPotonganModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDownload = (fileUrl: string) => {
    // Implementation for file download
    console.log("Downloading file:", fileUrl);
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
      accessorKey: "tanggalKmk",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tanggal KMK</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {new Date(row.getValue("tanggalKmk")).toLocaleDateString("id-ID")}
        </div>
      ),
    },
    {
      accessorKey: "nomorKmk",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Nomor KMK</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center font-medium">
          {row.getValue("nomorKmk")}
        </div>
      ),
    },
    {
      accessorKey: "uraian",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Uraian</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[200px] truncate mx-auto"
          title={row.getValue("uraian")}
        >
          {row.getValue("uraian")}
        </div>
      ),
    },
    {
      accessorKey: "jenis",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Jenis KMK</div>
      ),
      cell: ({ row }: any) => {
        const jenisCode = row.getValue("jenis");
        const getJenisDescription = (code: string) => {
          switch (code) {
            case "1":
              return "Potongan SPM";
            case "2":
              return "Penundaan";
            case "3":
              return "Cabut Penundaan";
            case "4":
              return "Potongan ADD";
            default:
              return `Kode ${code}`;
          }
        };
        const getJenisVariant = (code: string) => {
          switch (code) {
            case "1":
              return "destructive"; // Red for Potongan SPM
            case "2":
              return "secondary"; // Gray for Penundaan
            case "3":
              return "default"; // Blue for Cabut Penundaan
            case "4":
              return "outline"; // Outline for Potongan ADD
            default:
              return "secondary";
          }
        };
        return (
          <div className="flex justify-center">
            <Badge
              variant={getJenisVariant(jenisCode)}
              title={`Kode ${jenisCode} - ${getJenisDescription(jenisCode)}`}
            >
              <span className="truncate">
                {jenisCode} - {getJenisDescription(jenisCode)}
              </span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "kriteria",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kriteria KMK</div>
      ),
      cell: ({ row }: any) => {
        const kriteria = row.getValue("kriteria");
        const getKriteriaVariant = (kriteria: string) => {
          switch (kriteria) {
            case "Tunggakan PHLN":
              return "destructive";
            case "Pinjaman PEN":
              return "default";
            case "Intercept Earmarked":
              return "secondary";
            case "Potongan Dana Transfer":
              return "outline";
            case "Sisa Hibah":
              return "default";
            case "Potongan JKN":
              return "destructive";
            default:
              return "secondary";
          }
        };
        return (
          <div className="flex justify-center">
            <Badge variant={getKriteriaVariant(kriteria)} title={kriteria}>
              <span className="truncate">{kriteria}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "fileUrl",
      header: ({ column }: any) => (
        <div className="text-center font-medium">File</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(row.getValue("fileUrl"))}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
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
            onClick={() => handleDataPotongan(row.original)}
          >
            Data Potongan
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Filter Card */}
      <Card>
        <CardContent className="pt-6">
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
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data KMK</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsDataKmkModalOpen(true)}>
                Data KMK
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPencabutanModalOpen(true)}
              >
                Pencabutan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockKmkData.filter((item) => item.tahun === selectedYear)}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <DataKmkModal
        open={isDataKmkModalOpen}
        onOpenChange={setIsDataKmkModalOpen}
      />
      <PencabutanModal
        open={isPencabutanModalOpen}
        onOpenChange={setIsPencabutanModalOpen}
      />
      <DataPotonganModal
        open={isDataPotonganModalOpen}
        onOpenChange={setIsDataPotonganModalOpen}
        data={selectedItem}
      />
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        data={selectedItem}
        onConfirm={() => {
          // Implementation for delete
          console.log("Deleting item:", selectedItem);
          setIsDeleteModalOpen(false);
        }}
      />
    </div>
  );
}
