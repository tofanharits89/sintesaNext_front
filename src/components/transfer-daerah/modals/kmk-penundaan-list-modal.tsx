"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";

interface KmkPenundaanListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for KMK Penundaan list
const mockKmkPenundaanData = [
  {
    id: "1",
    no: 1,
    kmkPenundaan: "KMK-P001/2024",
    tahun: "2024",
    tanggal: "2024-01-15",
    nomor: "001/PND/2024",
    uraian: "Penundaan pencairan DAU Triwulan I karena verifikasi dokumen",
  },
  {
    id: "2",
    no: 2,
    kmkPenundaan: "KMK-P002/2024",
    tahun: "2024",
    tanggal: "2024-02-20",
    nomor: "002/PND/2024",
    uraian: "Penundaan pencairan DAU akibat ketidaksesuaian laporan keuangan",
  },
  {
    id: "3",
    no: 3,
    kmkPenundaan: "KMK-P003/2024",
    tahun: "2024",
    tanggal: "2024-03-10",
    nomor: "003/PND/2024",
    uraian: "Penundaan pencairan DAU menunggu hasil audit BPK",
  },
  {
    id: "4",
    no: 4,
    kmkPenundaan: "KMK-P004/2024",
    tahun: "2024",
    tanggal: "2024-04-05",
    nomor: "004/PND/2024",
    uraian: "Penundaan pencairan DAU karena masalah administrasi daerah",
  },
  {
    id: "5",
    no: 5,
    kmkPenundaan: "KMK-P005/2024",
    tahun: "2024",
    tanggal: "2024-05-15",
    nomor: "005/PND/2024",
    uraian: "Penundaan pencairan DAU akibat temuan penyimpangan anggaran",
  },
  {
    id: "6",
    no: 6,
    kmkPenundaan: "KMK-P006/2024",
    tahun: "2023",
    tanggal: "2023-12-20",
    nomor: "025/PND/2023",
    uraian: "Penundaan pencairan DAU akhir tahun untuk evaluasi kinerja",
  },
];

export function KmkPenundaanListModal({
  open,
  onOpenChange,
}: KmkPenundaanListModalProps) {
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
          <DataTable columns={columns} data={mockKmkPenundaanData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
