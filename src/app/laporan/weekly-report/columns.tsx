"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { WeeklyReportRow } from "@/hooks/use-weekly-report";

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

interface ColumnHandlers {
  onDownload: (fileUrl: string) => void;
}

export const getColumns = (handlers: ColumnHandlers): ColumnDef<WeeklyReportRow>[] => [
  {
    id: "no",
    header: () => <div className="text-center font-medium">No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    accessorKey: "tahun",
    header: () => <div className="text-center font-medium">Tahun</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("tahun") || "-"}</div>,
  },
  {
    id: "periode",
    header: () => <div className="text-center font-medium min-w-[180px]">Periode</div>,
    cell: ({ row }) => {
      const { namaBulan, bulan } = row.original;
      return <div className="text-center">{namaBulan || bulan || "-"}</div>;
    },
  },
  {
    accessorKey: "tanggalAwal",
    header: () => <div className="text-center font-medium">Tanggal Awal</div>,
    cell: ({ row }) => <div className="text-center">{formatDate(row.getValue("tanggalAwal"))}</div>,
  },
  {
    accessorKey: "tanggalAkhir",
    header: () => <div className="text-center font-medium">Tanggal Akhir</div>,
    cell: ({ row }) => <div className="text-center">{formatDate(row.getValue("tanggalAkhir"))}</div>,
  },
  {
    accessorKey: "keterangan",
    header: () => <div className="text-center font-medium">Keterangan</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue("keterangan") || "-"}</div>,
  },
  {
    accessorKey: "fileName",
    header: () => <div className="text-center font-medium">File</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <span
          title={row.getValue("fileName") || "-"}
          className="inline-block max-w-[280px] truncate"
        >
          {row.getValue("fileName") || "-"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Aksi</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handlers.onDownload(row.original.fileUrl)}
          disabled={!row.original.fileName}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    ),
  },
];
