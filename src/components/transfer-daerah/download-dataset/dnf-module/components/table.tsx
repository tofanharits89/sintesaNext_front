import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
import { ListFilter, Table2 } from "lucide-react";
import { TpgData, BosBopData } from "../dnf-types";

interface TableTPGProps {
  data: TpgData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  loading?: boolean;
}

export const TableTPG: React.FC<TableTPGProps> = ({
  data,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loading = false,
}) => {
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEntry = totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalRows);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            Hasil Data TPG
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={itemsPerPage} />
        ) : !showResults ? (
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
                <Table className="border-separate border-spacing-0 relative" style={{ minWidth: "2200px" }}>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    <TableRow>
                      <TableHead className="border-b border-r text-center font-bold w-[60px]">No</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Tahun</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Periode</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Kanwil</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Nama Kanwil</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">KPPN</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Nama KPPN</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Lokasi</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Jenis TKD</TableHead>
                      {shortMonths.map((m) => (
                        <TableHead key={m} className="border-b border-r text-center font-bold bg-muted/30">{m}</TableHead>
                      ))}
                      <TableHead className="border-b text-center font-bold">Total</TableHead>
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
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.nm_periode}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kode_kanwil}</TableCell>
                          <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nm_kanwil}>{row.nm_kanwil}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kppn}</TableCell>
                          <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nm_kppn}>{row.nm_kppn}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.nm_lokasi}</TableCell>
                          <TableCell className="border-b border-r text-left whitespace-nowrap">{row.jenis_tkd}</TableCell>
                          {months.map((m) => (
                            <TableCell key={m} className="border-b border-r text-right">
                              {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                            </TableCell>
                          ))}
                          <TableCell className="border-b text-right font-bold">
                            {new Intl.NumberFormat("id-ID").format(row.total_setahun || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={22} className="h-24 text-center text-muted-foreground">
                          Tidak ada data yang ditampilkan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Standard Pagination */}
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
  );
};

interface TableBosBopProps {
  data: BosBopData[];
  showResults: boolean;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  loading?: boolean;
}

export const TableBosBop: React.FC<TableBosBopProps> = ({
  data,
  showResults,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  loading = false,
}) => {
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEntry = totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalRows);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            Hasil Data BOS / BOP
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={itemsPerPage} />
        ) : !showResults ? (
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
                <Table className="border-separate border-spacing-0 relative" style={{ minWidth: "2600px" }}>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    <TableRow>
                      <TableHead className="border-b border-r text-center font-bold w-[60px]">No</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Tahun</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Kanwil</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Nama Kanwil</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">KPPN</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Nama KPPN</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Program</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Jenjang</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Status</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Jenis BOS</TableHead>
                      <TableHead className="border-b border-r text-center font-bold">Lokasi</TableHead>
                      {shortMonths.map((m) => (
                        <TableHead key={m} className="border-b border-r text-center font-bold bg-muted/30">{m}</TableHead>
                      ))}
                      <TableHead className="border-b text-center font-bold">Total</TableHead>
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
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdkanwil}</TableCell>
                          <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmkanwil}>{row.nmkanwil}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.kdkppn}</TableCell>
                          <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmkabkota_kppn}>{row.nmkabkota_kppn}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.nmprogram}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.jenjang}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.status_sekolah}</TableCell>
                          <TableCell className="border-b border-r text-center whitespace-nowrap">{row.jenis_bos}</TableCell>
                          <TableCell className="border-b border-r text-left max-w-[200px] truncate" title={row.nmkabkota_sekolah}>{row.nmkabkota_sekolah}</TableCell>
                          {months.map((m) => (
                            <TableCell key={m} className="border-b border-r text-right">
                              {new Intl.NumberFormat("id-ID").format(row[m] || 0)}
                            </TableCell>
                          ))}
                          <TableCell className="border-b text-right font-bold">
                            {new Intl.NumberFormat("id-ID").format(row.total_nilai || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={24} className="h-24 text-center text-muted-foreground">
                          Tidak ada data yang ditampilkan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Standard Pagination */}
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
  );
};
