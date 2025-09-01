"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

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

  const rows = (data ?? []).map((d: ApiRow, idx: number) => ({
    id: `${d.no_kmkcabut}-${idx}`,
    no: idx + 1,
    kmkPenundaan: d.kmktunda,
    tahun: d.thangcabut,
    tanggal: d.tglcabut,
    nomor: d.no_kmkcabut,
    uraian: d.uraiancabut,
  }));
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
      accessorKey: "kmkPenundaan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">KMK Penundaan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center font-medium">
          {row.getValue("kmkPenundaan")}
        </div>
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
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List KMK Penundaan</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              Memuat data...
            </div>
          ) : isError ? (
            <div className="text-center text-sm text-red-600 py-10">
              Gagal memuat data KMK Penundaan.
            </div>
          ) : (
            <DataTable columns={columns} data={rows} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
