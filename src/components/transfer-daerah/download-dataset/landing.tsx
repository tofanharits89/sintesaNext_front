"use client";

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
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

      <Tabs defaultValue="dak_fisik" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger
              value="dak_fisik"
              className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              DAK Fisik
            </TabsTrigger>
            <TabsTrigger
              value="dana_desa"
              className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              Dana Desa
            </TabsTrigger>
            <TabsTrigger
              value="tpg_bos"
              className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap"
            >
              TPG &amp; BOS-BOP
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="dak_fisik">
            <DakFisik />
          </TabsContent>

          <TabsContent value="dana_desa">
            <DD_header />
          </TabsContent>

          <TabsContent value="tpg_bos">
            <DNF />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}
