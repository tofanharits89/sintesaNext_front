"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataKmkTab } from "@/components/transfer-daerah/data-kmk-tab";
import { DataTransaksiTab } from "@/components/transfer-daerah/data-transaksi-tab";
import { RekonsiliasiDataTab } from "@/components/transfer-daerah/rekonsilisasi-data-tab";

export default function DAUPage() {
  const [selectedYear, setSelectedYear] = useState("2024");

  // Generate years from current year back to 2020
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) =>
    (currentYear - i).toString()
  );

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

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tahun:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
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
      <Tabs defaultValue="data-kmk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 border shadow-sm p-2 h-15 gap-2 rounded-lg">
          <TabsTrigger
            value="data-kmk"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Data KMK
          </TabsTrigger>
          <TabsTrigger
            value="data-transaksi"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Data Transaksi
          </TabsTrigger>
          <TabsTrigger
            value="rekonsilisasi-data"
            className="text-sm font-semibold data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 data-[state=inactive]:hover:text-slate-600 transition-all duration-200 rounded-md py-3 px-4"
          >
            Rekonsilisasi Data
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="data-kmk"
          className="animate-in fade-in-50 duration-200"
        >
          <DataKmkTab selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent
          value="data-transaksi"
          className="animate-in fade-in-50 duration-200"
        >
          <DataTransaksiTab selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent
          value="rekonsilisasi-data"
          className="animate-in fade-in-50 duration-200"
        >
          <RekonsiliasiDataTab selectedYear={selectedYear} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
