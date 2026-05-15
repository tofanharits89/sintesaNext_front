"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import moment from "moment";
import { PlusSquare, Trash2, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
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
import { DataTable } from "@/components/ui/data-table";

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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
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
  }, [pagination.pageIndex, pagination.pageSize, where, user]);

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
      `/dispensasi/${encryptedQuery}?limit=${pagination.pageSize}&page=${pagination.pageIndex}&user=${user?.username || ""}`
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

  const columns: ColumnDef<DispensasiData>[] = [
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
      accessorKey: "kppn",
      header: () => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }) => (
        <div
          className="text-left max-w-[240px] truncate"
          title={`${row.original.nmkppn} (${row.original.kdkppn})`}
        >
          {row.original.nmkppn} ({row.original.kdkppn})
        </div>
      ),
    },
    {
      accessorKey: "satker",
      header: () => <div className="text-center font-medium">Satker</div>,
      cell: ({ row }) => (
        <div
          className="text-left max-w-[320px] truncate"
          title={`${row.original.nmsatker?.trim()} (${row.original.kdsatker})`}
        >
          {row.original.nmsatker?.trim()} ({row.original.kdsatker})
        </div>
      ),
    },
    {
      accessorKey: "tgpermohonan",
      header: () => <div className="text-center font-medium">Tgl Permohonan</div>,
      cell: ({ row }) => <div className="text-center whitespace-nowrap">{row.original.tgpermohonan}</div>,
    },
    {
      accessorKey: "nopermohonan",
      header: () => <div className="text-center font-medium">Nomor Permohonan</div>,
      cell: ({ row }) => (
        <div className="text-left max-w-[280px] truncate" title={row.original.nopermohonan?.trim()}>
          {row.original.nopermohonan?.trim()}
        </div>
      ),
    },
    {
      accessorKey: "jmlkontrak",
      header: () => <div className="text-center font-medium">Jumlah Kontrak</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.jmlkontrak > 0 ? (
            row.original.jmlkontrak
          ) : (
            <span className="font-bold text-red-600">belum direkam</span>
          )}
        </div>
      ),
    },
    {
      id: "opsi",
      header: () => <div className="text-center font-medium">Opsi</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {user?.role !== "kanwil_djpb" ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                title="Rekam Kontrak"
                onClick={() =>
                  handleRekamKontrak(
                    row.original.id,
                    row.original.nopermohonan,
                    row.original.nmsatker,
                    row.original.kdsatker,
                    row.original.kdkppn
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
                    row.original.id,
                    row.original.jmlkontrak,
                    row.original.kdsatker,
                    row.original.kdkppn
                  )
                }
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            "-"
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <DataTable
                columns={columns}
                data={data}
                emptyMessage="Belum ada data dispensasi kontrak KPPN"
                manualPagination={true}
                rowCount={rows}
                controlledPagination={pagination}
                onPaginationChange={setPagination}
              />
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
