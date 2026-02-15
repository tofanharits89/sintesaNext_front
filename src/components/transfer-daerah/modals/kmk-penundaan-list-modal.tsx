"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useKmkPencabutan } from "@/hooks/use-kmk-pencabutan";

interface KmkPenundaanListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noKmk?: string; // required to query backend
  year?: string;  // required to query backend (maps to thang)
}

type ApiRow = {
  kmktunda: string;
  thangcabut: string | number;
  no_kmkcabut: string;
  tglcabut: string | null;
  uraiancabut?: string | null;
};

export function KmkPenundaanListModal({
  open,
  onOpenChange,
  noKmk,
  year,
}: KmkPenundaanListModalProps) {
  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number }>({ pageIndex: 0, pageSize: 10 });
  const enabled = Boolean(open && noKmk);
  const pencabutan = useKmkPencabutan(enabled ? noKmk : undefined);
  const data = pencabutan.rows as any[] | undefined;
  const isLoading = pencabutan.isLoading;
  const isError = Boolean(pencabutan.error);

  // Reset to first page when modal opens
  useEffect(() => {
    if (open) {
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }
    // only when open toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset to first page when data length changes
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);

  const rows = (data ?? []).map((d: any, idx: number) => {
    const tgl = d.tglcabut ?? null;
    const yearFromDate = (() => {
      if (!tgl) return "";
      const m = String(tgl).match(/^(\d{4})/);
      return m ? m[1] : "";
    })();
    return {
      id: `${String(d.no_kmkcabut ?? d.no_kmk ?? "-")}-${idx}`,
      no: idx + 1,
      kmkPenundaan: String(d.no_kmk ?? d.kmktunda ?? ""),
      tahun: d.thangcabut ?? yearFromDate ?? "",
      tanggal: tgl,
      nomor: String(d.no_kmkcabut ?? ""),
      uraian: String(d.nmjenis ? `${d.nmjenis}${d.nm_kriteria ? " - " + d.nm_kriteria : ""}` : (d.uraiancabut ?? "")),
    };
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / (pagination.pageSize || 10)));
  const startIndex = pagination.pageIndex * (pagination.pageSize || 10);
  const endIndex = Math.min(total, startIndex + (pagination.pageSize || 10));
  const paginatedRows = useMemo(() => rows.slice(startIndex, endIndex), [rows, startIndex, endIndex]);
  // Helper to safely format date values. Accepts Date|string|number and returns a localized string or '-'.
  const formatTanggal = (val: unknown) => {
    if (!val) return "-";
    try {
      // If already a Date
      if (val instanceof Date && !isNaN(val.getTime())) {
        return val.toLocaleDateString("id-ID");
      }
      const str = String(val).trim();
      if (!str) return "-";
      // Try to parse ISO-like (YYYY-MM-DD) first
      const isoMatch = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
      if (isoMatch) {
        const y = Number(isoMatch[1]);
        const m = Number(isoMatch[2]);
        const d = Number(isoMatch[3]);
        const dt = new Date(y, m - 1, d);
        if (!isNaN(dt.getTime())) return dt.toLocaleDateString("id-ID");
      }
      // Fallback to native Date parsing
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) return dt.toLocaleDateString("id-ID");
      return "-";
    } catch {
      return "-";
    }
  };

  const columns = useMemo(() => [
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
      accessorKey: "kmkPenundaan",
      header: "KMK Penundaan",
    },
    {
      accessorKey: "tahun",
      header: "Tahun",
    },
    {
      accessorKey: "tanggal",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tanggal</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {formatTanggal(row.getValue("tanggal"))}
        </div>
      ),
    },
    {
      accessorKey: "nomor",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Nomor</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("nomor")}</div>
      ),
    },
    {
      accessorKey: "uraian",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Uraian</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[300px] truncate mx-auto"
          title={row.getValue("uraian")}
        >
          {row.getValue("uraian")}
        </div>
      ),
    },
  ], []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>List KMK Penundaan</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              Memuat data...
            </div>
          ) : isError ? (
            <div className="text-center text-sm text-red-600 py-10">
              Gagal memuat data KMK Penundaan.
            </div>
          ) : (
            <div className="text-xs sm:text-sm">
              <DataTable
                columns={columns}
                data={paginatedRows}
                hidePagination
                tableClassName="text-xs"
              />
            </div>
          )}
        </div>
        <DialogFooter className="flex-shrink-0 flex items-center justify-between mt-2">
          <div className="w-[72px]" />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((p) => {
                  const target = Math.max(0, p.pageIndex - 1);
                  return target === p.pageIndex ? p : { ...p, pageIndex: target };
                })
              }
              disabled={pagination.pageIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {total === 0 ? 0 : startIndex + 1} - {endIndex} dari {total}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination((p) => {
                  const target = Math.min(totalPages - 1, p.pageIndex + 1);
                  return target === p.pageIndex ? p : { ...p, pageIndex: target };
                });
              }}
              disabled={(() => {
                return pagination.pageIndex >= totalPages - 1;
              })()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="destructive"
            className="w-24"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
