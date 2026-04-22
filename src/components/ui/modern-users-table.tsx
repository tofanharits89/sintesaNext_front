"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { User } from "@/lib/stores/users-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Pencil, Trash2, Search, FilterX, Users } from "lucide-react";
import kanwilData from "@/data/kdkanwil.json";
import kppnData from "@/data/kdkppn.json";
import { cn } from "@/lib/utils/utils";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";


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
  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value);
                onToggleSelectAll();
              }}
              aria-label="Select all"
              className="translate-y-[2px]"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={selected.has(row.original.id)}
              onCheckedChange={() => onToggleSelect(row.original.id)}
              aria-label="Select row"
              className="translate-y-[2px]"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      }),
      columnHelper.display({
        id: "number",
        header: () => <div className="text-center w-full">No</div>,
        cell: ({ row }) => (
          <div className="text-center font-medium text-muted-foreground">
            {row.index + 1 + (currentPage - 1) * pageSize}
          </div>
        ),
        enableSorting: false,
        size: 60,
      }),
      columnHelper.accessor("name", {
        header: () => <div className="text-center w-full">Nama Lengkap</div>,
        cell: ({ getValue }) => <div className="font-semibold text-zinc-900 dark:text-zinc-100">{getValue()}</div>,
        size: 200,
      }),
      columnHelper.accessor("username", {
        header: () => <div className="text-center w-full">Username</div>,
        cell: ({ getValue }) => (
          <div className="text-center">
            <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{getValue()}</code>
          </div>
        ),
        size: 150,
      }),
      columnHelper.accessor("email", {
        header: () => <div className="text-center w-full">Email</div>,
        cell: ({ getValue }) => <div className="text-muted-foreground">{getValue()}</div>,
        size: 200,
      }),
      columnHelper.accessor("role", {
        header: () => <div className="text-center w-full">Role</div>,
        cell: ({ getValue }) => {
          const role = getValue();
          const roleColors: Record<string, string> = {
            super_admin: "bg-rose-500 hover:bg-rose-600 text-white border-transparent",
            co_admin: "bg-amber-500 hover:bg-amber-600 text-white border-transparent",
            kantor_pusat: "bg-indigo-500 hover:bg-indigo-600 text-white border-transparent",
            ditpa: "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent",
            kanwil_djpb: "bg-blue-500 hover:bg-blue-600 text-white border-transparent",
            kppn: "bg-sky-500 hover:bg-sky-600 text-white border-transparent",
            lainnya: "bg-zinc-500 hover:bg-zinc-600 text-white border-transparent",
          };
          
          return (
            <div className="flex justify-center">
              <Badge className={cn("uppercase tracking-wider px-2.5 py-0.5", roleColors[role] || "bg-zinc-500 text-white border-transparent")}>
                {role.replaceAll("_", " ")}
              </Badge>
            </div>
          );
        },
        size: 150,
      }),
      columnHelper.display({
        id: "kanwil",
        header: () => <div className="text-center w-full">Kanwil</div>,
        cell: ({ row }) => {
          const kanwil = row.original.kdkanwil
            ? kanwilData.find((k) => k.kdkanwil === row.original.kdkanwil)
            : null;
          
          if (!kanwil) return <div className="text-center"><span className="text-muted-foreground italic">-</span></div>;
          
          return (
            <div className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] mx-auto text-center" title={kanwil.nmkanwil}>
              {kanwil.nmkanwil}
            </div>
          );
        },
        size: 160,
      }),
      columnHelper.display({
        id: "kppn",
        header: () => <div className="text-center w-full">KPPN</div>,
        cell: ({ row }) => {
          const kppn = row.original.kdkppn
            ? kppnData.find((k) => k.kdkppn === row.original.kdkppn)
            : null;
          
          if (!kppn) return <div className="text-center"><span className="text-muted-foreground italic">-</span></div>;
          
          return (
            <div className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] mx-auto text-center" title={kppn.nmkppn}>
              {kppn.nmkppn}
            </div>
          );
        },
        size: 160,
      }),

      columnHelper.accessor("limitKodeBA", {
        header: () => <div className="text-center w-full">Limit BA</div>,
        cell: ({ getValue }) => (
          <div className="font-mono text-center">
            {getValue() || "-"}
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor("status", {
        header: () => <div className="text-center w-full">Status</div>,
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <Badge
              variant={getValue() === "active" ? "success" : "destructive"}
              className="capitalize"
            >
              {getValue() === "active" ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        ),
        size: 100,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center w-full">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Edit Pengguna"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id, row.original.name);
              }}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Hapus Pengguna"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
        size: 100,
      }),
    ],
    [selected, onToggleSelect, onToggleSelectAll, onEdit, onDelete, currentPage, pageSize]
  );

  return (
    <div className="space-y-6">
      {/* Search & Filter Card */}
      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl font-semibold">Filter Pengguna</CardTitle>
            <ResetButton 
              onReset={() => {
                onSearchChange("");
                onRoleFilterChange("all");
                onStatusFilterChange("all");
              }} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari Pengguna</label>
              <InputGroup className="bg-zinc-100 dark:bg-black border-transparent transition-all">
                <InputGroupAddon align="inline-start">
                  <Search className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput 
                  placeholder="Nama, email, atau username..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full"
                />
              </InputGroup>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="w-full bg-zinc-100 dark:bg-black border-transparent">
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full bg-zinc-100 dark:bg-black border-transparent">
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
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardContent className="px-6 py-2">
          <DataTable
            columns={columns}
            data={users}
            controlledPagination={{
              pageIndex: currentPage - 1,
              pageSize: pageSize,
            }}
            onPaginationChange={(p) => {
              const newPage = p.pageIndex + 1;
              if (newPage !== currentPage) {
                onPageChange(newPage);
              }
              if (p.pageSize !== pageSize) {
                onPageSizeChange(p.pageSize);
              }
            }}
            footerInfoText={`Showing ${totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} entries`}
            tableClassName="text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
