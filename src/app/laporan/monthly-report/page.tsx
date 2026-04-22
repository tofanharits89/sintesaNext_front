"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RekamMonthlyReportModal } from "@/components/laporan/rekam-monthly-report-modal";
import { useMonthlyReport } from "@/hooks/use-weekly-report";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

export default function MonthlyReportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { rows, isLoading, error } = useMonthlyReport();

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

  const columns = useMemo(() => getColumns({ onDownload: handleDownload }), []);

  return (
    <div className="space-y-6">
      {/* Header with Title and Rekam Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Report</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan lihat laporan bulanan
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Rekam
        </Button>
      </div>

      {/* Card Container with Table */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <div className="rounded-md border p-20 text-center text-red-600">
              Gagal memuat data: {String((error as Error)?.message || error)}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              initialPageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Rekam Monthly Report Modal */}
      <RekamMonthlyReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
