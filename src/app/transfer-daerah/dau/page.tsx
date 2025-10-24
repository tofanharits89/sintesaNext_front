"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <Tabs defaultValue="data-kmk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 border shadow-sm p-2 h-15 gap-2 rounded-lg">
          <TabsTrigger
            value="data-kmk"
            className="text-sm font-semibold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Data KMK
          </TabsTrigger>
          <TabsTrigger
            value="data-transaksi"
            className="text-sm font-semibold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Data Transaksi
          </TabsTrigger>
          <TabsTrigger
            value="rekonsilisasi-data"
            className="text-sm font-semibold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Rekonsilisasi Data
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="data-kmk"
          className="animate-in fade-in-50 duration-200"
        >
          <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
            <DataKmkTab />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="data-transaksi"
          className="animate-in fade-in-50 duration-200"
        >
          <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
            <DataTransaksiTab />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="rekonsilisasi-data"
          className="animate-in fade-in-50 duration-200"
        >
          <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} /> }>
            <RekonsiliasiDataTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';
