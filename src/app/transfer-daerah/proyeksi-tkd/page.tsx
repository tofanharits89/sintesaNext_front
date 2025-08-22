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
import { ProyeksiTkdModal } from "@/components/transfer-daerah/modals/proyeksi-tkd-modal";
import { DeleteProyeksiTkdModal } from "@/components/transfer-daerah/modals/delete-proyeksi-tkd-modal";
import { Download, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Mock data for the table
const mockData = [
  {
    id: 1,
    tahun: "2024",
    periode: "Januari",
    kppn: "KPPN Jakarta I",
    kppnSebagaiSatker: "001",
    jenisTkd: "01 - DAU",
    jenisKeperluan: "ALCo",
    waktuUpdate: new Date("2024-01-15T10:30:00"),
  },
  {
    id: 2,
    tahun: "2024",
    periode: "Februari",
    kppn: "KPPN Jakarta II",
    kppnSebagaiSatker: "002",
    jenisTkd: "02 - DBH",
    jenisKeperluan: "IKU",
    waktuUpdate: new Date("2024-02-20T14:15:00"),
  },
  {
    id: 3,
    tahun: "2024",
    periode: "Maret",
    kppn: "KPPN Bandung",
    kppnSebagaiSatker: "004",
    jenisTkd: "03 - DAK Fisik",
    jenisKeperluan: "ALCo",
    waktuUpdate: new Date("2024-03-10T09:45:00"),
  },
  {
    id: 4,
    tahun: "2024",
    periode: "April",
    kppn: "KPPN Surabaya",
    kppnSebagaiSatker: "005",
    jenisTkd: "04 - Dana Desa",
    jenisKeperluan: "IKU",
    waktuUpdate: new Date("2024-04-05T16:20:00"),
  },
  {
    id: 5,
    tahun: "2024",
    periode: "Mei",
    kppn: "KPPN Jakarta III",
    kppnSebagaiSatker: "003",
    jenisTkd: "05 - DAK Non Fisik",
    jenisKeperluan: "ALCo",
    waktuUpdate: new Date("2024-05-12T11:10:00"),
  },
];

export default function ProyeksiTkdPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleDownload = () => {
    // Handle download functionality
    console.log("Download clicked");
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // Handle delete functionality
    console.log("Deleting item:", selectedItem);
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const columns = [
    {
      accessorKey: "no",
      header: ({ column }: any) => (
        <div className="text-center font-medium">No</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.index + 1}</div>
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
      accessorKey: "periode",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Periode</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("periode")}</div>
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
      accessorKey: "kppnSebagaiSatker",
      header: ({ column }: any) => (
        <div className="text-center font-medium">KPPN sebagai Satker</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("kppnSebagaiSatker")}</div>
      ),
    },
    {
      accessorKey: "jenisTkd",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Jenis TKD</div>
      ),
      cell: ({ row }: any) => {
        const jenisTkd = row.getValue("jenisTkd");
        const getJenisTkdVariant = (jenis: string) => {
          switch (jenis) {
            case "01 - DAU":
              return "default";
            case "02 - DBH":
              return "secondary";
            case "03 - DAK Fisik":
              return "outline";
            case "04 - Dana Desa":
              return "destructive";
            case "05 - DAK Non Fisik":
              return "secondary";
            default:
              return "secondary";
          }
        };
        return (
          <div className="flex justify-center">
            <Badge variant={getJenisTkdVariant(jenisTkd)} title={jenisTkd}>
              <span className="truncate">{jenisTkd}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "jenisKeperluan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Jenis Keperluan</div>
      ),
      cell: ({ row }: any) => {
        const jenisKeperluan = row.getValue("jenisKeperluan");
        const getJenisKeperluanVariant = (jenis: string) => {
          switch (jenis) {
            case "ALCo":
              return "default";
            case "IKU":
              return "secondary";
            default:
              return "secondary";
          }
        };
        return (
          <div className="flex justify-center">
            <Badge
              variant={getJenisKeperluanVariant(jenisKeperluan)}
              title={jenisKeperluan}
            >
              <span className="truncate">{jenisKeperluan}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "waktuUpdate",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Waktu Update</div>
      ),
      cell: ({ row }: any) => {
        const waktuUpdate = row.getValue("waktuUpdate");
        return (
          <div className="text-center text-sm">
            <div>{format(waktuUpdate, "dd/MM/yyyy", { locale: localeId })}</div>
            <div className="text-muted-foreground">
              {format(waktuUpdate, "HH:mm:ss", { locale: localeId })}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            title="Edit"
          >
            <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Proyeksi TKD
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data proyeksi Transfer Ke Daerah
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white min-w-[100px] h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Rekam
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white min-w-[100px] h-10"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg font-semibold">
              Data Proyeksi TKD
            </CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockData.filter((item) => item.tahun === selectedYear)}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <ProyeksiTkdModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editData={editingItem}
      />
      <DeleteProyeksiTkdModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        data={selectedItem}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
