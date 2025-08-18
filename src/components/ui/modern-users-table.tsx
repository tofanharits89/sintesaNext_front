"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { User } from "@/lib/users-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import kanwilData from "@/data/kdkanwil.json";
import kppnData from "@/data/kdkppn.json";
import { cn } from "@/lib/utils";

interface ModernUsersTableProps {
  users: User[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string, userName: string) => void;
  currentPage: number;
  pageSize: number;
}

const columnHelper = createColumnHelper<User>();

export function ModernUsersTable({
  users,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  currentPage,
  pageSize,
}: ModernUsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              onToggleSelectAll();
            }}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.id)}
            onCheckedChange={() => onToggleSelect(row.original.id)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      }),
      columnHelper.display({
        id: "number",
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">NO</div>
        ),
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground text-xs">
            {(currentPage - 1) * pageSize + row.index + 1}
          </div>
        ),
        enableSorting: false,
        size: 60,
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3 hover:bg-slate-100 dark:hover:bg-slate-700 w-full justify-center"
            >
              <span className="text-[10px] font-semibold uppercase">NAMA LENGKAP</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-2.5 w-2.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-2.5 w-2.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-2.5 w-2.5" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div className="font-medium text-slate-900 dark:text-slate-100 text-center">
            {getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor("username", {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3 hover:bg-slate-100 dark:hover:bg-slate-700 w-full justify-center"
            >
              <span className="text-[10px] font-semibold uppercase">USERNAME</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-2.5 w-2.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-2.5 w-2.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-2.5 w-2.5" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div className="font-mono text-xs text-slate-700 dark:text-slate-300 text-center">
            {getValue()}
          </div>
        ),
        size: 150,
      }),
      columnHelper.accessor("email", {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3 hover:bg-slate-100 dark:hover:bg-slate-700 w-full justify-center"
            >
              <span className="text-[10px] font-semibold uppercase">EMAIL</span>
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-2.5 w-2.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-2.5 w-2.5" />
              ) : (
                <ArrowUpDown className="ml-2 h-2.5 w-2.5" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
            {getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor("role", {
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">ROLE</div>
        ),
        cell: ({ getValue }) => (
          <div className="capitalize text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
            {getValue().replaceAll("_", " ")}
          </div>
        ),
        enableSorting: false,
        size: 150,
      }),
      columnHelper.display({
        id: "kanwil",
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">KANWIL</div>
        ),
        cell: ({ row }) => {
          const kanwil = row.original.kdkanwil
            ? kanwilData.find((k) => k.kdkanwil === row.original.kdkanwil)
            : null;
          return (
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
              {kanwil?.nmkanwil ?? "-"}
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      }),
      columnHelper.display({
        id: "kppn",
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">KPPN</div>
        ),
        cell: ({ row }) => {
          const kppn = row.original.kdkppn
            ? kppnData.find((k) => k.kdkppn === row.original.kdkppn)
            : null;
          return (
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
              {kppn?.nmkppn ?? "-"}
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      }),
      columnHelper.accessor("limitKodeBA", {
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">LIMIT BA</div>
        ),
        cell: ({ getValue }) => (
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 text-center">
            {getValue() ?? "-"}
          </div>
        ),
        enableSorting: false,
        size: 100,
      }),
      columnHelper.accessor("status", {
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">STATUS</div>
        ),
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <Badge
              className={cn(
                "font-medium",
                getValue() === "active"
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
              )}
            >
              {getValue() === "active" ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        ),
        enableSorting: false,
        size: 100,
      }),

      columnHelper.display({
        id: "actions",
        header: () => (
          <div className="text-[10px] font-semibold uppercase text-center">AKSI</div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
              className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              aria-label="Edit pengguna"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row.original.id, row.original.name)}
              className="h-8 w-8 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              aria-label="Hapus pengguna"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 100,
      }),
    ],
    [selected, onToggleSelect, onToggleSelectAll, onEdit, onDelete, currentPage, pageSize]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3 text-center text-[10px] font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors duration-150 ease-in-out hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  index % 2 === 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/50 dark:bg-slate-800/20"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-xs"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-500 dark:text-slate-400">
            Tidak ada data yang ditemukan
          </div>
        </div>
      )}
    </div>
  );
}