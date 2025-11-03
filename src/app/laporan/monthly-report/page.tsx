"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RekamMonthlyReportModal } from "@/components/laporan/rekam-monthly-report-modal";

export default function MonthlyReportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tahun
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Bulan
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
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-muted-foreground">
                      Belum ada data monthly report
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <RekamMonthlyReportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
