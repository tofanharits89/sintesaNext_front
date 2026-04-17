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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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
  totalCount,
  onPageChange,
  onPageSizeChange,
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
        header: () => <div className="text-center w-full">No</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground">
            {(currentPage - 1) * pageSize + row.index + 1}
          </div>
        ) ,
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
        header: () => <div className="text-center w-full">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="h-8 w-8 p-0 cursor-pointer"
              title="Edit Pengguna"
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id, row.original.name);
              }}
              className="h-8 w-8 p-0 cursor-pointer"
              title="Hapus Pengguna"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
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
                          "h-10 px-2 align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                          (header.id === "actions" || header.id === "number") ? "text-center" : "text-left",
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
                        className={cn(
                          "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                          (cell.column.id === "actions" || cell.column.id === "number") ? "text-center" : "text-left"
                        )}
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
        <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4 mt-2">
          {/* Left: Rows per page */}
          <div className="flex items-center space-x-2 order-2 md:order-1">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Center: Pagination */}
          <div className="flex items-center justify-center order-1 md:order-2 w-full md:w-auto">
            <Pagination className="mx-auto overflow-x-auto no-scrollbar justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={cn(
                      "cursor-pointer select-none",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {/* Page numbers logic */}
                {(() => {
                  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
                  const totalPage = pageCount;
                  const current = currentPage;
                  const items = [];

                  if (totalPage <= 7) {
                    for (let i = 1; i <= totalPage; i++) {
                      items.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={current === i}
                            onClick={() => onPageChange(i)}
                            className="cursor-pointer select-none"
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  } else {
                    // Always show first
                    items.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          isActive={current === 1}
                          onClick={() => onPageChange(1)}
                          className="cursor-pointer select-none"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );

                    if (current > 3) {
                      items.push(<PaginationEllipsis key="left-ellipsis" />);
                    }

                    // Middle pages
                    const start = Math.max(2, current - 1);
                    const end = Math.min(totalPage - 1, current + 1);

                    for (let i = start; i <= end; i++) {
                      items.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={current === i}
                            onClick={() => onPageChange(i)}
                            className="cursor-pointer select-none"
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    if (current < totalPage - 2) {
                      items.push(<PaginationEllipsis key="right-ellipsis" />);
                    }

                    // Always show last
                    items.push(
                      <PaginationItem key={totalPage}>
                        <PaginationLink
                          isActive={current === totalPage}
                          onClick={() => onPageChange(totalPage)}
                          className="cursor-pointer select-none"
                        >
                          {totalPage}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return items;
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
                      onPageChange(Math.min(pageCount, currentPage + 1));
                    }}
                    className={cn(
                      "cursor-pointer select-none",
                      currentPage >= Math.max(1, Math.ceil(totalCount / pageSize)) && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Right: Showing entries text */}
          <div className="text-sm text-muted-foreground whitespace-nowrap order-3 md:text-right">
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
