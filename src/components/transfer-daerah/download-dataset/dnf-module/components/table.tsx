"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Table2 } from "lucide-react";
import { TpgData, BosBopData } from "../dnf-types";

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n || 0);

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

/* ─────────────────────────────────────────────
   TableTPG
───────────────────────────────────────────── */

interface TableTPGProps {
  data: TpgData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  loading?: boolean;
}

export const TableTPG: React.FC<TableTPGProps> = ({
  data,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<TpgData>[]>(() => [
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
      accessorKey: "nm_periode",
      header: () => <div className="text-center font-medium">Periode</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("nm_periode")}</div>,
    },
    {
      accessorKey: "kode_kanwil",
      header: () => <div className="text-center font-medium">Kanwil</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kode_kanwil")}</div>,
    },
    {
      accessorKey: "nm_kanwil",
      header: () => <div className="text-center font-medium">Nama Kanwil</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nm_kanwil")}>
          {row.getValue("nm_kanwil")}
        </div>
      ),
    },
    {
      accessorKey: "kppn",
      header: () => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }) => <div className="text-center font-mono">{row.getValue("kppn")}</div>,
    },
    {
      accessorKey: "nm_kppn",
      header: () => <div className="text-center font-medium">Nama KPPN</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nm_kppn")}>
          {row.getValue("nm_kppn")}
        </div>
      ),
    },
    {
      accessorKey: "nm_lokasi",
      header: () => <div className="text-center font-medium">Lokasi</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("nm_lokasi")}</div>,
      footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
    },
    {
      accessorKey: "jenis_tkd",
      header: () => <div className="text-center font-medium">Jenis TKD</div>,
      cell: ({ row }) => <div className="text-left whitespace-nowrap">{row.getValue("jenis_tkd")}</div>,
    },
    ...MONTHS.map((month, i) => ({
      accessorKey: month,
      header: () => <div className="text-center font-medium bg-muted/30 px-1">{SHORT_MONTHS[i]}</div>,
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
      accessorKey: "total_setahun",
      header: () => <div className="text-center font-medium">Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-semibold">
          {fmt(row.getValue("total_setahun"))}
        </div>
      ),
      footer: ({ table }) => (
        <div className="text-right font-mono tabular-nums pr-2 font-bold">
          {fmt(table.getFilteredRowModel().rows.reduce((sum, row) => sum + (Number(row.getValue("total_setahun")) || 0), 0))}
        </div>
      ),
    },
  ], []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Hasil Data TPG</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
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
              data={data}
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

/* ─────────────────────────────────────────────
   TableBosBop
───────────────────────────────────────────── */

interface TableBosBopProps {
  data: BosBopData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  loading?: boolean;
}

export const TableBosBop: React.FC<TableBosBopProps> = ({
  data,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<BosBopData>[]>(() => [
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
      accessorKey: "nmkabkota_kppn",
      header: () => <div className="text-center font-medium">Nama KPPN</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmkabkota_kppn")}>
          {row.getValue("nmkabkota_kppn")}
        </div>
      ),
    },
    {
      accessorKey: "nmprogram",
      header: () => <div className="text-center font-medium">Program</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("nmprogram")}</div>,
    },
    {
      accessorKey: "jenjang",
      header: () => <div className="text-center font-medium">Jenjang</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("jenjang")}</div>,
    },
    {
      accessorKey: "status_sekolah",
      header: () => <div className="text-center font-medium">Status</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("status_sekolah")}</div>,
    },
    {
      accessorKey: "jenis_bos",
      header: () => <div className="text-center font-medium">Jenis BOS</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.getValue("jenis_bos")}</div>,
    },
    {
      accessorKey: "nmkabkota_sekolah",
      header: () => <div className="text-center font-medium">Lokasi</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[180px] truncate" title={row.getValue("nmkabkota_sekolah")}>
          {row.getValue("nmkabkota_sekolah")}
        </div>
      ),
      footer: () => <div className="text-center font-bold">GRAND TOTAL</div>,
    },
    ...MONTHS.map((month, i) => ({
      accessorKey: month,
      header: () => <div className="text-center font-medium bg-muted/30 px-1">{SHORT_MONTHS[i]}</div>,
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
        <CardTitle className="text-base font-semibold">Hasil Data BOS / BOP</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
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
              data={data}
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
