"use client";

import React, { useState, useEffect } from "react";
import numeral from "numeral";
import moment from "moment";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";
import { Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";

import GenerateCSV from "../GenerateCSV";
import FilterData from "./filterdata";
import DetailSatkerBlokir from "./detail-satker";
import EditDispen from "./edit-dispen";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  // Removed activeTab since it was only handling one view

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
    setOpen("2");
  };

  const handleCloseedit = () => {
    setShowModaledit(false);
    setOpen("");
    setRefresh(!refresh);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Monitoring Blokir Perjadin
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitoring target blokir dan realisasi per satuan kerja.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl">Data Monitoring</CardTitle>
            <CardDescription>
              Daftar monitoring target blokir dan realisasi per satuan kerja.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Filters */}
            {filter.selectedKementerian !== "00" && (
              <Badge
                variant="secondary"
                className="h-9 px-3 gap-1 bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Kementerian {filter.selectedKementerian}
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleFilter}
              className="h-9"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter Data
            </Button>

            <Button
              variant={loadingStatus ? "secondary" : "destructive"}
              size="sm"
              onClick={() => {
                setLoadingStatus(true);
                setExport2(true);
              }}
              disabled={loadingStatus}
              className="h-9"
            >
              {loadingStatus ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px] font-semibold">No.</TableHead>
                  <TableHead className="font-semibold">
                    Kementerian/Lembaga
                  </TableHead>
                  <TableHead className="font-semibold">Unit Eselon I</TableHead>
                  <TableHead className="text-right font-semibold">
                    Target Blokir
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Dispensasi
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Sudah Blokir
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Sisa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p>Memuat data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.map((row, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1 + page * limit}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {row.nmdept}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Code: {row.kddept}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{row.nmunit}</span>
                            <span className="text-xs text-muted-foreground">
                              Code: {row.kdunit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {numeral(row.target_blokir).format("0,0")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            onClick={() => handleEditdata(row.id)}
                            className="font-mono text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                          >
                            {numeral(row.dispensasi_blokir).format("0,0")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            onClick={() =>
                              handleModalOpen(row.kddept, row.kdunit)
                            }
                            className="font-mono text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                          >
                            {numeral(row.sudah_blokir).format("0,0")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {numeral(row.sisa).format("0,0")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Summary Row */}
                    <TableRow className="bg-muted/70 hover:bg-muted/80 font-bold border-t-2">
                      <TableCell colSpan={3} className="text-right text-sm">
                        TOTAL
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {numeral(totalTargetBlokir).format("0,0")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {numeral(totalDispenBlokir).format("0,0")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {numeral(totalNilaiBlokir).format("0,0")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {numeral(totalSisaBlokir).format("0,0")}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-5">
              <div className="text-sm text-muted-foreground">
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {numeral(rows).format("0,0")}
                </span>{" "}
                data. Halaman{" "}
                <span className="font-medium text-foreground">
                  {rows ? page + 1 : 0}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-foreground">{pages}</span>
              </div>

              {/* Styled ReactPaginate to match ShadCN Pagination */}
              <ReactPaginate
                previousLabel={
                  <div className="flex items-center gap-1 pl-2.5 pr-4">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </div>
                }
                nextLabel={
                  <div className="flex items-center gap-1 pl-4 pr-2.5">
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                }
                breakLabel={<span className="px-4">...</span>}
                pageCount={pages}
                onPageChange={halaman}
                containerClassName="flex items-center gap-1 select-none"
                pageClassName="block"
                pageLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                activeClassName=""
                activeLinkClassName="border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground font-bold pointer-events-none"
                previousClassName="block"
                previousLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9"
                nextClassName="block"
                nextLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9"
                disabledClassName="opacity-50 pointer-events-none"
                initialPage={page}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Generator (Hidden/Function only) */}
      {export2 && (
        <GenerateCSV
          query3={sql}
          status={handleStatus}
          namafile={`v3_CSV_MONITORING_BLOKIR_${moment().format("DDMMYY-HHmmss")}`}
        />
      )}

      {/* Modals */}
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
