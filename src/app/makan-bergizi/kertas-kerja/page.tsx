"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MakrokesraTab } from "@/components/kertas-kerja/makrokesra-tab";
import { HargaKomoditasTab } from "@/components/kertas-kerja/harga-komoditas-tab";
import { PerkembanganLainnyaTab } from "@/components/kertas-kerja/perkembangan-lainnya-tab";
import { PermasalahanIsuTab } from "@/components/kertas-kerja/permasalahan-isu-tab";
import { KesimpulanRekomendasiTab } from "@/components/kertas-kerja/kesimpulan-rekomendasi-tab";

export default function KertasKerjaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
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
      <Tabs defaultValue="makrokesra" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-900 border shadow-sm p-2 h-15 gap-2 rounded-lg">
          <TabsTrigger
            value="makrokesra"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Makrokesra
          </TabsTrigger>
          <TabsTrigger
            value="harga-komoditas"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Harga Komoditas
          </TabsTrigger>
          <TabsTrigger
            value="perkembangan-lainnya"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Perkembangan Lainnya
          </TabsTrigger>
          <TabsTrigger
            value="permasalahan-isu"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Permasalahan/Isu
          </TabsTrigger>
          <TabsTrigger
            value="kesimpulan-rekomendasi"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Kesimpulan & Rekomendasi
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="makrokesra"
          className="animate-in fade-in-50 duration-200"
        >
          <MakrokesraTab />
        </TabsContent>

        <TabsContent
          value="harga-komoditas"
          className="animate-in fade-in-50 duration-200"
        >
          <HargaKomoditasTab />
        </TabsContent>

        <TabsContent
          value="perkembangan-lainnya"
          className="animate-in fade-in-50 duration-200"
        >
          <PerkembanganLainnyaTab />
        </TabsContent>

        <TabsContent
          value="permasalahan-isu"
          className="animate-in fade-in-50 duration-200"
        >
          <PermasalahanIsuTab />
        </TabsContent>

        <TabsContent
          value="kesimpulan-rekomendasi"
          className="animate-in fade-in-50 duration-200"
        >
          <KesimpulanRekomendasiTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
