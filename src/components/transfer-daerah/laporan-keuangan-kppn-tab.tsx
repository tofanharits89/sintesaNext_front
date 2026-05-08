"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DeleteLaporanModal } from "@/components/transfer-daerah/modals/delete-laporan-modal";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import {
  UploadLaporanKeuanganKppnRow,
  useUploadLaporanKeuanganKppn,
} from "@/hooks/use-upload-laporan-keuangan-kppn";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export function LaporanKeuanganKppnTab() {
  const queryClient = useQueryClient();
  const { rows, isLoading, error, refetch } = useUploadLaporanKeuanganKppn();
  const [selectedPeriode, setSelectedPeriode] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<UploadLaporanKeuanganKppnRow | null>(null);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, " ")
      .trim();

  const getPeriodeBase = (periode: string) => {
    if (!periode) return "";
    // Use separator " - " as logical divider so "TW-3" stays intact.
    const parts = periode.split(/\s-\s/);
    return (parts[0] || periode).trim();
  };

  const filteredData = useMemo(() => {
    if (!selectedPeriode || selectedPeriode === "all") return rows;
    const filter = normalizeText(selectedPeriode);
    return rows.filter((item) => {
      const rawPeriode = item.periode || "";
      const periodeBase = normalizeText(getPeriodeBase(rawPeriode));
      if (filter === "triwulan iii") {
        // Triwulan III tab option should map to real TW-3 period only.
        return ["tw-3", "tw 3", "triwulan iii", "triwulan 3"].includes(
          periodeBase
        );
      }
      // Exact match for base period label to avoid accidental cross-match.
      return periodeBase === filter;
    });
  }, [rows, selectedPeriode]);

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

  const handleDownload = (item: UploadLaporanKeuanganKppnRow) => {
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
    const item = filteredData.find((item) => item.id === id);
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
          `/transfer-daerah/upload-laporan/kppn/keuangan/${encodeURIComponent(
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
        queryKey: ["upload-laporan-keuangan-kppn"],
        refetchType: "active",
      });
      await refetch();
    } catch (e: any) {
      alert(`Gagal menghapus data: ${String(e?.message || e)}`);
    }
  };

  const columns = [
    {
      accessorKey: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => (
        <div className="text-center">{row.index + 1}</div>
      ),
    },
    {
      accessorKey: "tahun",
      header: () => <div className="text-center font-medium">Tahun</div>,
      cell: ({ row }: any) => (
        <div className="text-center">
          <Badge variant="outline">{row.getValue("tahun")}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "kppn",
      header: () => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("kppn")}</div>
      ),
    },
    {
      accessorKey: "jenis",
      header: () => <div className="text-center font-medium">Jenis</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            {row.getValue("jenis")}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "periode",
      header: () => <div className="text-center font-medium">Periode</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Badge variant="secondary">{row.getValue("periode")}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "uraian",
      header: () => <div className="text-center font-medium">Uraian</div>,
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[520px] mx-auto whitespace-normal break-words"
          title={row.getValue("uraian")}
        >
          {row.getValue("uraian")}
        </div>
      ),
    },
    {
      accessorKey: "tanggalUpload",
      header: () => (
        <div className="text-center font-medium">Tanggal dan Jam Upload</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center text-sm">
          {formatTanggalUpload(row.getValue("tanggalUpload"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center font-medium">Aksi</div>,
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row.original)}
            className="h-8 w-8 p-0"
            title={row.original.fileName || "Download file"}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row.original.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-center">Laporan Keuangan KPPN</CardTitle>

          {/* Periode Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filter Periode:
            </span>
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Periode</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="semesteran">Semesteran</SelectItem>
                <SelectItem value="tahunan">Tahunan</SelectItem>
                <SelectItem value="triwulan iii">Triwulan III</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive mb-3">
            Gagal memuat data: {String((error as any)?.message || error)}
          </div>
        ) : null}
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="Tidak ada data laporan yang sesuai dengan filter"
          />
        )}
      </CardContent>

      {/* Delete Confirmation Modal */}
      <DeleteLaporanModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        itemData={{
          tahun: selectedItem?.tahun ?? "",
          jenis: selectedItem?.jenis ?? "",
          periode: selectedItem?.periode ?? "",
          uraian: selectedItem?.uraian ?? "",
          ...(selectedItem?.kppn ? { kppn: selectedItem.kppn } : {}),
        }}
      />
    </Card>
  );
}
