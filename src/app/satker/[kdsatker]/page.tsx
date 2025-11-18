"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, FileText, Calendar, User, MapPin, CreditCard, Shield, AlertTriangle } from "lucide-react";
import { SatkerProfileTab } from "@/components/satker/satker-profile-tab";
import { DipaDownloadTab } from "@/components/satker/dipa-download-tab";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSatkerData } from "@/hooks/use-satker-data";

interface SatkerData {
  kdsatker: string;
  nmsatker: string;
  kdkppn: string;
  kdkanwil: string;
}

export default function SatkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kdsatker = params?.kdsatker as string;
  const { user: currentUser, isLoading: userLoading } = useAuth();
  const { data: satkerData, loading, error } = useSatkerData(kdsatker);

  // Check if user has access to this satker
  // For now, allow access if user is authenticated and satker data exists
  // TODO: Implement proper satker-level access control based on kdkanwil/kdkppn
  const hasAccess = currentUser && satkerData ? true : false;

  if (loading || userLoading) {
    return (
      <div>
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
      <div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Satker Tidak Ditemukan</h2>
            <p className="text-muted-foreground text-center">
              Satuan kerja dengan kode {kdsatker} tidak ditemukan dalam database.
            </p>
            <Button
              onClick={() => router.push('/satker')}
              className="mt-4"
              variant="outline"
            >
              Kembali ke Pencarian
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check access control
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Akses Ditolak:</strong> Anda tidak memiliki akses untuk melihat detail satker ini.
            {currentUser?.role === "kanwil_djpb"
              ? ` Satker ini berada di luar area Kanwil ${currentUser.kdkanwil} Anda.`
              : currentUser?.role === "kppn"
              ? ` Satker ini berada di luar area KPPN ${currentUser.kdkppn} Anda.`
              : " Silakan hubungi administrator untuk mendapatkan akses."
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Terbatas</h2>
            <p className="text-muted-foreground text-center mb-4">
              Anda tidak memiliki izin untuk mengakses informasi satker dengan kode {kdsatker}.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/satker')}
                variant="outline"
              >
                Kembali ke Pencarian
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="default"
              >
                Ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Badge variant="secondary" className="font-mono">
            Kanwil: {satkerData.kdkanwil}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger value="profile" className="h-12 md:h-full px-3 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2 whitespace-nowrap">
              <User className="h-4 w-4" />
              <span>Profil Satker</span>
            </TabsTrigger>
            <TabsTrigger value="dipa-download" className="h-12 md:h-full px-3 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span>Unduh ADK/DIPA</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="h-12 md:h-full px-3 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              <span>Dokumen Lainnya</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContents>
          <TabsContent value="profile">
            <SatkerProfileTab kdsatker={kdsatker} />
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
        </TabsContents>
      </Tabs>
    </div>
  );
}