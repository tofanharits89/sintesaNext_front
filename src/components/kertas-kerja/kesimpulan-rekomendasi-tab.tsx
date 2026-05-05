"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { KesimpulanRekomendasiModal } from "./modals/kesimpulan-rekomendasi-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";
import { useAuth } from "@/hooks/useAuth";
import { useKertasKerja } from "@/features/mbg/hooks/use-kertas-kerja";

interface KesimpulanRekomendasiTabProps {
  selectedYear: string;
}

export function KesimpulanRekomendasiTab({ selectedYear }: KesimpulanRekomendasiTabProps) {
  const [
    isKesimpulanRekomendasiModalOpen,
    setIsKesimpulanRekomendasiModalOpen,
  ] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Auth for role filtering
  const { user } = useAuth();

  // Fetch real data with role filtering
  const { data: response, isLoading, isError, error } = useKertasKerja(
    "kesimpulan-rekomendasi", 
    selectedYear,
    1,
    1000,
    user?.role,
    user?.kdkanwil
  );
  const kesimpulanRekomendasiData = Array.isArray(response?.data) ? response.data : [];

  const getValueCaseInsensitive = (item: any, targetKey: string) => {
    if (!item) return null;
    const lowerTarget = targetKey.toLowerCase();
    const actualKey = Object.keys(item).find(
      (key) => key.toLowerCase() === lowerTarget
    );
    return actualKey ? item[actualKey] : null;
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsKesimpulanRekomendasiModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      accessorKey: "tahun",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tahun</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {row.getValue("tahun") || getValueCaseInsensitive(row.original, "tahun")}
        </div>
      ),
    },
    {
      accessorKey: "nmkanwil",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kanwil</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {row.getValue("nmkanwil") || getValueCaseInsensitive(row.original, "nmkanwil")}
        </div>
      ),
    },
    {
      accessorKey: "triwulan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Triwulan</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {row.getValue("triwulan") || getValueCaseInsensitive(row.original, "triwulan")}
        </div>
      ),
    },
    {
      accessorKey: "kesimpulan",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kesimpulan</div>
      ),
      cell: ({ row }: any) => {
        const val = row.getValue("kesimpulan") || getValueCaseInsensitive(row.original, "kesimpulan");
        return (
          <div
            className="text-center max-w-[300px] truncate mx-auto"
            title={val}
          >
            {val}
          </div>
        );
      },
    },
    {
      accessorKey: "saran",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Rekomendasi</div>
      ),
      cell: ({ row }: any) => {
        const val = row.getValue("saran") || getValueCaseInsensitive(row.original, "saran");
        return (
          <div
            className="text-center max-w-[300px] truncate mx-auto"
            title={val}
          >
            {val}
          </div>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Update</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center text-sm">
          {formatDateTime(row.getValue("updatedAt") || getValueCaseInsensitive(row.original, "updatedAt"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg font-semibold">
              Data Kesimpulan & Rekomendasi
            </CardTitle>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
              {/* Action Button */}
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  setIsKesimpulanRekomendasiModalOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
              >
                Rekam
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto min-h-[400px] relative">
            {isLoading ? (
              <TableSkeleton />
            ) : isError ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-500">
                Error: {(error as any)?.message || "Failed to fetch data"}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={kesimpulanRekomendasiData.map((item: any, index: number) => ({
                  ...item,
                  no: index + 1,
                }))}
                initialPageSize={25}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <KesimpulanRekomendasiModal
        open={isKesimpulanRekomendasiModalOpen}
        onOpenChange={(open) => {
          setIsKesimpulanRekomendasiModalOpen(open);
          if (!open) setSelectedItem(null);
        }}
        data={selectedItem}
        onSave={() => {
          setIsKesimpulanRekomendasiModalOpen(false);
          setSelectedItem(null);
        }}
      />
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        data={selectedItem}
        title="Hapus Data Kesimpulan & Rekomendasi"
        description="Apakah Anda yakin ingin menghapus data kesimpulan & rekomendasi ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          console.log("Deleting kesimpulan & rekomendasi item:", selectedItem);
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
