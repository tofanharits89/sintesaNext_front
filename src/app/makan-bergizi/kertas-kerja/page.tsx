"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { MakrokesraTab } from "@/components/kertas-kerja/makrokesra-tab";
import { HargaKomoditasTab } from "@/components/kertas-kerja/harga-komoditas-tab";
import { PerkembanganLainnyaTab } from "@/components/kertas-kerja/perkembangan-lainnya-tab";
import { PermasalahanIsuTab } from "@/components/kertas-kerja/permasalahan-isu-tab";
import { KesimpulanRekomendasiTab } from "@/components/kertas-kerja/kesimpulan-rekomendasi-tab";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function KertasKerjaPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kertas Kerja
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data makrokesra, komoditas, dan analisis kertas kerja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Tahun:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <MakrokesraTab selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="harga-komoditas">
            <HargaKomoditasTab selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="perkembangan-lainnya">
            <PerkembanganLainnyaTab selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="permasalahan-isu">
            <PermasalahanIsuTab selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="kesimpulan-rekomendasi">
            <KesimpulanRekomendasiTab selectedYear={selectedYear} />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

