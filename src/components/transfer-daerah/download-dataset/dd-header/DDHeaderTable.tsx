"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Table2 } from "lucide-react";
import { DDHeaderData, DDHeaderTableProps } from "./types";

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const DDHeaderTable: React.FC<DDHeaderTableProps> = ({
  tableData,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loadingResults = false,
}) => {
  const columns = useMemo<ColumnDef<DDHeaderData>[]>(() => [
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
      accessorKey: "kdkanwil",
      header: () => <div className="text-center font-medium">Kanwil</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdkanwil")}</div>,
    },
    {
      accessorKey: "nmkanwil",
      header: () => <div className="text-center font-medium">Nama Kanwil</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmkanwil")}>
          {row.getValue("nmkanwil")}
        </div>
      ),
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
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmkppn")}>
          {row.getValue("nmkppn")}
        </div>
      ),
    },
    {
      accessorKey: "kdlokasi",
      header: () => <div className="text-center font-medium">Lokasi</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kdlokasi")}</div>,
    },
    {
      accessorKey: "nmkabkota",
      header: () => <div className="text-center font-medium">Nama Pemda</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmkabkota")}>
          {row.getValue("nmkabkota") || "-"}
        </div>
      ),
      footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
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
    ...months.map((month) => ({
      accessorKey: month,
      header: () => <div className="text-center font-medium">{month.slice(0, 3)}</div>,
      cell: ({ row }: any) => (
        <div className="text-right font-mono tabular-nums pr-2">
          {fmt(row.getValue(month))}
        </div>
      ),
      footer: ({ table }: any) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum: number, row: any) => sum + (Number(row.getValue(month)) || 0), 0))}
        </div>
      ),
    })),
    {
      accessorKey: "total_nilai",
      header: () => <div className="text-center font-medium">Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-semibold">
          {fmt(row.getValue("total_nilai"))}
        </div>
      ),
      footer: ({ table }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum, row) => sum + (Number(row.getValue("total_nilai")) || 0), 0))}
        </div>
      ),
    },
  ], []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Hasil Data Dana Desa</CardTitle>
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
