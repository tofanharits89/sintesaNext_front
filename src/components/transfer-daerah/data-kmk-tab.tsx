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
import { Download, Trash2 } from "lucide-react";
import { DataKmkModal } from "./modals/data-kmk-modal";
import { PencabutanModal } from "./modals/pencabutan-modal";
import { DataPotonganModal } from "./modals/data-potongan-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";
import { useKmkDau } from "@/hooks/use-kmk-dau";

interface DataKmkTabProps {
  // Remove the selectedYear prop as this tab will manage its own year state
}

// Data is now fetched from backend via useKmkDau

export function DataKmkTab({}: DataKmkTabProps) {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isDataKmkModalOpen, setIsDataKmkModalOpen] = useState(false);
  const [isPencabutanModalOpen, setIsPencabutanModalOpen] = useState(false);
  const [isDataPotonganModalOpen, setIsDataPotonganModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { rows, isLoading, error } = useKmkDau(selectedYear);

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
      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg font-semibold">Data KMK</CardTitle>

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

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsDataKmkModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
                >
                  Data KMK
                </Button>
                <Button
                  onClick={() => setIsPencabutanModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
                >
                  Pencabutan
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600 mb-2">{String((error as any).message || error)}</div>
          ) : null}
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat data KMK...</div>
          ) : (
            <DataTable columns={columns} data={rows} />
          )}
        </CardContent>
      </Card>
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
