"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteLaporanModal } from "@/components/transfer-daerah/modals/delete-laporan-modal";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import {
  UploadLaporanMonevKanwilRow,
  useUploadLaporanMonevKanwil,
} from "@/hooks/use-upload-laporan-monev-kanwil";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export function LaporanMonevKanwilTab() {
  const ITEMS_PER_PAGE = 25;
  const queryClient = useQueryClient();
  const { rows, isLoading, error, refetch } = useUploadLaporanMonevKanwil();
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<UploadLaporanMonevKanwilRow | null>(null);

  const filteredData = useMemo(() => {
    if (!selectedPeriode || selectedPeriode === "all") return rows;
    return rows.filter((item) => item.periodeCode === selectedPeriode);
  }, [rows, selectedPeriode]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatTanggalUpload = (value: string) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const handleDownload = (item: UploadLaporanMonevKanwilRow) => {
    if (!item.fileUrl) {
      alert("File tidak tersedia.");
      return;
    }
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.target = "_blank";
    link.rel = "noopener,noreferrer";
    if (item.fileName) {
      link.setAttribute("download", item.fileName);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    const item = filteredData.find((x) => x.id === id);
    if (item) {
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const headersWithCsrf: HeadersInit = addCsrfToHeaders({
        "Content-Type": "application/json",
      });
      const resp = await fetch(
        apiPath(
          `/transfer-daerah/upload-laporan/kanwil/monev/${encodeURIComponent(
            selectedItem.id
          )}`
        ),
        {
          method: "DELETE",
          headers: headersWithCsrf,
          credentials: "include",
        }
      );
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload?.message || `HTTP ${resp.status}`);
      }
      setSelectedItem(null);
      setIsDeleteModalOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["upload-laporan-monev-kanwil"],
        refetchType: "active",
      });
      await refetch();
    } catch (e: any) {
      alert(`Gagal menghapus data: ${String(e?.message || e)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-center">Laporan Monev Kanwil</CardTitle>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter Periode:</span>
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Semua Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value="0201">Semester I</SelectItem>
                <SelectItem value="0202">Semester II</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">No</TableHead>
                <TableHead className="text-center">Tahun</TableHead>
                <TableHead className="text-center">Kanwil</TableHead>
                <TableHead className="text-center">Jenis</TableHead>
                <TableHead className="text-center">Periode</TableHead>
                <TableHead className="text-center">Uraian</TableHead>
                <TableHead className="text-center">Tanggal dan Jam Upload</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-600">
                    Gagal memuat data: {String((error as any)?.message || error)}
                  </TableCell>
                </TableRow>
              ) : null}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <TableSkeleton rows={10} />
                  </TableCell>
                </TableRow>
              ) : null}
              {paginatedData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">{startIndex + index + 1}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{item.tahun}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.kanwil}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      {item.jenis}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.periode}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className="max-w-[520px] mx-auto block text-center whitespace-normal break-words"
                      title={item.uraian}
                    >
                      {item.uraian}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{formatTanggalUpload(item.tanggalUpload)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item)}
                        className="h-8 w-8 p-0"
                        title={item.fileName || "Download file"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !error && filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data laporan yang sesuai dengan filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && !error && filteredData.length > 0 && (
          <div className="flex flex-col gap-3 px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredData.length)} dari{" "}
              {filteredData.length} data
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {safePage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <DeleteLaporanModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        itemData={{
          tahun: selectedItem?.tahun ?? "",
          jenis: selectedItem?.jenis ?? "",
          periode: selectedItem?.periode ?? "",
          uraian: selectedItem?.uraian ?? "",
          ...(selectedItem?.kanwil ? { kanwil: selectedItem.kanwil } : {}),
        }}
      />
    </Card>
  );
}
