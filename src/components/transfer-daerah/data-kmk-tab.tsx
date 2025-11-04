"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Scissors, PauseCircle, Undo2 } from "lucide-react";
import { PdfjsViewerIframeModal } from "./modals/pdfjs-viewer-iframe-modal";
import { DataKmkModal } from "./modals/data-kmk-modal";
import { PencabutanModal } from "./modals/pencabutan-modal";
import { DataPencabutanModal } from "./modals/data-pencabutan-modal";
import { DataPenundaanModal } from "./modals/data-penundaan-modal";
import { DataPemotonganModal } from "./modals/data-pemotongan-modal";
import { DeleteConfirmModal } from "./modals/delete-confirm-modal";
import { useKmkDau } from "@/hooks/use-kmk-dau";
import { apiPath } from "@/lib/config/base-path";
import { getAuthTokenFromCookie } from "@/lib/utils/cookieManager";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

interface DataKmkTabProps {
  // Remove the selectedYear prop as this tab will manage its own year state
}

// Data is now fetched from backend via useKmkDau

export function DataKmkTab({}: DataKmkTabProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isDataKmkModalOpen, setIsDataKmkModalOpen] = useState(false);
  const [isPencabutanModalOpen, setIsPencabutanModalOpen] = useState(false);
  const [isDataPenundaanModalOpen, setIsDataPenundaanModalOpen] =
    useState(false);
  const [isDataPemotonganModalOpen, setIsDataPemotonganModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDataPencabutanModalOpen, setIsDataPencabutanModalOpen] = useState(false);
  const [selectedNoKmkForPencabutan, setSelectedNoKmkForPencabutan] = useState<string | undefined>(undefined);
  const { rows, isLoading, error, mutate } = useKmkDau(selectedYear);

  // Generate years from current year back to 2020
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  const fallbackAttemptedRef = useRef(false);

  useEffect(() => {
    if (fallbackAttemptedRef.current) {
      return;
    }
    if (!isLoading && rows.length === 0 && selectedYear === currentYear.toString()) {
      const fallbackYear = years.find((year) => year !== selectedYear);
      if (fallbackYear) {
        fallbackAttemptedRef.current = true;
        setSelectedYear(fallbackYear);
      }
    }
  }, [rows, isLoading, selectedYear, currentYear, years]);

  const handleDataPotongan = (item: any) => {
    setSelectedItem(item);
    const jenis = String(item?.jenis ?? "");
    if (jenis === "1" || jenis === "4") {
      setIsDataPemotonganModalOpen(true);
    } else if (jenis === "2" || jenis === "3") {
      setIsDataPenundaanModalOpen(true);
    } else {
      // default to penundaan to be safe
      setIsDataPenundaanModalOpen(true);
    }
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // PDF Preview modal state
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfTitle, setPdfTitle] = useState<string | undefined>(undefined);

  const handleOpenPreview = (fileUrl: string, title?: string) => {
    if (!fileUrl) return;
    setPdfUrl(fileUrl);
    setPdfTitle(title);
    setIsPdfOpen(true);
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
        <div className="text-center">{row.getValue("tahun")}</div>
      ),
    },
    {
      accessorKey: "tanggalKmk",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Tanggal KMK</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center">
          {new Date(row.getValue("tanggalKmk")).toLocaleDateString("id-ID")}
        </div>
      ),
    },
    {
      accessorKey: "nomorKmk",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Nomor KMK</div>
      ),
      cell: ({ row }: any) => (
        <div className="text-center font-medium">
          {row.getValue("nomorKmk")}
        </div>
      ),
    },
    {
      accessorKey: "uraian",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Uraian</div>
      ),
      cell: ({ row }: any) => (
        <div
          className="text-center max-w-[320px] truncate mx-auto"
          title={row.getValue("uraian")}
        >
          {row.getValue("uraian")}
        </div>
      ),
    },
    {
      accessorKey: "jenis",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Jenis KMK</div>
      ),
      cell: ({ row }: any) => {
        const jenisCode = row.getValue("jenis");
        const nmjenis = row.original?.nmjenis || "";
        const getJenisBadgeClasses = (code: string) => {
          // Soft red for Potongan (1,4), soft blue for Penundaan/Cabut (2,3)
          if (code === "1" || code === "4") {
            return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
          }
          return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        };
        const displayText = nmjenis ? nmjenis : `Kode ${jenisCode}`;
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={getJenisBadgeClasses(jenisCode)}
              title={displayText}
            >
              <span className="truncate">
                {displayText}
              </span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "kriteria",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Kriteria KMK</div>
      ),
      cell: ({ row }: any) => {
        const kriteria = row.getValue("kriteria");
        const jenisCode = String(row.original?.jenis ?? "");
        const classes =
          jenisCode === "1" || jenisCode === "4"
            ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
            : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={classes} title={kriteria}>
              <span className="truncate">{kriteria}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "fileUrl",
      header: ({ column }: any) => (
        <div className="text-center font-medium">File</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPreview(row.getValue("fileUrl"), row.original?.fileName || undefined)}
            className="h-8 w-8 p-0"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      id: "data-actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Data</div>
      ),
      cell: ({ row }: any) => {
        // Get jenis from the jenis column - same as Kriteria column does
        const jenis = String(row.original?.jenis ?? "");
        
        return (
          <div className="flex items-center justify-center gap-2">
            {/* Data Pemotongan (jenis 1 atau 4) */}
            {(jenis === "1" || jenis === "4") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                onClick={() => {
                  setSelectedItem(row.original);
                  setIsDataPemotonganModalOpen(true);
                }}
                title="Data Pemotongan"
              >
                <Scissors className="h-4 w-4" />
              </Button>
            )}

            {/* Data Penundaan (jenis 2 atau 3) */}
            {(jenis === "2" || jenis === "3") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setSelectedItem(row.original);
                  setIsDataPenundaanModalOpen(true);
                }}
                title="Data Penundaan"
              >
                <PauseCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Data Pencabutan (hanya untuk jenis = 2) */}
            {jenis === "2" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setSelectedNoKmkForPencabutan(
                    row.original?.nomorKmk || row.original?.no_kmk || row.getValue?.("nomorKmk")
                  );
                  setIsDataPencabutanModalOpen(true);
                }}
                title="Data Pencabutan"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: ({ column }: any) => (
        <div className="text-center font-medium">Aksi</div>
      ),
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
          {/* Delete only */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            onClick={() => handleDelete(row.original)}
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
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
            <CardTitle className="text-lg font-semibold">Data KMK</CardTitle>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">
                  Tahun:
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsDataKmkModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
                >
                  Data KMK
                </Button>
                <Button
                  onClick={() => setIsPencabutanModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white min-w-[100px] h-10 flex-1 sm:flex-initial"
                >
                  Pencabutan
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600 mb-2">
              {String((error as any).message || error)}
            </div>
          ) : null}
          {isLoading ? (
            <div className="text-sm text-muted-foreground">
              Memuat data KMK...
            </div>
          ) : (
            <DataTable columns={columns} data={rows} />
          )}
        </CardContent>
      </Card>
      <DataKmkModal
        open={isDataKmkModalOpen}
        onOpenChange={setIsDataKmkModalOpen}
        initialYear={selectedYear}
        onCreated={async () => {
          // Invalidate and refetch KMK DAU list immediately
          await queryClient.invalidateQueries({ 
            queryKey: ["kmk-dau", selectedYear],
            refetchType: 'active'
          });
          // Force immediate refetch
          await mutate();
        }}
      />
      <PencabutanModal
        open={isPencabutanModalOpen}
        onOpenChange={setIsPencabutanModalOpen}
      />
      <DataPenundaanModal
        open={isDataPenundaanModalOpen}
        onOpenChange={setIsDataPenundaanModalOpen}
        data={selectedItem}
      />
      <DataPemotonganModal
        open={isDataPemotonganModalOpen}
        onOpenChange={setIsDataPemotonganModalOpen}
        data={selectedItem}
      />
      <DataPencabutanModal
        open={isDataPencabutanModalOpen}
        onOpenChange={setIsDataPencabutanModalOpen}
        noKmk={selectedNoKmkForPencabutan ?? ""}
      />
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        data={selectedItem}
        onConfirm={async () => {
          try {
            const id = selectedItem?.id;
            if (!id) throw new Error("ID tidak ditemukan");
            const headersWithCsrf: HeadersInit = addCsrfToHeaders({ "Content-Type": "application/json" });
            
const resp = await fetch(apiPath(`/transfer-daerah/dau/kmk/${encodeURIComponent(String(id))}`), {
              method: "DELETE",
              headers: headersWithCsrf,
              credentials: "include",
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            // Invalidate and refetch
            await queryClient.invalidateQueries({ 
              queryKey: ["kmk-dau", selectedYear],
              refetchType: 'active'
            });
            await mutate();
          } catch (e) {
            console.error("Delete failed", e);
            alert(`Gagal menghapus data: ${String((e as any)?.message || e)}`);
          }
        }}
      />

      {/* PDF.js Viewer (iframe) Modal */}
      <PdfjsViewerIframeModal
        open={isPdfOpen}
        onOpenChange={setIsPdfOpen}
        url={pdfUrl ?? ""}
        title={pdfTitle || "Pratinjau KMK"}
      />
    </div>
  );
}

export default DataKmkTab;
