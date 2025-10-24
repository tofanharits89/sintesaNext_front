"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { DataKmkTab, DataTransaksiTab, RekonsiliasiDataTab } from "@/components/lazy";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { Suspense } from "react";

export default function DAUPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dana Alokasi Umum
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data DAU, transaksi, dan rekonsilisasi
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="data-kmk" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-12 md:h-14 p-2 rounded-xl">
            <TabsTrigger value="data-kmk" className="h-full px-4 md:px-5 py-0 text-base">
              Data KMK
            </TabsTrigger>
            <TabsTrigger value="data-transaksi" className="h-full px-4 md:px-5 py-0 text-base">
              Data Transaksi
            </TabsTrigger>
            <TabsTrigger value="rekonsilisasi-data" className="h-full px-4 md:px-5 py-0 text-base">
              Rekonsilisasi Data
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="data-kmk">
            <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
              <DataKmkTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="data-transaksi">
            <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
              <DataTransaksiTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="rekonsilisasi-data">
            <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
              <RekonsiliasiDataTab />
            </Suspense>
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
