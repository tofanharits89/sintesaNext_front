"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Building2 } from "lucide-react";
import { LaporanKppnModal } from "@/components/transfer-daerah/modals/laporan-kppn-modal";
import { LaporanKanwilModal } from "@/components/transfer-daerah/modals/laporan-kanwil-modal";
import { LaporanKeuanganKppnTab } from "@/components/transfer-daerah/laporan-keuangan-kppn-tab";
import { LaporanMonevKppnTab } from "@/components/transfer-daerah/laporan-monev-kppn-tab";
import { LaporanMonevKanwilTab } from "@/components/transfer-daerah/laporan-monev-kanwil-tab";

export default function UploadLaporanPage() {
  const [isKppnModalOpen, setIsKppnModalOpen] = useState(false);
  const [isKanwilModalOpen, setIsKanwilModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Upload Laporan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola upload laporan KPPN dan Kanwil
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsKppnModalOpen(true)}
            className="min-w-[130px] h-10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Laporan KPPN
          </Button>
          <Button
            onClick={() => setIsKanwilModalOpen(true)}
            className="min-w-[130px] h-10"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Laporan Kanwil
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="laporan-keuangan-kppn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 border shadow-sm p-2 h-15 gap-2 rounded-lg">
          <TabsTrigger
            value="laporan-keuangan-kppn"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Laporan Keuangan KPPN
          </TabsTrigger>
          <TabsTrigger
            value="laporan-monev-kppn"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Laporan Monev KPPN
          </TabsTrigger>
          <TabsTrigger
            value="laporan-monev-kanwil"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Laporan Monev Kanwil
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="laporan-keuangan-kppn"
          className="animate-in fade-in-50 duration-200"
        >
          <LaporanKeuanganKppnTab />
        </TabsContent>

        <TabsContent
          value="laporan-monev-kppn"
          className="animate-in fade-in-50 duration-200"
        >
          <LaporanMonevKppnTab />
        </TabsContent>

        <TabsContent
          value="laporan-monev-kanwil"
          className="animate-in fade-in-50 duration-200"
        >
          <LaporanMonevKanwilTab />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <LaporanKppnModal
        open={isKppnModalOpen}
        onOpenChange={setIsKppnModalOpen}
      />
      <LaporanKanwilModal
        open={isKanwilModalOpen}
        onOpenChange={setIsKanwilModalOpen}
      />
    </div>
  );
}
