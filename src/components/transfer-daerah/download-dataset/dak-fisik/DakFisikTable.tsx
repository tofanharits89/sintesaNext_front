import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { cn } from "@/lib/utils/utils";
import { DakFisikData } from "./types";
import { ListFilter, Table2 } from "lucide-react";

interface DakFisikTableProps {
  tableData: DakFisikData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
}

export const DakFisikTable: React.FC<DakFisikTableProps> = ({
  tableData,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}) => {
  const totalRows = tableData.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const currentData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEntry = totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalRows);

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const fullMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  return (
    <div className="results-section space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Hasil Data
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <div className="border rounded-md">
              <div className="h-10 bg-muted/50 border-b flex items-center px-4">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  Data belum ditarik
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/50">
                <Table2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">
                  Silahkan Pilih Parameter dan klik "Tayang" untuk menampilkan hasil
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <Table className="border-separate border-spacing-0 relative" style={{ minWidth: "2500px" }}>
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">No</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Tahun</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Lokasi</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Pemda</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Kanwil</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">KPPN</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Nama KPPN</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Akun</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Jenis Dana</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Bidang</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Nama Bidang</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Sub</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Nama Sub Bidang</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Pagu</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Penyaluran</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">Sisa Pagu</TableHead>
                        <TableHead rowSpan={2} className="border-b border-r text-center font-bold">%</TableHead>
                        <TableHead colSpan={12} className="border-b text-center font-bold bg-muted/50">Realisasi Bulanan</TableHead>
                      </TableRow>
                      <TableRow>
                        {months.map((m) => (
                          <TableHead key={m} className="border-b border-r text-center font-bold bg-muted/50">{m}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.length > 0 ? (
                        currentData.map((row, index) => (
                          <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="border-b border-r text-center">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.thang}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdlokasi}</TableCell>
                            <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.pemda}>{row.pemda}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdkanwil}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdkppn}</TableCell>
                            <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmkppn}>{row.nmkppn}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdakun}</TableCell>
                            <TableCell className="border-b border-r text-left max-w-[150px] truncate" title={row.jenis_dana}>{row.jenis_dana}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdbidang}</TableCell>
                            <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmbidang}>{row.nmbidang}</TableCell>
                            <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdsubidang}</TableCell>
                            <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmsubidang}>{row.nmsubidang}</TableCell>
                            <TableCell className="border-b border-r text-right font-medium">
                              {new Intl.NumberFormat("id-ID").format(row.pagu)}
                            </TableCell>
                            <TableCell className="border-b border-r text-right font-medium">
                              {new Intl.NumberFormat("id-ID").format(row.total_penyaluran)}
                            </TableCell>
                            <TableCell className="border-b border-r text-right font-medium">
                              {new Intl.NumberFormat("id-ID").format(row.sisa_pagu)}
                            </TableCell>
                            <TableCell className="border-b border-r text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                row.prosentase >= 100 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                                row.prosentase >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" : 
                                "bg-rose-100 text-rose-700 border-rose-200"
                              )}>
                                {row.prosentase}%
                              </span>
                            </TableCell>
                            {fullMonths.map((m) => (
                              <TableCell key={m} className="border-b border-r text-right">
                                {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={29} className="h-24 text-center text-muted-foreground">
                            Tidak ada data yang ditampilkan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Standard Pagination matching DAU page */}
              <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-4 py-4">
                <div className="flex items-center space-x-2 order-2 md:order-1">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center order-1 md:order-2 w-full md:w-auto">
                  <Pagination className="mx-auto justify-center">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={cn(
                            "cursor-pointer select-none",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {(() => {
                        const items = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                        if (endPage - startPage + 1 < maxVisible) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        if (startPage > 1) {
                          items.push(
                            <PaginationItem key={1}>
                              <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                            </PaginationItem>
                          );
                          if (startPage > 2) items.push(<PaginationEllipsis key="e1" />);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          items.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={currentPage === i}
                                onClick={() => setCurrentPage(i)}
                                className="cursor-pointer"
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) items.push(<PaginationEllipsis key="e2" />);
                          items.push(
                            <PaginationItem key={totalPages}>
                              <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
                            </PaginationItem>
                          );
                        }

                        return items;
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={cn(
                            "cursor-pointer select-none",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>

                <div className="text-sm text-muted-foreground whitespace-nowrap order-3 md:text-right">
                  Showing {startEntry}-{endEntry} of {totalRows} entries
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
