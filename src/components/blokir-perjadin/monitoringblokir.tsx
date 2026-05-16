"use client";

import React, { useState, useEffect, useMemo } from "react";
import numeral from "numeral";
import moment from "moment";
import { toast } from "sonner";
import { Download, Filter } from "lucide-react";

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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";
import { cn } from "@/lib/utils/utils";

interface MonitoringBlokirProps {
  role?: string;
  kdkanwil?: string;
  kdkppn?: string;
  username?: string;
  token?: string;
  authLoading?: boolean;
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
  authLoading = false,
}: MonitoringBlokirProps) {
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | number>("");
  const [data, setData] = useState<BlokirData[]>([]);
  const [showModaledit, setShowModaledit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKddept, setSelectedKddept] = useState<string>("");
  const [selectedKdunit, setSelectedKdunit] = useState<string>("");
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sql, setSql] = useState("");
  const [showModalFilter, setShowModalFilter] = useState(false);
  const [where, setWhere] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState("");

  const [filter, setFilter] = useState({
    selectedKementerian: "00",
  });

  // Calculate totals and paginated data client-side
  const totals = useMemo(() => {
    return data.reduce(
      (acc, curr) => ({
        target: acc.target + Number(curr.target_blokir || 0),
        dispen: acc.dispen + Number(curr.dispensasi_blokir || 0),
        sudah: acc.sudah + Number(curr.sudah_blokir || 0),
        sisa: acc.sisa + Number(curr.sisa || 0),
      }),
      { target: 0, dispen: 0, sudah: 0, sisa: 0 }
    );
  }, [data]);

  const totalPages = Math.ceil(data.length / limit);
  const paginatedData = data.slice(page * limit, (page + 1) * limit);

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
    setPage(0); // Reset to first page on filter
  };

  useEffect(() => {
    if (authLoading) return;
    getData();
  }, [authLoading, where, refresh]); // Removed 'page' dependency

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
    GROUP BY a.id, a.kddept, a.kdunit ORDER BY a.kddept, a.kdunit`;

    const encodedQuery = encodeURIComponent(queryBase);
    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery);
    const encryptedQuery = btoa(cleanedQuery);

    try {
      // Fetch ALL data (limit=10000)
      const apiUrl = apiPath(
        `/blokir/monitoring/${encryptedQuery}?limit=10000${username ? `&user=${username}` : ""}`,
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
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
    } catch (error) {
      console.error(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    setLoading(false);
  }

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

  const isTableLoading = authLoading || loading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Monitoring Blokir Perjadin
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring target blokir dan realisasi per satuan kerja.
          </p>
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
            className="h-9 self-start sm:self-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter Data
          </Button>

          <Button
            variant={loadingStatus ? "secondary" : "default"}
            size="sm"
            onClick={() => {
              setLoadingStatus(true);
              setExport2(true);
            }}
            disabled={loadingStatus}
            className="h-9 self-start sm:self-center"
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
      </div>

      <Card className="border shadow-sm">
        <CardContent>
          {isTableLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table className="relative border-separate border-spacing-0 text-xs">
                  <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-12 min-w-[48px] font-semibold text-center bg-background">No.</TableHead>
                      <TableHead className="font-semibold text-center bg-background">
                        Kementerian/Lembaga
                      </TableHead>
                      <TableHead className="font-semibold text-center bg-background">Unit Eselon I</TableHead>
                      <TableHead className="font-semibold text-center bg-background">
                        Target Blokir
                      </TableHead>
                      <TableHead className="font-semibold text-center bg-background">
                        Dispensasi
                      </TableHead>
                      <TableHead className="font-semibold text-center bg-background">
                        Sudah Blokir
                      </TableHead>
                      <TableHead className="font-semibold text-center bg-background">
                        Sisa
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
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
                        {paginatedData.map((row, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="text-center font-medium text-muted-foreground">
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
                            {numeral(totals.target).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {numeral(totals.dispen).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {numeral(totals.sudah).format("0,0")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {numeral(totals.sisa).format("0,0")}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.length > 0 && (
                <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4">
                  {/* Left: Rows per page */}
                  <div className="flex items-center space-x-2 order-2 md:order-1">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={`${limit}`}
                      onValueChange={(value) => { setLimit(Number(value)); setPage(0); }}
                    >
                      <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue placeholder={limit} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 25, 50, 100].map((s) => (
                          <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Center: Numbered Pagination */}
                  <div className="flex items-center justify-center order-1 md:order-2 w-full md:w-auto">
                    <Pagination className="mx-auto justify-center">
                      <div className="flex items-center justify-between w-full sm:min-w-[400px] gap-2">
                        <PaginationPrevious
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(0, p - 1)); }}
                          className={cn("cursor-pointer select-none", page === 0 && "pointer-events-none opacity-50")}
                        />
                        <PaginationContent className="flex-1 justify-center gap-1 overflow-x-auto no-scrollbar">
                          {(() => {
                            const totalPage = totalPages;
                            const currentPage = page + 1;
                            const items = [];
                            if (totalPage <= 7) {
                              for (let i = 1; i <= totalPage; i++) {
                                items.push(
                                  <PaginationItem key={i}>
                                    <PaginationLink isActive={currentPage === i} onClick={(e) => { e.preventDefault(); setPage(i - 1); }} className="cursor-pointer select-none">{i}</PaginationLink>
                                  </PaginationItem>
                                );
                              }
                            } else {
                              items.push(<PaginationItem key={1}><PaginationLink isActive={currentPage === 1} onClick={(e) => { e.preventDefault(); setPage(0); }} className="cursor-pointer select-none">1</PaginationLink></PaginationItem>);
                              if (currentPage > 3) items.push(<PaginationEllipsis key="l" />);
                              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPage - 1, currentPage + 1); i++) {
                                items.push(<PaginationItem key={i}><PaginationLink isActive={currentPage === i} onClick={(e) => { e.preventDefault(); setPage(i - 1); }} className="cursor-pointer select-none">{i}</PaginationLink></PaginationItem>);
                              }
                              if (currentPage < totalPage - 2) items.push(<PaginationEllipsis key="r" />);
                              items.push(<PaginationItem key={totalPage}><PaginationLink isActive={currentPage === totalPage} onClick={(e) => { e.preventDefault(); setPage(totalPage - 1); }} className="cursor-pointer select-none">{totalPage}</PaginationLink></PaginationItem>);
                            }
                            return items;
                          })()}
                        </PaginationContent>
                        <PaginationNext
                          onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages - 1, p + 1)); }}
                          className={cn("cursor-pointer select-none", page >= totalPages - 1 && "pointer-events-none opacity-50")}
                        />
                      </div>
                    </Pagination>
                  </div>

                  {/* Right: Showing entries */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap order-3 md:text-right">
                    Showing {data.length === 0 ? 0 : page * limit + 1}–{Math.min((page + 1) * limit, data.length)} of {numeral(data.length).format("0,0")} entries
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CSV Generator (Hidden/Function only) */}
      {export2 && (
        <GenerateCSV
          query3={sql}
          status={handleStatus}
          namafile={`v3_CSV_MONITORING_BLOKIR_${moment().format("DDMMYY-HHmmss")}`}
          url={apiPath("/blokir/monitoring")}
          token={token}
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
