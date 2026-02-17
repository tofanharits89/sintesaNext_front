"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { MakrokesraTab } from "@/components/kertas-kerja/makrokesra-tab";
import { HargaKomoditasTab } from "@/components/kertas-kerja/harga-komoditas-tab";
import { PerkembanganLainnyaTab } from "@/components/kertas-kerja/perkembangan-lainnya-tab";
import { PermasalahanIsuTab } from "@/components/kertas-kerja/permasalahan-isu-tab";
import { KesimpulanRekomendasiTab } from "@/components/kertas-kerja/kesimpulan-rekomendasi-tab";

export default function KertasKerjaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kertas Kerja
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data makrokesra, komoditas, dan analisis kertas kerja
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="makrokesra" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-0">
            <TabsTrigger value="makrokesra" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
              Makrokesra
            </TabsTrigger>
            <TabsTrigger value="harga-komoditas" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
              Harga Komoditas
            </TabsTrigger>
            <TabsTrigger value="perkembangan-lainnya" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
              Perkembangan Lainnya
            </TabsTrigger>
            <TabsTrigger value="permasalahan-isu" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
              Permasalahan/Isu
            </TabsTrigger>
            <TabsTrigger value="kesimpulan-rekomendasi" className="h-12 md:h-full px-3 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
              Kesimpulan & Rekomendasi
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="makrokesra">
            <MakrokesraTab />
          </TabsContent>

          <TabsContent value="harga-komoditas">
            <HargaKomoditasTab />
          </TabsContent>

          <TabsContent value="perkembangan-lainnya">
            <PerkembanganLainnyaTab />
          </TabsContent>

          <TabsContent value="permasalahan-isu">
            <PermasalahanIsuTab />
          </TabsContent>

          <TabsContent value="kesimpulan-rekomendasi">
            <KesimpulanRekomendasiTab />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

