"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loading2 } from "@/layout/LoadingTable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ReactPaginate from "react-paginate";
import moment from "moment";
import { PlusSquare, Trash2, FileSpreadsheet, Loader2 } from "lucide-react";
import Rekam from "./modal-rekam";
import RekamKontrak from "./modal-rekam-kontrak";
import GenerateCSV from "@/components/GenerateCSV";

// Table styling dengan fixed column widths
const tableStyles = {
  container: {
    overflowX: "auto" as const,
    width: "100%",
  },
  table: {
    width: "100%",
    minWidth: "1300px",
    tableLayout: "fixed" as const,
  },
  // Column widths
  noColumn: { width: "50px", minWidth: "50px", maxWidth: "50px" },
  kppnColumn: { width: "180px", minWidth: "180px", maxWidth: "180px" },
  satkerColumn: { width: "200px", minWidth: "200px", maxWidth: "200px" },
  tglColumn: { width: "120px", minWidth: "120px", maxWidth: "120px" },
  nomorColumn: { width: "200px", minWidth: "200px", maxWidth: "200px" },
  jumlahColumn: { width: "140px", minWidth: "140px", maxWidth: "140px" },
  opsiColumn: { width: "140px", minWidth: "140px", maxWidth: "140px" },
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

const DataDispensasiKPPN: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");
  const [nomor, setNomor] = useState("");
  const [data, setData] = useState<DispensasiData[]>([]);
  const [showModal, setShowModal] = useState(false);
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
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState(false);

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

    const baseUrl =
      process.env.NEXT_PUBLIC_LOCAL_TAYANGDISPENSASIKPPN ||
      process.env.NEXT_PUBLIC_API_URL ||
      "/api/v1";

    const requestUrl = `${baseUrl}/dispensasi/${encryptedQuery}?limit=${limit}&page=${page}&user=${user?.username || ""
      }`;
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
    setShowModal(true);
    setCek(false);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    getData();
    setCek(true);
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

  const handleHapusDispSPM = async (
    id: string,
    jumlah: number,
    kdsatker: string,
    kppn: string
  ) => {
    const confirmText =
      jumlah > 0
        ? `Ada ${jumlah} Kontrak yang sudah direkam.<br/> Anda yakin ingin menghapus data ini ? `
        : "Anda yakin ingin menghapus data ini ?";

    if (window.confirm(confirmText.replace(/<br\/>/g, "\n"))) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_LOCAL_BASIC}dispkontrakkppn/delete/${id}/${kdsatker}/${kppn}`,
          {
            method: "DELETE",
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
      }
    }
  };

  const halaman = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);

    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 text-red-500">
        {user?.role !== "kanwil_djpb" && (
          <Button
            variant="default"
            size="sm"
            className="my-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleRekam()}
          >
            Rekam Dispensasi
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="my-2"
          onClick={() => {
            setLoadingStatus(true);
            setExport2(true);
          }}
          disabled={loadingStatus}
        >
          {loadingStatus ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-4 w-4" />
          )}
          {loadingStatus ? "Loading..." : "Download"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Loading2 />
          <Loading2 />
          <Loading2 />
        </div>
      ) : (
        <>
          <div className="mt-3 p-0 rounded-md border text-card-foreground shadow-sm bg-dark">
            <div className="data-user fade-in" style={tableStyles.container}>
              <table
                className="w-full text-sm text-center border-collapse"
                style={tableStyles.table}
              >
                <thead className="bg-[#343a40] text-white">
                  <tr>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.noColumn}
                    >
                      No
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.kppnColumn}
                    >
                      KPPN
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.satkerColumn}
                    >
                      Satker
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.tglColumn}
                    >
                      Tgl Permohonan
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.nomorColumn}
                    >
                      Nomor Permohonan
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.jumlahColumn}
                    >
                      Jumlah Kontrak
                    </th>
                    <th
                      className="p-3 font-semibold border border-[#dee2e6]"
                      style={tableStyles.opsiColumn}
                    >
                      Opsi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#dee2e6]">
                  {data.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-100 transition-colors odd:bg-[rgba(0,0,0,0.05)] even:bg-white"
                    >
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.noColumn}
                      >
                        {index + 1 + page * limit}
                      </td>
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.kppnColumn}
                      >
                        {row.nmkppn} ({row.kdkppn})
                      </td>
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.satkerColumn}
                      >
                        <div className="truncate" title={row.nmsatker}>
                          {row.nmsatker} ({row.kdsatker})
                        </div>
                      </td>
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.tglColumn}
                      >
                        {row.tgpermohonan}
                      </td>
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.nomorColumn}
                      >
                        <div className="truncate" title={row.nopermohonan}>
                          {row.nopermohonan}
                        </div>
                      </td>
                      <td
                        className="p-2 border border-[#dee2e6]"
                        style={tableStyles.jumlahColumn}
                      >
                        {row.jmlkontrak > 0 ? (
                          row.jmlkontrak
                        ) : (
                          <span className="text-red-600 font-bold">
                            belum direkam
                          </span>
                        )}
                      </td>
                      {user?.role !== "kanwil_djpb" ? (
                        <td
                          className="p-2 border border-[#dee2e6]"
                          style={tableStyles.opsiColumn}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span title="Rekam Kontrak">
                              <PlusSquare
                                className="text-green-600 cursor-pointer hover:scale-110 transition-transform"
                                size={20}
                                onClick={() =>
                                  handleRekamKontrak(
                                    row.id,
                                    row.nopermohonan,
                                    row.nmsatker,
                                    row.kdsatker,
                                    row.kdkppn
                                  )
                                }
                              />
                            </span>

                            <span title="Hapus Dispensasi">
                              <Trash2
                                className="text-red-600 cursor-pointer hover:scale-110 transition-transform"
                                size={20}
                                onClick={() =>
                                  handleHapusDispSPM(
                                    row.id,
                                    row.jmlkontrak,
                                    row.kdsatker,
                                    row.kdkppn
                                  )
                                }
                              />
                            </span>
                          </div>
                        </td>
                      ) : (
                        <td
                          className="p-2 border border-[#dee2e6]"
                          style={tableStyles.opsiColumn}
                        >
                          -
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleStatus}
              namafile={`v3_CSV_DISPENSASI_KONTRAK_KPPN_${moment().format(
                "DDMMYY-HHmmss"
              )}`}
            />
          )}
          {data.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-4 text-sm text-gray-600">
              <div>
                Total : {rows.toLocaleString()}, &nbsp; Hal : &nbsp;
                {rows ? page + 1 : 0} dari {pages}
              </div>
              <nav>
                <ReactPaginate
                  previousLabel={"← Previous"}
                  nextLabel={"Next →"}
                  breakLabel="..."
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={pages}
                  renderOnZeroPageCount={null}
                  containerClassName="flex gap-2 list-none p-0 m-0"
                  pageClassName="rounded-md border border-gray-300 hover:bg-gray-100"
                  pageLinkClassName="block px-3 py-2 text-decoration-none text-gray-700"
                  previousClassName="rounded-md border border-gray-300 hover:bg-gray-100"
                  previousLinkClassName="block px-3 py-2 text-decoration-none text-gray-700"
                  nextClassName="rounded-md border border-gray-300 hover:bg-gray-100"
                  nextLinkClassName="block px-3 py-2 text-decoration-none text-gray-700"
                  breakClassName="rounded-md border border-gray-300"
                  breakLinkClassName="block px-3 py-2 text-decoration-none text-gray-700"
                  activeClassName="bg-blue-600 text-white border-blue-600"
                  activeLinkClassName="text-white hover:text-white"
                  disabledClassName="opacity-50 pointer-events-none"
                  onPageChange={halaman}
                  initialPage={page}
                />
              </nav>
            </div>
          )}
        </>
      )}

      {open && <Rekam show={showModal} onHide={handleCloseModal} />}
      <RekamKontrak
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        id={id}
        nomor={nomor}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
        kdkppn={kdkppn}
      />
    </div>
  );
};

export default DataDispensasiKPPN;
