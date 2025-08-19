"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, FileText, Calendar, User, MapPin, CreditCard } from "lucide-react";
import carisatkerData from "@/data/carisatker.json";
import { SatkerProfileTab } from "@/components/satker/satker-profile-tab";
import { DipaDownloadTab } from "@/components/satker/dipa-download-tab";

interface SatkerData {
  kdsatker: string;
  nmsatker: string;
}

export default function SatkerDetailPage() {
  const params = useParams();
  const kdsatker = params.kdsatker as string;
  const [satkerData, setSatkerData] = useState<SatkerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find satker data from JSON
    const foundSatker = carisatkerData.find(item => item.kdsatker === kdsatker);
    setSatkerData(foundSatker || null);
    setLoading(false);
  }, [kdsatker]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!satkerData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Satker Tidak Ditemukan</h2>
            <p className="text-muted-foreground text-center">
              Satuan kerja dengan kode {kdsatker} tidak ditemukan dalam database.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{satkerData.nmsatker}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-mono">
            {satkerData.kdsatker}
          </Badge>
          <span>Kode Satker</span>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2 h-11 font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 text-slate-600 dark:text-slate-400">
            <User className="h-4 w-4" />
            Profil Satker
          </TabsTrigger>
          <TabsTrigger value="dipa-download" className="flex items-center gap-2 h-11 font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 text-slate-600 dark:text-slate-400">
            <FileText className="h-4 w-4" />
            Unduh ADK/DIPA
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 h-11 font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 text-slate-600 dark:text-slate-400">
            <CreditCard className="h-4 w-4" />
            Dokumen Lainnya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SatkerProfileTab satkerData={satkerData} />
        </TabsContent>

        <TabsContent value="dipa-download">
          <DipaDownloadTab kdsatker={kdsatker} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Lainnya</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fitur dokumen lainnya akan segera tersedia.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}