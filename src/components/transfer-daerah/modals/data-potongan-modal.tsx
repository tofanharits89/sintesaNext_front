"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface DataPotonganModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

// Mock data for data potongan
const mockDataPotongan = [
  {
    id: "1",
    no: 1,
    jenisPotongan: "Pajak Daerah",
    keterangan: "Pajak Bumi dan Bangunan",
    nilai: 50000000,
    status: "Aktif",
  },
  {
    id: "2",
    no: 2,
    jenisPotongan: "Retribusi",
    keterangan: "Retribusi Pelayanan Kesehatan",
    nilai: 25000000,
    status: "Aktif",
  },
  {
    id: "3",
    no: 3,
    jenisPotongan: "Pungutan Lain",
    keterangan: "Pungutan Khusus Daerah",
    nilai: 15000000,
    status: "Nonaktif",
  },
];

export function DataPotonganModal({
  open,
  onOpenChange,
  data,
}: DataPotonganModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      accessorKey: "no",
      header: "No",
      cell: ({ row }: any) => (
        <div className="text-center">{row.getValue("no")}</div>
      ),
    },
    {
      accessorKey: "jenisPotongan",
      header: "Jenis Potongan",
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue("jenisPotongan")}</div>
      ),
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      cell: ({ row }: any) => (
        <div
          className="max-w-[200px] truncate"
          title={row.getValue("keterangan")}
        >
          {row.getValue("keterangan")}
        </div>
      ),
    },
    {
      accessorKey: "nilai",
      header: "Nilai",
      cell: ({ row }: any) => (
        <div className="text-right font-mono">
          {formatCurrency(row.getValue("nilai"))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        return (
          <Badge variant={status === "Aktif" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
  ];

  const totalPotongan = mockDataPotongan.reduce((sum, item) => {
    return item.status === "Aktif" ? sum + item.nilai : sum;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Data Potongan - {data?.nomorKmk}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {data && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nomor KMK</p>
                <p className="font-medium">{data.nomorKmk}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uraian</p>
                <p className="font-medium">{data.uraian}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal KMK</p>
                <p className="font-medium">
                  {new Date(data.tanggalKmk).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Potongan Aktif
                </p>
                <p className="font-medium text-red-600">
                  {formatCurrency(totalPotongan)}
                </p>
              </div>
            </div>
          )}

          <div className="border rounded-lg">
            <DataTable
              columns={columns}
              data={mockDataPotongan}
              searchKey="jenisPotongan"
              searchPlaceholder="Cari jenis potongan..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
