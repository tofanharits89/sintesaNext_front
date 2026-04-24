"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Tabs defaultValue="nilai_monev" className="w-full">
        <TabsList className="w-full h-auto p-2 rounded-xl grid grid-cols-2 gap-2">
          <TabsTrigger value="nilai_monev" className="h-10 text-sm">
            Nilai Monev Kanwil
          </TabsTrigger>
          <TabsTrigger value="nilai_lk" className="h-10 text-sm">
            Nilai LK KPPN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nilai_monev" className="mt-4">
          <PenilaianKanwil role={role} username={username} />
        </TabsContent>

        <TabsContent value="nilai_lk" className="mt-4">
          <PenilaianKppn role={role} username={username} kdkppn={kdkppn} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
