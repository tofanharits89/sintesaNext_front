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
            <TabsList className="w-full h-12 md:h-14 p-2 rounded-xl">
              <TabsTrigger value="isu-spesifik" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Isu Spesifik</span>
              </TabsTrigger>

              <TabsTrigger value="tren-belanja" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Tren Belanja</span>
              </TabsTrigger>

              <TabsTrigger value="pagu-minus" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
                <Minus className="h-4 w-4 mr-2" />
                <span>Pagu Minus</span>
              </TabsTrigger>

              <TabsTrigger value="outstanding-up" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
                <Clock className="h-4 w-4 mr-2" />
                <span>Outstanding UP</span>
              </TabsTrigger>

              <TabsTrigger value="kinerja-utama" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
                <Star className="h-4 w-4 mr-2" />
                <span>Kinerja Utama</span>
              </TabsTrigger>

              <TabsTrigger value="target-capaian" className="h-full px-4 md:px-5 py-0 text-sm md:text-base">
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
