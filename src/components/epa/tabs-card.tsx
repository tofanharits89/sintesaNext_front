"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Tabs defaultValue="isu-spesifik" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger
              value="isu-spesifik"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Isu Spesifik</span>
            </TabsTrigger>

            <TabsTrigger
              value="tren-belanja"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Tren Belanja</span>
            </TabsTrigger>

            <TabsTrigger
              value="pagu-minus"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <Minus className="h-4 w-4" />
              <span>Pagu Minus</span>
            </TabsTrigger>

            <TabsTrigger
              value="outstanding-up"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <Clock className="h-4 w-4" />
              <span>Outstanding UP</span>
            </TabsTrigger>

            <TabsTrigger
              value="kinerja-utama"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <Star className="h-4 w-4" />
              <span>Kinerja Utama</span>
            </TabsTrigger>

            <TabsTrigger
              value="target-capaian"
              className="flex flex-col items-center gap-1 p-3 text-xs"
            >
              <Target className="h-4 w-4" />
              <span>Target/Capaian</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
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
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
