"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RekamWeeklyReportModal } from "@/components/laporan/rekam-weekly-report-modal";

export default function WeeklyReportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with Title and Rekam Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly Report</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan lihat laporan mingguan
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Rekam
        </Button>
      </div>

      {/* Card Container with Table */}
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tahun
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tanggal Awal
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tanggal Akhir
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Keterangan
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      File
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty state - will be populated with actual data */}
                  <tr>
                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                      Belum ada data weekly report
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rekam Weekly Report Modal */}
      <RekamWeeklyReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
