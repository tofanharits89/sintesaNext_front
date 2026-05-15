"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { PlusSquare, Trash2, Download, AlertTriangle } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import Rekam2 from "./rekam2";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog";

interface DispenSpmProps {
  cek: number;
  id: string;
  where: string;
}

interface SpmData {
  id: string;
  thang: string;
  jmlspm: number;
  kddept: string;
  kdunit: string;
  kdsatker: string;
  nmsatker: string;
  kdlokasi: string;
  kdkppn: string;
  tgpermohonan: string;
  nopermohonan: string;
  uraian: string;
  kd_dispensasi: string;
}

const DispenSPM: React.FC<DispenSpmProps> = ({ cek, id, where }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SpmData[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rows, setRows] = useState(0);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [tahun, setTahun] = useState("");
  const [idRekam, setIdRekam] = useState("");
  const [nomor, setNomor] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");

  // States for Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetCount, setDeleteTargetCount] = useState(0);

  // Load data on initial mount and reload when filter/page changes
  useEffect(() => {
    if (user) {
      getData();
    }
  }, [user, cek, id, where, pagination.pageIndex, pagination.pageSize]);

  const getData = async () => {
    setLoading(true);

    let filterKanwil = "";
    if (user?.role === "kanwil_djpb") {
      filterKanwil =
        where + (where ? " AND " : "") + `a.kdkanwil = '${user.kdkanwil}'`;
    } else {
      filterKanwil = where;
    }

    let filterKppn = "";
    if (user?.role === "kppn") {
      filterKppn =
        where + (where ? " AND " : "") + `a.kdkppn = '${user.kdkppn}'`;
    } else {
      filterKppn = where;
    }

    // Menggabungkan filterKanwil dan filterKppn
    let combinedFilter = filterKanwil;
    if (user?.role === "kppn") {
      combinedFilter = filterKppn; // Gunakan filter KPPN jika role adalah kppn
    } else if (filterKanwil && filterKppn) {
      combinedFilter = `${filterKanwil} AND ${filterKppn}`; // Jika dua filter ada, gabungkan keduanya
    }

    // Ensure combinedFilter is not just an empty string if it's used in WHERE
    const finalFilter =
      combinedFilter && combinedFilter.trim() !== "" ? combinedFilter : null;

    const encodedQuery = encodeURIComponent(
      `SELECT a.id, a.thang, a.jmlspm, a.kddept, a.kdunit, a.kdsatker, c.nmsatker, a.kdlokasi, a.kdkppn, a.tgpermohonan, a.nopermohonan, a.uraian,
  a.kd_dispensasi
  FROM laporan_2023.dispensasi_spm a
  LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker = c.kdsatker
  ${finalFilter ? `WHERE ${finalFilter}` : ""}
  ORDER BY a.id DESC`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: /dispensasi/:query?limit=15&page=0&user=username
      const result = await apiClient.get<any>(
        `/dispensasi/${encryptedQuery}?limit=${pagination.pageSize}&page=${pagination.pageIndex}&user=${user?.username || ""}`
      );
      setData(result.result || []);
      setRows(result.totalRows || 0);
      setLoading(false);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleRekamSPM = (
    id: string,
    nopermohonan: string,
    nmsatker: string,
    kdsatker: string,
    tahun: string
  ) => {
    setIdRekam(id);
    setNomor(nopermohonan);
    setNmsatker(nmsatker);
    setKdsatker(kdsatker);
    setTahun(tahun);
    setShowModalRekam(true);
  };

  const handleHapusDispSPM = (id: string, jumlah: number) => {
    setDeleteTargetId(id);
    setDeleteTargetCount(jumlah);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        apiPath(`/dispensasi/dispspm/${deleteTargetId}`),
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            // Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Data telah dihapus.");
      getData();
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setShowDeleteDialog(false);
      setDeleteTargetId("");
      setDeleteTargetCount(0);
    }
  };

  const handledownload = async (id: string) => {
    const intId = parseInt(id, 10);
    const fileUrl = `/api/v1/dispensasi/download-spm/${intId}`;

    try {
      const response = await fetch(fileUrl, {
        credentials: "include",
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.msg) errMsg = errData.msg;
        } catch (e) {
          // ignore JSON parse error
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "Surat_Persetujuan_Dispen_SPM.pdf";

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mendownload file. Silakan coba lagi.");
    }
  };

  const handleCloseModalSPM = () => {
    setShowModalRekam(false);
  };

  const columns: ColumnDef<SpmData>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No.</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.index + 1 + pagination.pageIndex * pagination.pageSize}
        </div>
      ),
    },
    {
      accessorKey: "thang",
      header: () => <div className="text-center font-medium">TA</div>,
      cell: ({ row }) => <div className="text-center">{row.original.thang}</div>,
    },
    {
      accessorKey: "satker",
      header: () => <div className="text-center font-medium">Satker</div>,
      cell: ({ row }) => (
        <div
          className="text-left max-w-[360px] truncate"
          title={`${row.original.nmsatker?.trim()} (${row.original.kdsatker})`}
        >
          {row.original.nmsatker?.trim()} ({row.original.kdsatker})
        </div>
      ),
    },
    {
      accessorKey: "tgpermohonan",
      header: () => <div className="text-center font-medium">Tgl Permohonan</div>,
      cell: ({ row }) => <div className="text-center">{row.original.tgpermohonan}</div>,
    },
    {
      accessorKey: "nopermohonan",
      header: () => <div className="text-center font-medium">Nomor Permohonan</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[260px] truncate" title={row.original.nopermohonan?.trim()}>
          {row.original.nopermohonan?.trim()}
        </div>
      ),
    },
    {
      accessorKey: "jmlspm",
      header: () => <div className="text-center font-medium">Jumlah SPM</div>,
      cell: ({ row }) => <div className="text-center">{row.original.jmlspm ?? "-"}</div>,
    },
    {
      id: "aksi",
      header: () => <div className="text-center font-medium">Opsi</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {user?.role !== "kppn" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Rekam SPM"
              onClick={() =>
                handleRekamSPM(
                  String(row.original.id),
                  row.original.nopermohonan?.trim() || "",
                  row.original.nmsatker?.trim() || "",
                  row.original.kdsatker,
                  row.original.thang
                )
              }
            >
              <PlusSquare className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {user?.role !== "kppn" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Hapus Dispensasi"
              onClick={() =>
                handleHapusDispSPM(
                  String(row.original.id),
                  row.original.jmlspm ?? 0
                )
              }
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            title="Download Dokumen"
            onClick={() => handledownload(String(row.original.id))}
          >
            <Download className="h-4 w-4 text-amber-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          emptyMessage="Belum ada data dispensasi SPM"
          manualPagination={true}
          rowCount={rows}
          controlledPagination={pagination}
          onPaginationChange={setPagination}
        />
      )}

      <Rekam2
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        tahun={tahun}
        id={idRekam}
        nomor={nomor}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargetCount > 0
                ? `Ada ${deleteTargetCount} SPM yang sudah direkam. Apakah Anda yakin ingin menghapus data ini?`
                : "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={loading}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DispenSPM;
