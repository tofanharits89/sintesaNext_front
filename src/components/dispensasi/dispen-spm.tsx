"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { PlusSquare, Trash2, Download, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import Rekam2 from "./rekam2";
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

// Styling untuk table dan kolom - matching weekly-report pattern
const tableStyles = {
  headerCell: "h-10 px-3 text-center align-middle font-medium whitespace-nowrap",
  headerCellCenter: "h-10 px-3 text-center align-middle font-medium whitespace-nowrap",
  bodyCell: "px-3 py-2 text-sm align-middle border-b",
  bodyCellCenter: "px-3 py-2 text-sm text-center align-middle border-b whitespace-nowrap",
};

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
  const [page, setPage] = useState(0);
  const limit = 15;
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [tahun, setTahun] = useState("");
  const [idRekam, setIdRekam] = useState("");
  const [nomor, setNomor] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [error2, setError2] = useState<string | null>(null);

  // States for Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetCount, setDeleteTargetCount] = useState(0);

  // Load data on initial mount and reload when filter/page changes
  useEffect(() => {
    if (user) {
      getData();
    }
  }, [user, cek, id, where, page]);

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

    const encodedQuery2 = encodeURIComponent(
      `SELECT a.id, a.kddept, b.nmdept, a.kdunit, c.nmunit, a.kdsatker, i.nmsatker, a.kdlokasi, e.nmlokasi, a.kdkanwil, g.nmkanwil, a.kdkppn,
  h.nmkppn, a.uraian, a.tgpermohonan, a.nopermohonan, a.kd_dispensasi, zz.nm_dispensasi, a.tgpersetujuan, a.nopersetujuan, z.nospm, z.tgspm,
  z.nilspm, z.nobast, z.tgbast, z.status
  FROM laporan_2023.dispensasi_spm a
  LEFT JOIN laporan_2023.dispensasi_spm_lampiran z ON a.id = z.id_dispensasi
  LEFT JOIN dbref.t_dept_2025 b ON a.kddept = b.kddept
  LEFT JOIN dbref.t_unit_2025 c ON a.kddept = c.kddept AND a.kdunit = c.kdunit
  LEFT JOIN dbref.t_lokasi_2025 e ON a.kdlokasi = e.kdlokasi
  LEFT JOIN dbref.t_kanwil_2025 g ON a.kdkanwil = g.kdkanwil
  LEFT JOIN dbref.t_kppn_2025 h ON a.kdkppn = h.kdkppn
  LEFT JOIN dbref.t_satker_2025 i ON a.kdsatker = i.kdsatker
  LEFT JOIN laporan_2023.ref_dispensasi zz ON a.kd_dispensasi = zz.kd_dispensasi
  ${finalFilter ? `WHERE ${finalFilter}` : ""}
  ORDER BY a.kddept, a.kdsatker, a.id`
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: /dispensasi/:query?limit=15&page=0&user=username
      const result = await apiClient.get<any>(
        `/dispensasi/${encryptedQuery}?limit=${limit}&page=${page}&user=${user?.username || ""}`
      );
      setData(result.result || []);
      setPages(result.totalPages || 0);
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

  const handleStatus = (status: boolean, total: number) => {
    // Export status handling removed - implement as needed
    console.log("Export status:", status, total);
  };

  const handleCloseModalSPM = () => {
    setShowModalRekam(false);
  };

  return (
    <div>
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-[8%]" />
                  <col className="w-[38%]" />
                  <col className="w-[12%]" />
                  <col className="w-[26%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead>
                  <tr className="border-b">
                    <th className={tableStyles.headerCellCenter}>No.</th>
                    <th className={tableStyles.headerCellCenter}>TA</th>
                    <th className={tableStyles.headerCell}>Satker</th>
                    <th className={tableStyles.headerCell}>Tgl Permohonan</th>
                    <th className={tableStyles.headerCell}>Nomor Permohonan</th>
                    <th className={tableStyles.headerCellCenter}>Jumlah SPM</th>
                    <th className={tableStyles.headerCellCenter}>Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-24 text-center text-muted-foreground">
                        Belum ada data dispensasi SPM
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className={tableStyles.bodyCellCenter}>
                          {index + 1 + page * limit}
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          {row.thang}
                        </td>
                        <td className={`${tableStyles.bodyCell} overflow-hidden`} title={`${row.nmsatker?.trim()} (${row.kdsatker})`}>
                          <span className="block truncate">{row.nmsatker?.trim()} ({row.kdsatker})</span>
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          {row.tgpermohonan}
                        </td>
                        <td className={`${tableStyles.bodyCell} overflow-hidden`} title={row.nopermohonan?.trim()}>
                          <span className="block truncate">{row.nopermohonan?.trim()}</span>
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          {row.jmlspm ?? "-"}
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          <div className="flex items-center justify-center gap-2">
                            {/* Rekam SPM - hanya untuk non-KPPN */}
                            {user?.role !== "kppn" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Rekam SPM"
                                onClick={() =>
                                  handleRekamSPM(
                                    String(row.id),
                                    row.nopermohonan?.trim() || "",
                                    row.nmsatker?.trim() || "",
                                    row.kdsatker,
                                    row.thang
                                  )
                                }
                              >
                                <PlusSquare className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}

                            {/* Hapus Dispensasi - hanya untuk non-KPPN */}
                            {user?.role !== "kppn" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Hapus Dispensasi"
                                onClick={() =>
                                  handleHapusDispSPM(
                                    String(row.id),
                                    row.jmlspm ?? 0
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}

                            {/* Download - untuk semua role */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Download Dokumen"
                              onClick={() => handledownload(String(row.id))}
                            >
                              <Download className="h-4 w-4 text-amber-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex items-center justify-between mt-4 mx-4">
              <span className="text-sm text-muted-foreground">
                Total: {rows.toLocaleString()}, Halaman {rows ? page + 1 : 0} dari {pages}
              </span>
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  <div className="flex items-center gap-1 text-sm">
                    <input
                      type="number"
                      min={1}
                      max={pages}
                      value={page + 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= pages) {
                          setPage(val - 1);
                        }
                      }}
                      className="w-14 h-8 text-center border rounded-md text-sm bg-zinc-100 dark:bg-black"
                    />
                    <span>/ {pages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pages - 1, page + 1))}
                    disabled={page === pages - 1}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
              <div className="w-48"></div>
            </div>
          )}
        </>
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
};;

export default DispenSPM;
