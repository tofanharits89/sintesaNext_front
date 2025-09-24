"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

export interface SupplierContractsTableProps {
  rows?: any[];
  loading?: boolean;
}

function formatIDR(n?: number) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

export function SupplierContractsTable({ rows = [], loading = false }: SupplierContractsTableProps) {
  const columns = React.useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        id: "rowNumber",
        header: () => <span>NO</span>,
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination?.pageIndex ?? 0;
          const pageSize = table.getState().pagination?.pageSize ?? 10;
          // Use the same row model used for rendering to ensure consistent indexing per page
          const currentPageRows = table.getRowModel().rows;
          const posInPage = Math.max(0, currentPageRows.findIndex((r) => r.id === row.id));
          const no = pageIndex * pageSize + posInPage + 1;
          return <span className="text-xs text-muted-foreground">{no}</span>;
        },
        enableSorting: false,
        size: 60,
      },
      {
        id: "JENIS_KONTRAK",
        accessorFn: (r) => r?.JENIS_KONTRAK ?? r?.jenis_kontrak ?? "",
        header: ({ column }) => (
          <button
            className="font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            JENIS_KONTRAK
          </button>
        ),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-sm">{String(getValue() || "-")}</span>,
      },
      {
        id: "NOMOR_KONTRAK",
        accessorFn: (r) => r?.NOMOR_KONTRAK ?? r?.nomor_kontrak ?? "",
        header: ({ column }) => (
          <button
            className="font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NOMOR_KONTRAK
          </button>
        ),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-sm">{String(getValue() || "-")}</span>,
      },
      {
        id: "URAIAN_KONTRAK",
        accessorFn: (r) => r?.URAIAN_KONTRAK ?? r?.uraian_kontrak ?? "",
        header: ({ column }) => (
          <button
            className="font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            URAIAN_KONTRAK
          </button>
        ),
        cell: ({ getValue }) => <span className="text-sm min-w-[240px] inline-block">{String(getValue() || "-")}</span>,
      },
      {
        id: "NILAI_KONTRAK",
        accessorFn: (r) => Number(r?.NILAI_KONTRAK ?? r?.nilai_kontrak ?? 0),
        header: ({ column }) => (
          <button
            className="font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NILAI_KONTRAK
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-right w-full block text-sm font-medium">{formatIDR(Number(getValue() || 0))}</span>
        ),
        sortingFn: "auto",
      },
      {
        id: "NILAI_SPM",
        accessorFn: (r) => Number(r?.NILAI_SPM ?? r?.nilai_spm ?? 0),
        header: ({ column }) => (
          <button
            className="font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NILAI_SPM
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-right w-full block text-sm font-medium">{formatIDR(Number(getValue() || 0))}</span>
        ),
        sortingFn: "auto",
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">List Kontrak</CardTitle>
        <div className="text-xs text-muted-foreground">Kontrak yang dikelola oleh supplier ini</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`skel-${i}`} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            initialPageSize={20}
            footerInfoText={`Total Kontrak : ${rows.length.toLocaleString("id-ID")} Kontrak`}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default SupplierContractsTable;
