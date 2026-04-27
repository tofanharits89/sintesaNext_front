"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DakFisik from "./dak_fisik";
import DD_header from "./dd_header";
import DNF from "./dnf";

export function LandingDownloadDataset() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Download Dataset TKD
        </h1>
        <p className="text-sm text-muted-foreground">
          DAK Fisik / Dana Desa / TPG &amp; BOS-BOP
        </p>
      </div>

      <Tabs defaultValue="dak_fisik" className="w-full">
        <TabsList className="w-full h-auto p-2 rounded-xl grid grid-cols-3 gap-2">
          <TabsTrigger value="dak_fisik" className="h-10 text-sm">
            DAK Fisik
          </TabsTrigger>
          <TabsTrigger value="dana_desa" className="h-10 text-sm">
            Dana Desa
          </TabsTrigger>
          <TabsTrigger value="tpg_bos" className="h-10 text-sm">
            TPG &amp; BOS-BOP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dak_fisik" className="mt-4">
          <DakFisik />
        </TabsContent>

        <TabsContent value="dana_desa" className="mt-4">
          <DD_header />
        </TabsContent>

        <TabsContent value="tpg_bos" className="mt-4">
          <DNF />
        </TabsContent>
      </Tabs>
    </div>
  );
}
