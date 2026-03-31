"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import moment from "moment";
import { PlusSquare, Trash2, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import Rekam from "./modal-rekam";
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
import RekamKontrak from "./modal-rekam-kontrak";
import GenerateCSV from "@/components/GenerateCSV";
import { apiPath } from "@/lib/config/base-path";

// Table styling - matching dispensasi/llat pattern
const tableStyles = {
  headerCell: "h-10 px-3 text-center align-middle font-medium whitespace-nowrap",
  headerCellCenter: "h-10 px-3 text-center align-middle font-medium whitespace-nowrap",
  bodyCell: "px-3 py-2 text-sm align-middle border-b",
  bodyCellCenter: "px-3 py-2 text-sm text-center align-middle border-b whitespace-nowrap",
};

interface DispensasiData {
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
  kd_dispensasi: string;
  uraian: string;
  nmkppn: string;
  jmlkontrak: number;
}

interface DataDispensasiKPPNProps {
  isRekamOpen?: boolean;
  onRekamClose?: () => void;
  onDownload?: () => void;
  isExporting?: boolean;
  onExportComplete?: () => void;
}

const DataDispensasiKPPN: React.FC<DataDispensasiKPPNProps> = ({ isRekamOpen = false, onRekamClose, onDownload, isExporting = false, onExportComplete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState("");
  const [nomor, setNomor] = useState("");
  const [data, setData] = useState<DispensasiData[]>([]);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [kdkppn, setKdkppn] = useState("");
  const [cek, setCek] = useState(false);
  const [where, setWhere] = useState("");
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState(false);

  // States for Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetCount, setDeleteTargetCount] = useState(0);
  const [deleteTargetKdsatker, setDeleteTargetKdsatker] = useState("");
  const [deleteTargetKppn, setDeleteTargetKppn] = useState("");

  // Unused state removed: showModalFilter

  const handleCek = () => {
    setCek(true);
  };

  useEffect(() => {
    if (user) {
      getData();
    }
  }, [page, where, user]);

  const getData = async () => {
    setLoading(true);
    let filterKppn = "";
    if (user?.role === "kppn") {
      filterKppn =
        where + (where ? " AND " : "") + `a.kdkppn = '${user.kdkppn}'`;
    } else if (user?.role === "kanwil_djpb") {
      filterKppn =
        where + (where ? " AND " : "") + `a.kdlokasi = '${user.kdkanwil}'`;
    } else {
      filterKppn = where;
    }

    const encodedQuery = encodeURIComponent(
      `SELECT a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan, a.nopermohonan,
      a.kd_dispensasi,a.uraian,b.nmkppn,a.jmlkontrak 
      FROM laporan_2023.dispensasi_kppn a 
      left join dbref.t_kppn_2025 b on a.kdkppn=b.kdkppn
      LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker=c.kdsatker  ${filterKppn ? `WHERE ${filterKppn}` : "  "
      }
        GROUP BY a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan, a.nopermohonan,
      a.kd_dispensasi,a.uraian,b.nmkppn,a.jmlkontrak ORDER BY id DESC`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    const encodedQuery2 = encodeURIComponent(
      ` SELECT a.thang,
        a.jenis,
         CASE 
            WHEN a.jenis = '01' THEN '01 - Kontrak'
            WHEN a.jenis = '02' THEN '02 - Adendum Kontrak'
            ELSE 'Lainnya'
        END AS uraianjenis,
        a.kddept,
        d.nmdept,
        a.kdunit,
        e.nmunit,
        a.kdkppn,
        b.nmkppn,
        a.kdsatker,
        c.nmsatker,
        a.kdlokasi,
        f.nmlokasi,
        a.tgpermohonan, 
        a.nopermohonan,a.tgpersetujuan,a.nopersetujuan,a.uraian AS keterangan,
        g.nokontrak,g.tgkontrak,g.nilkontrak,
        a.kd_dispensasi,
        CASE 
            WHEN a.kd_dispensasi = '01' THEN '01 - Kendala pada aplikasi'
            WHEN a.kd_dispensasi = '02' THEN '02 - Kendala pada pejabat perbendaharaan'
            WHEN a.kd_dispensasi = '03' THEN '03 - Kendala pada penyedia barang/jasa'
            WHEN a.kd_dispensasi = '04' THEN '04 - Kendala administrasi (dokumen kurang lengkap)'
            WHEN a.kd_dispensasi = '05' THEN '05 - Kendala pada revisi DIPA/MP PNBP'
            WHEN a.kd_dispensasi = '06' THEN '06 - Kendala jaringan dan listrik'
            ELSE 'Lainnya'
        END AS uraian,
        a.jmlkontrak 
    FROM 
        laporan_2023.dispensasi_kppn a 
    LEFT JOIN 
        dbref.t_kppn_2025 b ON a.kdkppn = b.kdkppn 
    LEFT JOIN 
        dbref.t_satker_2025 c ON a.kdsatker = c.kdsatker 
    LEFT JOIN 
        dbref.t_dept_2025 d ON a.kddept = d.kddept
    LEFT JOIN 
        dbref.t_unit_2025 e ON a.kddept = e.kddept AND a.kdunit = e.kdunit
    LEFT JOIN 
        dbref.t_lokasi_2025 f ON a.kdlokasi = f.kdlokasi 
    LEFT JOIN laporan_2023.dispensasi_kppn_lampiran g ON a.id::text=g.id_dispensasi::text
         ${filterKppn ? `WHERE ${filterKppn}` : "  "}
    GROUP BY 
          a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,
          a.kd_dispensasi,a.uraian,b.nmkppn,a.jmlkontrak,
          a.jenis,d.nmdept,e.nmunit,f.nmlokasi,a.tgpersetujuan,a.nopersetujuan,
          g.nokontrak,g.tgkontrak,g.nilkontrak
    ORDER BY 
    a.id DESC`
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);

    const requestUrl = apiPath(
      `/dispensasi/${encryptedQuery}?limit=${limit}&page=${page}&user=${user?.username || ""}`
    );
    console.debug("dispensasi-kppn request url", requestUrl);

    try {
      const response = await fetch(requestUrl, {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    }
  };

  const handleRekam = async () => {
    setShowModalRekam(true);
    setCek(false);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setShowModalRekam(false);
    getData();
    setCek(true);
    onRekamClose?.();
  };

  const handleRekamKontrak = async (
    id: string,
    nopermohonan: string,
    nmsatker: string,
    kdsatker: string,
    kdkppn: string
  ) => {
    setId(id);
    setNomor(nopermohonan);
    setNmsatker(nmsatker);
    setKdsatker(kdsatker);
    setKdkppn(kdkppn);
    setShowModalRekam(true);
  };

  const handleCloseModalSPM = () => {
    setShowModalRekam(false);
    setOpen(false);
    getData();
  };

  const handleHapusDispSPM = (
    id: string,
    jumlah: number,
    kdsatker: string,
    kppn: string
  ) => {
    setDeleteTargetId(id);
    setDeleteTargetCount(jumlah);
    setDeleteTargetKdsatker(kdsatker);
    setDeleteTargetKppn(kppn);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        apiPath(`/dispensasi/dispkontrak/${deleteTargetId}`),
        {
          method: "DELETE",
          credentials: "include",
          headers: {},
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
      setLoading(false);
      setShowDeleteDialog(false);
      setDeleteTargetId("");
      setDeleteTargetCount(0);
      setDeleteTargetKdsatker("");
      setDeleteTargetKppn("");
    }
  };

  const handleStatus = (status: boolean) => {
    setExport2(status);
    if (!status && onExportComplete) {
      onExportComplete();
    }
  };

  // Sync export2 with parent's isExporting
  useEffect(() => {
    if (isExporting) {
      setExport2(true);
    } else {
      setExport2(false);
    }
  }, [isExporting]);

  return (
    <div className="space-y-4">
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col className="w-10" />
                      <col className="w-[18%]" />
                      <col className="w-[28%]" />
                      <col className="w-[12%]" />
                      <col className="w-[24%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className={tableStyles.headerCellCenter}>No.</th>
                        <th className={tableStyles.headerCell}>KPPN</th>
                        <th className={tableStyles.headerCell}>Satker</th>
                        <th className={tableStyles.headerCell}>Tgl Permohonan</th>
                        <th className={tableStyles.headerCell}>Nomor Permohonan</th>
                        <th className={tableStyles.headerCellCenter}>Jumlah Kontrak</th>
                        <th className={tableStyles.headerCellCenter}>Opsi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="h-24 text-center text-muted-foreground">
                            Belum ada data dispensasi kontrak KPPN
                          </td>
                        </tr>
                      ) : (
                        data.map((row, index) => (
                          <tr key={index} className="hover:bg-muted/50 transition-colors">
                            <td className={tableStyles.bodyCellCenter}>
                              {index + 1 + page * limit}
                            </td>
                            <td className={`${tableStyles.bodyCell} overflow-hidden`} title={`${row.nmkppn} (${row.kdkppn})`}>
                              <span className="block truncate">{row.nmkppn} ({row.kdkppn})</span>
                            </td>
                            <td className={`${tableStyles.bodyCell} overflow-hidden`} title={`${row.nmsatker?.trim()} (${row.kdsatker})`}>
                              <span className="block truncate">{row.nmsatker?.trim()} ({row.kdsatker})</span>
                            </td>
                            <td className={`${tableStyles.bodyCell} whitespace-nowrap`}>
                              {row.tgpermohonan}
                            </td>
                            <td className={`${tableStyles.bodyCell} overflow-hidden`} title={row.nopermohonan?.trim()}>
                              <span className="block truncate">{row.nopermohonan?.trim()}</span>
                            </td>
                            <td className={tableStyles.bodyCellCenter}>
                              {row.jmlkontrak > 0 ? (
                                row.jmlkontrak
                              ) : (
                                <span className="text-red-600 font-bold">
                                  belum direkam
                                </span>
                              )}
                            </td>
                            <td className={tableStyles.bodyCellCenter}>
                              {user?.role !== "kanwil_djpb" ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Rekam Kontrak"
                                    onClick={() =>
                                      handleRekamKontrak(
                                        row.id,
                                        row.nopermohonan,
                                        row.nmsatker,
                                        row.kdsatker,
                                        row.kdkppn
                                      )
                                    }
                                  >
                                    <PlusSquare className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Hapus Dispensasi"
                                    onClick={() =>
                                      handleHapusDispSPM(
                                        row.id,
                                        row.jmlkontrak,
                                        row.kdsatker,
                                        row.kdkppn
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.length > 0 && (
                <div className="flex items-center justify-between mt-4">
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
            </CardContent>
          </Card>
          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleStatus}
              namafile={`v3_CSV_DISPENSASI_KONTRAK_KPPN_${moment().format(
                "DDMMYY-HHmmss"
              )}`}
            />
          )}
        </>
      )}

      {open && <Rekam show={open} onHide={handleCloseModal} />}
      <RekamKontrak
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        id={id}
        nomor={nomor}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
        kdkppn={kdkppn}
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
                ? `Ada ${deleteTargetCount} Kontrak yang sudah direkam. Apakah Anda yakin ingin menghapus data ini?`
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

export default DataDispensasiKPPN;
