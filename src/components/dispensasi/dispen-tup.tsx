"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/httpClient";
import { PlusSquare, Trash2, Download, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import RekamTup from "./rekam-tup";
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
import { Loading2 } from "../../layout/LoadingTable";

// Table styling - matching weekly-report pattern
const tableStyles = {
  headerCell: "h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap",
  headerCellCenter: "h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap",
  bodyCell: "px-4 py-3 text-sm align-middle border-b whitespace-nowrap",
  bodyCellCenter: "px-4 py-3 text-sm text-center align-middle border-b whitespace-nowrap",
};

interface DataTupProps {
  cek: number;
  id: string;
  where: string;
}

interface TupData {
  id: string;
  thang: string;
  kddept: string;
  kdunit: string;
  kdsatker: string;
  nmsatker: string;
  kdlokasi: string;
  kdkppn: string;
  tgpermohonan: string;
  nopermohonan: string;
  uraian: string;
  username: string;
  kdkanwil_upload: string;
  jumlah: number;
  nilaitup: number;
}

export default function DispenTup({ cek, id, where }: DataTupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TupData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [cekState, setCekState] = useState(false);
  const [idState, setIdState] = useState("");
  const [nomor, setNomor] = useState("");
  const [tahun, setTahun] = useState("");
  const [error2, setError2] = useState<string | null>(null);

  // States for Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetCount, setDeleteTargetCount] = useState(0);

  // Load data on initial mount (only when user is available)
  useEffect(() => {
    if (user) {
      getData();
    }
  }, [user]);

  // Reload data when filter changes (cek is now a counter)
  useEffect(() => {
    if (cek > 0 && user) {
      getData();
    }
  }, [cek, id, where, page, user]);

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
      `SELECT a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.username,a.kdkanwil_upload,a.jmltup jumlah,SUM(b.niltup) nilaitup FROM laporan_2023.dispensasi_tup a LEFT JOIN laporan_2023.dispensasi_tup_lampiran b ON a.id=b.id_dispensasi::integer  LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker=c.kdsatker  ${finalFilter ? `WHERE ${finalFilter}` : "  "
      }GROUP BY a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.username,a.kdkanwil_upload,a.jmltup ORDER BY a.id DESC`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encodedQuery2 = encodeURIComponent(
      `SELECT a.id,a.kddept,b.nmdept,a.thang,a.kdunit,c.nmunit,a.kdsatker,i.nmsatker,a.kdlokasi,e.nmlokasi,a.kdkanwil,g.nmkanwil,a.kdkppn,h.nmkppn,a.uraian,a.tgpermohonan,
                a.nopermohonan,a.tgpersetujuan,a.nopersetujuan,z.notup,z.tgtup,z.niltup,z.status,a.username,a.kdkanwil_upload
                FROM laporan_2023.dispensasi_tup a
                LEFT JOIN laporan_2023.dispensasi_tup_lampiran z ON a.id=z.id_dispensasi::integer
                LEFT JOIN dbref.t_dept_2025 b ON a.kddept=b.kddept
                LEFT JOIN dbref.t_unit_2025 c ON a.kddept=c.kddept AND a.kdunit=c.kdunit
                LEFT JOIN dbref.t_lokasi_2025 e ON a.kdlokasi=e.kdlokasi
                LEFT JOIN dbref.t_kanwil_2025 g ON a.kdkanwil=g.kdkanwil
                LEFT JOIN dbref.t_kppn_2025 h ON a.kdkppn=h.kdkppn
                LEFT JOIN dbref.t_satker_2025 i ON a.kdsatker=i.kdsatker  ${finalFilter ? `WHERE ${finalFilter}` : " "
      } ORDER BY a.kddept,a.kdsatker,a.id`
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: /dispensasi/:query?limit=10&page=0&user=username
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

  const handleRekamTup = async (
    id: string,
    nopermohonan: string,
    nmsatker: string,
    kdsatker: string,
    tahun: string
  ) => {
    setIdState(id);
    setNomor(nopermohonan);
    setNmsatker(nmsatker);
    setKdsatker(kdsatker);
    setShowModalRekam(true);
    setTahun(tahun);
  };

  const handleCloseModalSPM = () => {
    setShowModalRekam(false);
    getData();
  };

  const handleHapusDispTup = (id: string, jumlah: number) => {
    setDeleteTargetId(id);
    setDeleteTargetCount(jumlah);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_LOCAL_BASIC}disptup/delete/${deleteTargetId}`,
        {
          method: "DELETE",
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

  const handledownloadTup = async (id: string) => {
    const intId = parseInt(id, 10); // Pastikan ID adalah integer
    const fileUrl = `${process.env.NEXT_PUBLIC_LOCAL_BASIC}dispentup/download/${intId}`;

    try {
      const response = await fetch(fileUrl, {
        headers: {
          // Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Extract the filename from Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "Surat_Persetujuan_Dispen_TUP.pdf"; // Default filename

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      // Set the filename for download
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click(); // Trigger the download
      link.remove(); // Clean up the link element

      // Revoke the object URL to free up resources
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError2("Terjadi kesalahan saat mendownload file. Silakan coba lagi.");
      toast.error(error2 || "Terjadi kesalahan saat mendownload file.");
    }
  };

  return (
    <>
      {loading ? (
        <>
          <Loading2 />
          <br />
          <Loading2 />
          <br />
          <Loading2 />
        </>
      ) : (
        <>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className={tableStyles.headerCellCenter}>No.</th>
                    <th className={tableStyles.headerCellCenter}>TA</th>
                    <th className={tableStyles.headerCell}>Satker</th>
                    <th className={tableStyles.headerCell}>Tgl Permohonan</th>
                    <th className={tableStyles.headerCell}>Nomor Permohonan</th>
                    <th className={tableStyles.headerCellCenter}>Jumlah TUP</th>
                    <th className={tableStyles.headerCellCenter}>Opsi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-24 text-center text-muted-foreground">
                        Belum ada data dispensasi TUP
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
                        <td className={tableStyles.bodyCell}>
                          <div className="max-w-[300px] truncate" title={`${row.nmsatker?.trim()} (${row.kdsatker})`}>
                            {row.nmsatker?.trim()} ({row.kdsatker})
                          </div>
                        </td>
                        <td className={tableStyles.bodyCell}>
                          {row.tgpermohonan}
                        </td>
                        <td className={tableStyles.bodyCell}>
                          <div className="max-w-[280px] truncate" title={row.nopermohonan?.trim()}>
                            {row.nopermohonan?.trim()}
                          </div>
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          {row.jumlah ?? "-"}
                        </td>
                        <td className={tableStyles.bodyCellCenter}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Rekam TUP - hanya untuk non-KPPN */}
                            {user?.role !== "kppn" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
                                title="Rekam TUP"
                                onClick={() =>
                                  handleRekamTup(
                                    String(row.id),
                                    row.nopermohonan?.trim() || "",
                                    row.nmsatker?.trim() || "",
                                    row.kdsatker,
                                    row.thang
                                  )
                                }
                              >
                                <PlusSquare className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Hapus Dispensasi - hanya untuk non-KPPN */}
                            {user?.role !== "kppn" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                title="Hapus Dispensasi"
                                onClick={() =>
                                  handleHapusDispTup(
                                    String(row.id),
                                    row.jumlah ?? 0
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Download - untuk semua role */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                              title="Download Dokumen"
                              onClick={() => handledownloadTup(String(row.id))}
                            >
                              <Download className="h-4 w-4" />
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
      <RekamTup
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        tahun={tahun}
        id={idState}
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
                ? `Ada ${deleteTargetCount} TUP yang sudah direkam. Apakah Anda yakin ingin menghapus data ini?`
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
    </>
  );
}
