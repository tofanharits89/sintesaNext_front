"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { FileText, Building2 } from "lucide-react";
import { LaporanKppnModal } from "@/components/transfer-daerah/modals/laporan-kppn-modal";
import { LaporanKanwilModal } from "@/components/transfer-daerah/modals/laporan-kanwil-modal";
import { LaporanKeuanganKppnTab } from "@/components/transfer-daerah/laporan-keuangan-kppn-tab";
import { LaporanMonevKppnTab } from "@/components/transfer-daerah/laporan-monev-kppn-tab";
import { LaporanMonevKanwilTab } from "@/components/transfer-daerah/laporan-monev-kanwil-tab";
import { UploadLaporanPageSkeleton } from "@/components/transfer-daerah/upload-laporan-page-skeleton";

export default function UploadLaporanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isKppnModalOpen, setIsKppnModalOpen] = useState(false);
  const [isKanwilModalOpen, setIsKanwilModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role === "kantor_pusat") {
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role === "kantor_pusat") {
    return <UploadLaporanPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
      <Tabs defaultValue="laporan-keuangan-kppn" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger value="laporan-keuangan-kppn" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base flex items-center justify-center whitespace-nowrap">
              Laporan Keuangan KPPN
            </TabsTrigger>
            <TabsTrigger value="laporan-monev-kppn" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base flex items-center justify-center whitespace-nowrap">
              Laporan Monev KPPN
            </TabsTrigger>
            <TabsTrigger value="laporan-monev-kanwil" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base flex items-center justify-center whitespace-nowrap">
              Laporan Monev Kanwil
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="laporan-keuangan-kppn">
            <LaporanKeuanganKppnTab />
          </TabsContent>

          <TabsContent value="laporan-monev-kppn">
            <LaporanMonevKppnTab />
          </TabsContent>

          <TabsContent value="laporan-monev-kanwil">
            <LaporanMonevKanwilTab />
          </TabsContent>
        </TabsContents>
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

