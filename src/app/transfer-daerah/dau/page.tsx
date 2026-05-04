"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { DataKmkTab } from "@/components/transfer-daerah/data-kmk-tab";
import { DataTransaksiTab } from "@/components/transfer-daerah/data-transaksi-tab";
import { RekonsiliasiDataTab } from "@/components/transfer-daerah/rekonsilisasi-data-tab";

export default function DAUPage() {
  const [activeTab, setActiveTab] = useState("data-kmk");
  const [rekonHeaderAction, setRekonHeaderAction] = useState<React.ReactNode>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dana Alokasi Umum
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data DAU, transaksi, dan rekonsilisasi
          </p>
        </div>
        {activeTab === "rekonsilisasi-data" && rekonHeaderAction ? (
          <div className="flex items-center gap-2">
            {rekonHeaderAction}
          </div>
        ) : null}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full gap-3"
      >
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger value="data-kmk" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap">
              Data KMK
            </TabsTrigger>
            <TabsTrigger value="data-transaksi" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap">
              Data Transaksi
            </TabsTrigger>
            <TabsTrigger value="rekonsilisasi-data" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center whitespace-nowrap">
              Rekonsilisasi Data
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="data-kmk">
            <DataKmkTab />
          </TabsContent>

          <TabsContent value="data-transaksi">
            <DataTransaksiTab />
          </TabsContent>

          <TabsContent value="rekonsilisasi-data">
            <RekonsiliasiDataTab onHeaderActionChange={setRekonHeaderAction} />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

