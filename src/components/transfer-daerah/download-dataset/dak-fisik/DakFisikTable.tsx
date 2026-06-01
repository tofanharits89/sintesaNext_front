"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { cn } from "@/lib/utils/utils";
import { Table2 } from "lucide-react";
import { DakFisikData } from "./types";

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

interface DakFisikTableProps {
  tableData: DakFisikData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  loadingResults?: boolean;
}

export const DakFisikTable: React.FC<DakFisikTableProps> = ({
  tableData,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loadingResults = false,
}) => {
  const columns = useMemo<ColumnDef<DakFisikData>[]>(() => [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "thang",
      header: () => <div className="text-center font-medium">Tahun</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("thang")}</div>,
    },
    {
      accessorKey: "kdlokasi",
      header: () => <div className="text-center font-medium">Lokasi</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdlokasi")}</div>,
    },
    {
      accessorKey: "pemda",
      header: () => <div className="text-center font-medium">Pemda</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("pemda")}>
          {row.getValue("pemda")}
        </div>
      ),
      footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
    },
    {
      accessorKey: "kdkanwil",
      header: () => <div className="text-center font-medium">Kanwil</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdkanwil")}</div>,
    },
    {
      accessorKey: "kdkppn",
      header: () => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdkppn")}</div>,
    },
    {
      accessorKey: "nmkppn",
      header: () => <div className="text-center font-medium">Nama KPPN</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[160px] truncate" title={row.getValue("nmkppn")}>
          {row.getValue("nmkppn")}
        </div>
      ),
    },
    {
      accessorKey: "kdakun",
      header: () => <div className="text-center font-medium">Akun</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdakun")}</div>,
    },
    {
      accessorKey: "jenis_dana",
      header: () => <div className="text-center font-medium">Jenis Dana</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[140px] truncate" title={row.getValue("jenis_dana")}>
          {row.getValue("jenis_dana")}
        </div>
      ),
    },
    {
      accessorKey: "kdbidang",
      header: () => <div className="text-center font-medium">Bidang</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdbidang")}</div>,
    },
    {
      accessorKey: "nmbidang",
      header: () => <div className="text-center font-medium">Nama Bidang</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmbidang")}>
          {row.getValue("nmbidang")}
        </div>
      ),
    },
    {
      accessorKey: "kdsubidang",
      header: () => <div className="text-center font-medium">Sub</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdsubidang")}</div>,
    },
    {
      accessorKey: "nmsubidang",
      header: () => <div className="text-center font-medium">Nama Sub Bidang</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmsubidang")}>
          {row.getValue("nmsubidang")}
        </div>
      ),
    },
    {
      accessorKey: "pagu",
      header: () => <div className="text-center font-medium">Pagu</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {fmt(row.getValue("pagu"))}
        </div>
      ),
      footer: ({ table }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum, row) => sum + (Number(row.getValue("pagu")) || 0), 0))}
        </div>
      ),
    },
    {
      accessorKey: "total_penyaluran",
      header: () => <div className="text-center font-medium">Penyaluran</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {fmt(row.getValue("total_penyaluran"))}
        </div>
      ),
      footer: ({ table }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum, row) => sum + (Number(row.getValue("total_penyaluran")) || 0), 0))}
        </div>
      ),
    },
    {
      accessorKey: "sisa_pagu",
      header: () => <div className="text-center font-medium">Sisa Pagu</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {fmt(row.getValue("sisa_pagu"))}
        </div>
      ),
      footer: ({ table }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum, row) => sum + (Number(row.getValue("sisa_pagu")) || 0), 0))}
        </div>
      ),
    },
    {
      accessorKey: "prosentase",
      header: () => <div className="text-center font-medium">%</div>,
      cell: ({ row }) => {
        const val = Number(row.getValue("prosentase")) || 0;
        return (
          <div className="flex justify-center">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
              val >= 100 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              val >= 50  ? "bg-amber-100 text-amber-700 border-amber-200" :
                           "bg-rose-100 text-rose-700 border-rose-200"
            )}>
              {val}%
            </span>
          </div>
        );
      },
    },
    ...MONTHS.map((m) => ({
      accessorKey: m,
      header: () => <div className="text-center font-medium bg-muted/30 px-1">{m}</div>,
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {fmt(row.getValue(m))}
        </div>
      ),
      footer: ({ table }: any) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue(m)) || 0), 0))}
        </div>
      ),
    })),
  ], []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Hasil Data DAK Fisik</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingResults ? (
          <TableSkeleton rows={itemsPerPage} />
        ) : !showResults ? (
          <div className="border rounded-md">
            <div className="h-10 bg-muted/50 border-b flex items-center px-4">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                Data belum ditarik
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
              <Table2 className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">
                Silahkan Pilih Parameter dan klik &quot;Tayang&quot; untuk menampilkan hasil
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <DataTable
              columns={columns}
              data={tableData}
              initialPageSize={itemsPerPage}
              showFooter={true}
              emptyMessage="Tidak ada data yang ditampilkan."
              tableClassName="text-sm"
              onPaginationChange={(p) => {
                setCurrentPage(p.pageIndex + 1);
                setItemsPerPage(p.pageSize);
              }}
              controlledPagination={{
                pageIndex: currentPage - 1,
                pageSize: itemsPerPage,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
