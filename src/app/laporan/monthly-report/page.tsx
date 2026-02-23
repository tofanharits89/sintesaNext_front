"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RekamMonthlyReportModal } from "@/components/laporan/rekam-monthly-report-modal";
import { useMonthlyReport } from "@/hooks/use-weekly-report";

export default function MonthlyReportPage() {
  const ITEMS_PER_PAGE = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { rows, isLoading, error } = useMonthlyReport();

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDownload = (fileUrl: string) => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.rel = "noopener,noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Report</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan lihat laporan bulanan
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Rekam</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      No
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      Tahun
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      Bulan
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      Keterangan
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      File
                    </th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground whitespace-nowrap text-xs">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-muted-foreground">
                        Memuat data monthly report...
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && error ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-red-600">
                        Gagal memuat data: {String((error as Error)?.message || error)}
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && !error && rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-24 text-center text-muted-foreground">
                        Belum ada data monthly report
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && !error
                    ? paginatedRows.map((row, index) => (
                        <tr key={row.id} className="border-b">
                          <td className="p-4 align-middle text-sm text-center">{startIndex + index + 1}</td>
                          <td className="p-4 align-middle text-sm text-center">{row.tahun || "-"}</td>
                          <td className="p-4 align-middle text-sm text-center">{row.namaBulan || row.bulan || "-"}</td>
                          <td className="p-4 align-middle text-sm text-center">{row.keterangan || "-"}</td>
                          <td className="p-4 align-middle text-sm text-center">
                            <span
                              title={row.fileName || "-"}
                              className="inline-block max-w-[280px] truncate"
                            >
                              {row.fileName || "-"}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(row.fileUrl)}
                              disabled={!row.fileName}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          {!isLoading && !error && rows.length > 0 ? (
            <div className="flex flex-col gap-3 px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, rows.length)} dari {rows.length} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {safePage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RekamMonthlyReportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
