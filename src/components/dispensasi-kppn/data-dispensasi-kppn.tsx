"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loading2 } from "@/layout/LoadingTable";
import { toast } from "sonner";
import { Button, Table, Spinner, Card } from "react-bootstrap";
import ReactPaginate from "react-paginate";
import moment from "moment";
import { PlusSquare, Trash2, Download } from "lucide-react";
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
    marginBottom: "0",
  },
  headerCell: {
    padding: "12px 8px",
    fontWeight: "600",
    fontSize: "13px",
    backgroundColor: "#343a40", // dark grey
    color: "#fff", // white text for contrast
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    verticalAlign: "middle",
    borderColor: "#dee2e6",
  },
  bodyCell: {
    padding: "10px 8px",
    fontSize: "12px",
    textAlign: "center" as const,
    verticalAlign: "middle",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
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
  const [showModalFilter, setShowModalFilter] = useState(false);
  const [where, setWhere] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState(false);

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

    // Backend route expects: /api/v1/dispensasi/:query?limit=10&page=0&user=username
    // where :query is the base64-encoded SQL
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
    <div>
      {/* Layout handled by parent */}
      <>
        <div className="d-flex justify-content-end text-danger">
          {user?.role !== "kanwil_djpb" && (
            <Button
              variant="success"
              size="sm"
              className="button  my-2"
              style={{ padding: "5px 5px", marginTop: "10px" }}
              onClick={() => handleRekam()}
            >
              Rekam Dispensasi
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            className="button  my-2"
            style={{ padding: "5px 5px", marginTop: "10px" }}
            onClick={() => {
              setLoadingStatus(true);
              setExport2(true);
            }}
            disabled={loadingStatus}
          >
            {loadingStatus && (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            )}
            {!loadingStatus && (
              <i className="bi bi-file-earmark-excel-fill mx-2"></i>
            )}
            {loadingStatus ? " Loading..." : "Download"}
          </Button>
        </div>
      </>
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
          <Card className="mt-1 p-2" bg="light">
            <Card.Body
              className="data-user fade-in"
              style={tableStyles.container}
            >
              <Table
                striped
                bordered
                hover
                responsive
                style={tableStyles.table}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.noColumn,
                      }}
                    >
                      No
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.kppnColumn,
                      }}
                    >
                      KPPN
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.satkerColumn,
                      }}
                    >
                      Satker
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.tglColumn,
                      }}
                    >
                      Tgl Permohonan
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.nomorColumn,
                      }}
                    >
                      Nomor Permohonan
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.jumlahColumn,
                      }}
                    >
                      Jumlah Kontrak
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.opsiColumn,
                      }}
                    >
                      Opsi
                    </th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.noColumn,
                        }}
                      >
                        {index + 1 + page * limit}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.kppnColumn,
                        }}
                      >
                        {row.nmkppn} ({row.kdkppn})
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.satkerColumn,
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.nmsatker} ({row.kdsatker})
                        </div>
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.tglColumn,
                        }}
                      >
                        {row.tgpermohonan}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.nomorColumn,
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.nopermohonan}
                        </div>
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.jumlahColumn,
                        }}
                      >
                        {row.jmlkontrak > 0 ? (
                          row.jmlkontrak
                        ) : (
                          <span className="text-danger fw-bold">
                            belum direkam
                          </span>
                        )}
                      </td>
                      {user?.role !== "kanwil_djpb" ? (
                        <td
                          style={{
                            ...tableStyles.bodyCell,
                            ...tableStyles.opsiColumn,
                          }}
                        >
                          {/* Rekam Kontrak */}
                          <span
                            title="Rekam Kontrak"
                            className="inline-block"
                          >
                            <PlusSquare
                              className="text-success mx-2 cursor-pointer hover:scale-110 transition-transform"
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

                          {/* Hapus Dispensasi */}
                          <span
                            title="Hapus Dispensasi"
                            className="inline-block"
                          >
                            <Trash2
                              className="text-danger mx-2 cursor-pointer hover:scale-110 transition-transform"
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
                        </td>
                      ) : (
                        <td
                          style={{
                            ...tableStyles.bodyCell,
                            ...tableStyles.opsiColumn,
                          }}
                        >
                          -
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
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
          {data.length > 0 && (
            <>
              <span className="pagination justify-content-between mt-2 mx-4 text-dark">
                Total : {rows.toLocaleString()}, &nbsp; Hal : &nbsp;
                {rows ? page + 1 : 0} dari {pages}
                <nav>
                  <ReactPaginate
                    previousLabel={"← Previous"}
                    nextLabel={"Next →"}
                    breakLabel="..."
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    pageCount={pages}
                    renderOnZeroPageCount={null}
                    containerClassName="justify-content-center pagination"
                    previousClassName="page-item"
                    previousLinkClassName="page-link"
                    nextClassName="page-item"
                    nextLinkClassName="page-link"
                    pageClassName="page-item"
                    pageLinkClassName="page-link"
                    breakClassName="page-item"
                    breakLinkClassName="page-link"
                    activeClassName="active"
                    disabledClassName="disabled"
                    onPageChange={halaman}
                    initialPage={page}
                  />
                </nav>
              </span>
            </>
          )}
        </>
      )}{" "}


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
