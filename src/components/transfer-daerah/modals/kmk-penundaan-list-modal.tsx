"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface KmkPenundaanListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ApiRow = {
  kmktunda: string;
  thangcabut: string | number;
  no_kmkcabut: string;
  tglcabut: string;
  uraiancabut: string;
};

export function KmkPenundaanListModal({
  open,
  onOpenChange,
}: KmkPenundaanListModalProps) {
  const [pagination, setPagination] = useState<{ pageIndex: number; pageSize: number }>({ pageIndex: 0, pageSize: 10 });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["kmk-penundaan-list"],
    queryFn: async () => {
      const token = getAuthTokenFromCookie();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(backendPath("/transfer-daerah/dau/kmk/penundaan"), {
        credentials: "include",
        headers,
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error("Failed to fetch KMK penundaan list");
      const json = await res.json();
      return (json?.data as ApiRow[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const rows = (data ?? []).map((d: ApiRow, idx: number) => ({
    id: `${d.no_kmkcabut}-${idx}`,
    no: idx + 1,
    kmkPenundaan: d.kmktunda,
    tahun: d.thangcabut,
    tanggal: d.tglcabut,
    nomor: d.no_kmkcabut,
    uraian: d.uraiancabut,
  }));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / (pagination.pageSize || 10)));
  const startIndex = pagination.pageIndex * (pagination.pageSize || 10);
  const endIndex = Math.min(total, startIndex + (pagination.pageSize || 10));
  const paginatedRows = useMemo(() => rows.slice(startIndex, endIndex), [rows, startIndex, endIndex]);
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
          {new Date(row.getValue("tanggal")).toLocaleDateString("id-ID")}
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
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>List KMK Penundaan</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex-1 overflow-auto px-1">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              Memuat data...
            </div>
          ) : isError ? (
            <div className="text-center text-sm text-red-600 py-10">
              Gagal memuat data KMK Penundaan.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={paginatedRows}
              hidePagination
            />
          )}
        </div>
        <DialogFooter className="flex items-center justify-between mt-2">
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
