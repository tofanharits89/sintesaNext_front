"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import {
  AlertTriangle,
  TrendingUp,
  Minus,
  Clock,
  Star,
  Target,
} from "lucide-react";

// Import tab components
import { IsuSpesifikTab } from "./tabs/isu-spesifik-tab";
import { TrenBelanjaTab } from "./tabs/tren-belanja-tab";
import { PaguMinusTab } from "./tabs/pagu-minus-tab";
import { OutstandingUPTab } from "./tabs/outstanding-up-tab";
import { KinerjaUtamaTab } from "./tabs/kinerja-utama-tab";
import { TargetCapaianTab } from "./tabs/target-capaian-tab";

export function TabsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis EPA Komprehensif</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="isu-spesifik" className="w-full gap-3">
          <div className="border-b border-border/50 pb-3 mb-0">
            <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-0">
              <TabsTrigger value="isu-spesifik" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Isu Spesifik</span>
              </TabsTrigger>

              <TabsTrigger value="tren-belanja" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Tren Belanja</span>
              </TabsTrigger>

              <TabsTrigger value="pagu-minus" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <Minus className="h-4 w-4 mr-2" />
                <span>Pagu Minus</span>
              </TabsTrigger>

              <TabsTrigger value="outstanding-up" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <Clock className="h-4 w-4 mr-2" />
                <span>Outstanding UP</span>
              </TabsTrigger>

              <TabsTrigger value="kinerja-utama" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <Star className="h-4 w-4 mr-2" />
                <span>Kinerja Utama</span>
              </TabsTrigger>

              <TabsTrigger value="target-capaian" className="h-12 md:h-full px-2 md:px-5 py-0 text-xs md:text-base whitespace-nowrap">
                <Target className="h-4 w-4 mr-2" />
                <span>Target/Capaian</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContents>
            <TabsContent value="isu-spesifik" className="space-y-4">
              <IsuSpesifikTab />
            </TabsContent>

            <TabsContent value="tren-belanja" className="space-y-4">
              <TrenBelanjaTab />
            </TabsContent>

            <TabsContent value="pagu-minus" className="space-y-4">
              <PaguMinusTab />
            </TabsContent>

            <TabsContent value="outstanding-up" className="space-y-4">
              <OutstandingUPTab />
            </TabsContent>

            <TabsContent value="kinerja-utama" className="space-y-4">
              <KinerjaUtamaTab />
            </TabsContent>

            <TabsContent value="target-capaian" className="space-y-4">
              <TargetCapaianTab />
            </TabsContent>
          </TabsContents>
        </Tabs>
      </CardContent>
    </Card>
  );
}
