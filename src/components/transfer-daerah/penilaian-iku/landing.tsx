"use client";

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { PenilaianKanwil } from "./penilaian-kanwil";
import { PenilaianKppn } from "./penilaian-kppn";

interface LandingPenilaianIkuProps {
  role: string;
  username: string;
  kdkppn: string;
}

export function LandingPenilaianIku({ role, username, kdkppn }: LandingPenilaianIkuProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Penilaian IKU TKD</h1>
        <p className="text-sm text-muted-foreground">Analisa / Laporan</p>
      </div>

      <Tabs defaultValue="nilai_monev" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-0">
            <TabsTrigger
              value="nilai_monev"
              className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              Nilai Monev Kanwil
            </TabsTrigger>
            <TabsTrigger
              value="nilai_lk"
              className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              Nilai LK KPPN
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="nilai_monev">
            <PenilaianKanwil role={role} username={username} />
          </TabsContent>

          <TabsContent value="nilai_lk">
            <PenilaianKppn role={role} username={username} kdkppn={kdkppn} />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
