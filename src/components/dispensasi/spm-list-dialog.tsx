"use client";

import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import { apiClient } from "@/lib/api/httpClient";
import { toast } from "sonner";

interface SpmListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  nopermohonan: string;
  nmsatker: string;
  kdsatker: string;
}

interface SpmItem {
  nospm: string;
  nilspm: number;
  status: string;
  tgspm: string;
  tgbast: string;
  nobast: string;
}

const columns: ColumnDef<SpmItem>[] = [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "tgspm",
    header: () => <div className="text-center font-medium">Tgl SPM</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("tgspm") || "-"}</div>,
  },
  {
    accessorKey: "nospm",
    header: () => <div className="text-center font-medium">No SPM</div>,
    cell: ({ row }) => (
      <div className="text-left max-w-[200px] truncate" title={row.getValue("nospm")}>
        {row.getValue("nospm") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "nilspm",
    header: () => <div className="text-center font-medium">Nilai SPM (Rp)</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums pr-2">
        {new Intl.NumberFormat("id-ID").format(row.getValue("nilspm") || 0)}
      </div>
    ),
  },
  {
    accessorKey: "tgbast",
    header: () => <div className="text-center font-medium">Tgl BAST</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("tgbast") || "-"}</div>,
  },
  {
    accessorKey: "nobast",
    header: () => <div className="text-center font-medium">No BAST</div>,
    cell: ({ row }) => (
      <div className="text-left max-w-[200px] truncate" title={row.getValue("nobast")}>
        {row.getValue("nobast") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center font-medium">Status</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("status") === "Setuju" ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Disetujui
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Ditolak
          </span>
        )}
      </div>
    ),
  },
];

export function SpmListDialog({
  open,
  onOpenChange,
  id,
  nopermohonan,
  nmsatker,
  kdsatker,
}: SpmListDialogProps) {
  const [data, setData] = useState<SpmItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && id) {
      fetchData();
    }
  }, [open, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = `SELECT nospm, nilspm, status, tgspm, tgbast, nobast FROM laporan_2023.dispensasi_spm_lampiran WHERE id_dispensasi = '${id}' ORDER BY id DESC`;
      const encryptedQuery = btoa(query);

      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999&page=0`
      );

      setData(result.result || []);
    } catch (error) {
      console.error("Terjadi Permasalahan Koneksi atau Server Backend");
      toast.error("Gagal memuat data SPM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden w-[95vw] max-w-7xl sm:max-w-7xl" showCloseButton={false}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <span>Daftar SPM Dispensasi</span>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex-1 overflow-hidden space-y-4">
          <div className="p-4 bg-background border rounded-lg shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">SATKER</p>
              <p className="font-bold text-lg">{nmsatker} ({kdsatker})</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nomor Permohonan :{" "}
                <span className="font-medium text-foreground">{nopermohonan}</span>
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                emptyMessage="Belum ada data SPM"
                initialPageSize={10}
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" /> Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
