"use client";

import React, { useState, useEffect } from "react";
import numeral from "numeral";
import moment from "moment";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";
import GenerateCSV from "../GenerateCSV";
import FilterData from "./filterdata";
import DetailSatkerBlokir from "./detail-satker";
import EditDispen from "./edit-dispen";

interface MonitoringBlokirProps {
  role?: string;
  kdkanwil?: string;
  kdkppn?: string;
  username?: string;
  token?: string;
}

interface BlokirData {
  id: string | number;
  kddept: string;
  nmdept: string;
  kdunit: string;
  nmunit: string;
  target_blokir: number;
  dispensasi_blokir: number;
  sudah_blokir: number;
  sisa: number;
}

export default function MonitoringBlokir({
  role = "0",
  kdkanwil = "",
  kdkppn = "",
  username = "admin",
  token = "",
}: MonitoringBlokirProps) {
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState<string | number>("");
  const [data, setData] = useState<BlokirData[]>([]);
  const [showModaledit, setShowModaledit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKddept, setSelectedKddept] = useState<string>("");
  const [selectedKdunit, setSelectedKdunit] = useState<string>("");
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(15);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  // const [cek, setCek] = useState(false); // Unused in target component
  const [showModalFilter, setShowModalFilter] = useState(false);
  const [where, setWhere] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState("");
  const [totalTargetBlokir, setTotalTargetBlokir] = useState(0);
  const [totalDispenBlokir, setTotalDispenBlokir] = useState(0);
  const [totalNilaiBlokir, setTotalNilaiBlokir] = useState(0);
  const [totalSisaBlokir, setTotalSisaBlokir] = useState(0);
  const [filter, setFilter] = useState({
    selectedKementerian: "00",
  });
  const [activeTab, setActiveTab] = useState("monitoring-blokir");

  const handleFilterResult = (filterData: any) => {
    const { selectedKementerian } = filterData;
    let newFilterWhere = "";

    const addFilterClause = (filterVal: string, columnName: string) => {
      if (filterVal !== "00" && filterVal !== "") {
        return `${columnName} = '${filterVal}'`;
      }
      return "";
    };

    setFilter(filterData);

    const updatedFilterWhere = addFilterClause(selectedKementerian, "a.kddept");
    const whereClauses = [updatedFilterWhere].filter(Boolean);

    if (whereClauses.length > 0) {
      newFilterWhere = "  " + whereClauses.join(" AND ");
    }

    setWhere(newFilterWhere);
    // setCek(true);
  };

  useEffect(() => {
    getData();
  }, [page, where, refresh]);

  const getData = async () => {
    setLoading(true);

    let filterKanwil = "";
    if (role === "2") {
      filterKanwil =
        where + (where ? " AND " : "") + `a.kdkanwil = '${kdkanwil}'`;
    } else {
      filterKanwil = where;
    }

    let filterKppn = "";
    if (role === "3") {
      filterKppn = where + (where ? " AND " : "") + `a.kdkppn = '${kdkppn}'`;
    } else {
      filterKppn = where;
    }

    let combinedFilter = filterKanwil;
    if (role === "3") {
      combinedFilter = filterKppn;
    } else if (filterKanwil && filterKppn) {
      combinedFilter = `${filterKanwil} AND ${filterKppn}`;
    }

    // Checking if combinedFilter already has WHERE clause logic handled by backend or if we need to prepend checks
    // The query string construction implies we inject `combinedFilter` into `WHERE ...`

    const queryBase = `SELECT a.id, a.kddept, c.nmdept, a.kdunit, d.nmunit, SUM(a.target) as target_blokir, sum(a.dispensasi_blokir) as dispensasi_blokir, SUM(a.blokir_7 + a.blokir_A) as sudah_blokir, SUM(a.target) - SUM(a.dispensasi_blokir) - SUM(a.blokir_7 + a.blokir_A) AS sisa
    FROM laporan_2023.target_blokir_perjadin a 
    LEFT JOIN dbref.t_dept_2024 c ON a.kddept = c.kddept
    LEFT JOIN dbref.t_unit_2024 d ON a.kddept = d.kddept and a.kdunit = d.kdunit
    ${combinedFilter ? `WHERE ${combinedFilter}` : ""}
    GROUP BY a.kddept, a.kdunit ORDER BY a.kddept, a.kdunit`;

    const encodedQuery = encodeURIComponent(queryBase);
    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery);
    const encryptedQuery = btoa(cleanedQuery);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BLOKIR_MONITORING}/${encryptedQuery}?limit=${limit}&page=${page}${username ? `&user=${username}` : ""}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setTotalTargetBlokir(result.totalTargetBlokir || 0);
      setTotalDispenBlokir(result.totalDispenBlokir || 0);
      setTotalNilaiBlokir(result.totalNilaiBlokir || 0);
      setTotalSisaBlokir(result.totalSisaBlokir || 0);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const halaman = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  const handleFilter = () => {
    setShowModalFilter(true);
  };
  const handleCloseModalFilter = () => {
    setShowModalFilter(false);
    setOpen("");
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);

    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  const handleModalOpen = (kddept: string, kdunit: string) => {
    setIsModalOpen(true);
    setSelectedKddept(kddept);
    setSelectedKdunit(kdunit);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleEditdata = (id: string | number) => {
    setShowModaledit(true);
    setId(id);
    // setCek(false);
    setOpen("2");
  };

  const handleCloseedit = () => {
    setShowModaledit(false);
    // setCek(true);
    setOpen("");
    setRefresh(!refresh);
  };

  return (
    <div>
      <main id="main" className="main">
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Monitoring Blokir Perjadin</h1>
          <nav>
            <ol className="flex gap-2 text-sm mt-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline">
                  Data
                </a>
              </li>
              <li className="text-gray-600">
                <span>/</span>
              </li>
              <li className="text-gray-800 font-medium">Blokir Perjadin</li>
            </ol>
          </nav>
        </div>

        <section className="py-6">
          {/* Custom Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <ul
              className="flex border-b border-gray-200 bg-white"
              role="tablist"
            >
              {(role === "X" || role === "1" || role === "0") && (
                <li className="nav-item">
                  <button
                    className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                      activeTab === "monitoring-blokir"
                        ? "text-amber-500 border-b-2 border-amber-500"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("monitoring-blokir")}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-grid-1x2-fill"></i>
                    Monitoring
                  </button>
                </li>
              )}
              <li className="nav-item">
                <button
                  className="px-4 py-3 font-medium text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-blue-200"
                  onClick={handleFilter}
                  type="button"
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                  Filter Data
                </button>
              </li>
              <li className="ml-auto flex items-center gap-2 px-4">
                {filter.selectedKementerian !== "00" && (
                  <>
                    <button
                      className="px-3 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600"
                      disabled
                    >
                      Filter Aktif
                    </button>
                    <button
                      className="px-3 py-1 text-xs font-medium bg-gray-500 text-white rounded hover:bg-gray-600"
                      disabled
                    >
                      Kementerian {filter.selectedKementerian}
                    </button>
                  </>
                )}
              </li>
            </ul>

            <div className="p-4">
              {activeTab === "monitoring-blokir" && (
                <div>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-gray-500 text-sm">
                        Memuat data...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <button
                          className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors flex items-center gap-2 ${
                            loadingStatus
                              ? "bg-red-400 cursor-not-allowed opacity-60"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                          onClick={() => {
                            setLoadingStatus(true);
                            setExport2(true);
                          }}
                          disabled={loadingStatus}
                        >
                          {loadingStatus ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Loading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-file-earmark-excel-fill"></i>
                              Download
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-100 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                  No.
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                  Kementerian/Lembaga
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                  Unit Eselon I
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                  Target Blokir
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                  Dispensasi
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                  Sudah Blokir
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                  Sisa
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.map((row, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {index + 1 + page * limit}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.nmdept} ({row.kddept})
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {row.nmunit} ({row.kdunit})
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {numeral(row.target_blokir).format("0,0")}
                                  </td>
                                  <td
                                    onClick={() => handleEditdata(row.id)}
                                    className="px-4 py-3 text-sm text-right text-blue-600 cursor-pointer hover:text-blue-700 font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    {numeral(row.dispensasi_blokir).format(
                                      "0,0",
                                    )}
                                  </td>
                                  <td
                                    onClick={() =>
                                      handleModalOpen(row.kddept, row.kdunit)
                                    }
                                    className="px-4 py-3 text-sm text-right text-blue-600 cursor-pointer hover:text-blue-700 font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    {numeral(row.sudah_blokir).format("0,0")}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                                    {numeral(row.sisa).format("0,0")}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-100 border-t-2 border-gray-300">
                                <td
                                  colSpan={3}
                                  className="px-4 py-3 text-sm font-bold text-right text-gray-900"
                                >
                                  Total
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                                  {numeral(totalTargetBlokir).format("0,0")}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                                  {numeral(totalDispenBlokir).format("0,0")}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                                  {numeral(totalNilaiBlokir).format("0,0")}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                                  {numeral(totalSisaBlokir).format("0,0")}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {export2 && (
                        <GenerateCSV
                          query3={sql}
                          status={handleStatus}
                          namafile={`v3_CSV_MONITORING_BLOKIR_${moment().format("DDMMYY-HHmmss")}`}
                        />
                      )}

                      {data.length > 0 && (
                        <div className="mt-4 flex flex-col gap-4 px-4 text-gray-800">
                          <div className="text-sm">
                            Total : {numeral(rows).format("0,0")}, &nbsp; Hal :
                            &nbsp; {rows ? page + 1 : 0} dari {pages}
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
                              containerClassName="flex justify-center gap-1 flex-wrap"
                              previousClassName="page-item"
                              previousLinkClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              nextClassName="page-item"
                              nextLinkClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              pageClassName="page-item"
                              pageLinkClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                              breakClassName="page-item"
                              breakLinkClassName="px-3 py-1 text-sm text-gray-500"
                              activeClassName="active"
                              disabledClassName="disabled"
                              onPageChange={halaman}
                              initialPage={page}
                            />
                          </nav>
                          <style>{`
                            .page-item.active .page-link {
                              @apply bg-blue-600 text-white border-blue-600;
                            }
                            .page-item.disabled .page-link {
                              @apply text-gray-400 cursor-not-allowed opacity-50;
                            }
                          `}</style>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {isModalOpen && (
          <DetailSatkerBlokir
            isModalOpen={isModalOpen}
            handleModalClose={handleModalClose}
            kddept={selectedKddept}
            kdunit={selectedKdunit}
            role={role}
            kdkanwil={kdkanwil}
            token={token}
            jenis="blokir"
          />
        )}

        {open === "2" && showModaledit && (
          <EditDispen
            show={showModaledit}
            onHide={handleCloseedit}
            setRefresh={setRefresh}
            id={id}
            token={token}
            username={username}
          />
        )}
      </main>

      <FilterData
        show={showModalFilter}
        onHide={handleCloseModalFilter}
        onFilter={handleFilterResult}
        role={role}
        kdkanwil={kdkanwil}
        kdkppn={kdkppn}
      />
    </div>
  );
}
