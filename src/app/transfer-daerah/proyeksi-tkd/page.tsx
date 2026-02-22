"use client";

import { useEffect, useState } from "react";
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
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { ProyeksiTkdModal } from "@/components/transfer-daerah/modals/proyeksi-tkd-modal";
import { DeleteProyeksiTkdModal } from "@/components/transfer-daerah/modals/delete-proyeksi-tkd-modal";
import { Plus, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useProyeksiTkd } from "@/hooks/use-proyeksi-tkd";
import { apiPath } from "@/lib/config/base-path";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ProyeksiTkdPage() {
  const PAGE_SIZE = 30;
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [offset, setOffset] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Generate years from current year back to 2020
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const handleDownload = async () => {
    const LIMIT_PER_REQUEST = 200;
    setIsDownloading(true);

    try {
      const allRows: Record<string, unknown>[] = [];
      let currentOffset = 0;
      let hasNext = true;
      let guard = 0;

      while (hasNext && guard < 1000) {
        const params = new URLSearchParams({
          thang: selectedYear,
          limit: String(LIMIT_PER_REQUEST),
          offset: String(currentOffset),
        });

        const response = await fetch(
          apiPath(`/transfer-daerah/proyeksi-tkd?${params.toString()}`),
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
          }
        );

        const text = await response.text();
        if (!response.ok) {
          let message = `HTTP ${response.status}`;
          try {
            const parsed = JSON.parse(text);
            message = parsed?.message || parsed?.error || message;
          } catch {
            // Keep fallback message.
          }
          throw new Error(message);
        }

        if (!text.trim()) break;
        const parsed = JSON.parse(text);
        const chunk = Array.isArray(parsed?.data) ? parsed.data : [];
        const paginationInfo = parsed?.pagination || {};

        allRows.push(...chunk);

        const limit = Number(paginationInfo.limit || LIMIT_PER_REQUEST) || LIMIT_PER_REQUEST;
        const offsetValue = Number(paginationInfo.offset || currentOffset) || currentOffset;
        const nextFromServer = Boolean(paginationInfo.hasNext);

        hasNext = nextFromServer && chunk.length > 0;
        currentOffset = offsetValue + limit;
        guard += 1;

        if (chunk.length === 0) break;
      }

      if (allRows.length === 0) {
        toast.error("Tidak ada data untuk diunduh");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(allRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proyeksi TKD");

      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
      const filename = `proyeksi-tkd-${selectedYear}-${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success(`Berhasil mengunduh ${allRows.length} baris data`);
    } catch (error: any) {
      toast.error(
        error?.message
          ? `Gagal mengunduh Excel: ${error.message}`
          : "Gagal mengunduh Excel"
      );
    } finally {
      setIsDownloading(false);
    }
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

  useEffect(() => {
    setOffset(0);
  }, [selectedYear]);

  const { rows, pagination, isLoading, error } = useProyeksiTkd({
    thang: selectedYear,
    limit: PAGE_SIZE,
    offset,
  });

  const currentPage = pagination.currentPage;
  const totalPages = pagination.totalPages;
  const totalItems = pagination.total;
  const startItem = totalItems > 0 ? offset + 1 : 0;
  const endItem = offset + rows.length;

  const columns = [
    {
      accessorKey: "no",
      header: ({ column }: any) => (
        <div className="text-center font-medium">No</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{offset + row.index + 1}</div>
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
        const waktuUpdate = row.getValue("waktuUpdate") as Date | null;
        if (!waktuUpdate || Number.isNaN(waktuUpdate.getTime())) {
          return <div className="text-center text-muted-foreground">-</div>;
        }
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
            onClick={handleDownload}
            disabled={isDownloading || isLoading}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white min-w-[140px] h-10"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download Excel"}
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white min-w-[100px] h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Rekam
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
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <div className="text-sm text-red-600">
              {String((error as Error)?.message || error)}
            </div>
          ) : (
            <div className="space-y-3">
              <DataTable
                columns={columns}
                data={rows}
                hidePagination
                initialPageSize={PAGE_SIZE}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {startItem}-{endItem} dari {totalItems} data
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Halaman {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
                    }
                    disabled={!pagination.hasPrev || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                    disabled={!pagination.hasNext || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
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

