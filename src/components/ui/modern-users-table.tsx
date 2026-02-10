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
import { User } from "@/lib/stores/users-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import kanwilData from "@/data/kdkanwil.json";
import kppnData from "@/data/kdkppn.json";
import { cn } from "@/lib/utils/utils";

interface ModernUsersTableProps {
  users: User[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string, userName: string) => void;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
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
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
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
        header: "No",
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground">
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
              className="-ml-4 h-8 data-[state=open]:bg-accent"
            >
              Nama Lengkap
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div className="font-medium">
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
              className="-ml-4 h-8 data-[state=open]:bg-accent"
            >
              Username
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div className="font-mono text-sm">
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
              className="-ml-4 h-8 data-[state=open]:bg-accent"
            >
              Email
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ getValue }) => (
          <div>
            {getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: ({ getValue }) => (
          <div className="capitalize">
            {getValue().replaceAll("_", " ")}
          </div>
        ),
        enableSorting: false,
        size: 150,
      }),
      columnHelper.display({
        id: "kanwil",
        header: "Kanwil",
        cell: ({ row }) => {
          const kanwil = row.original.kdkanwil
            ? kanwilData.find((k) => k.kdkanwil === row.original.kdkanwil)
            : null;
          return (
            <div>
              {kanwil?.nmkanwil ?? "-"}
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      }),
      columnHelper.display({
        id: "kppn",
        header: "KPPN",
        cell: ({ row }) => {
          const kppn = row.original.kdkppn
            ? kppnData.find((k) => k.kdkppn === row.original.kdkppn)
            : null;
          return (
            <div>
              {kppn?.nmkppn ?? "-"}
            </div>
          );
        },
        enableSorting: false,
        size: 150,
      }),
      columnHelper.accessor("limitKodeBA", {
        header: "Limit BA",
        cell: ({ getValue }) => (
          <div className="font-mono">
            {getValue() ?? "-"}
          </div>
        ),
        enableSorting: false,
        size: 100,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge
            variant={getValue() === "active" ? "success" : "destructive"}
          >
            {getValue() === "active" ? <span className="font-bold">Aktif</span> : "Nonaktif"}
          </Badge>
        ),
        enableSorting: false,
        size: 100,
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
              aria-label="Edit pengguna"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id, row.original.name);
              }}
              className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
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
    <Card>
      <CardContent className="px-6 py-2">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              className="h-9 max-w-xl"
              placeholder="Cari nama, email, atau peran"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="h-9 min-w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="co_admin">Co-Admin</SelectItem>
                  <SelectItem value="kantor_pusat">Kantor Pusat</SelectItem>
                  <SelectItem value="ditpa">DIT PA</SelectItem>
                  <SelectItem value="kanwil_djpb">Kanwil DJPb</SelectItem>
                  <SelectItem value="kppn">KPPN</SelectItem>
                  <SelectItem value="lainnya">User Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="h-9 min-w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="disabled">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="rounded-md border">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          "h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
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
              <div className="text-muted-foreground">
                Tidak ada data yang ditemukan
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
