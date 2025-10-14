"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ArrowRight, Shield, Info } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { getUserAccessDescription } from "@/utils/satker-rbac";
import { useSatkerSearch } from "@/hooks/use-satker-data";
import { formatSatkerDisplayName, formatSatkerSubtitle } from "@/utils/satker-data";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SatkerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { user: currentUser, isLoading } = useUnifiedAuth();
  const { results: apiResults, loading: apiLoading, error: apiError, searchSatker } = useSatkerSearch();

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      return;
    }

    await searchSatker(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Pencarian Satker</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Cari informasi satuan kerja berdasarkan kode satker atau nama satker. 
          Klik pada hasil pencarian untuk melihat profil lengkap satker.
        </p>
      </div>

      {/* Access Level Information */}
      {currentUser && (
        <Alert className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Level Akses Anda:</strong> {getUserAccessDescription(currentUser)}
          </AlertDescription>
        </Alert>
      )}

      {/* No Access Warning */}
      {currentUser && currentUser.role === "lainnya" && (
        <Alert className="max-w-2xl mx-auto border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Anda tidak memiliki akses untuk mencari data satker. Silakan hubungi administrator untuk mendapatkan akses.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      {currentUser && currentUser.role !== "lainnya" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Cari Satker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Masukkan kode satker atau nama satker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {apiResults.length > 0 && currentUser && currentUser.role !== "lainnya" && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>
              Hasil Pencarian ({apiResults.length})
              {apiLoading && <span className="text-sm font-normal text-muted-foreground ml-2">(Memuat...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {apiResults.map((satker) => (
                <div
                  key={satker.kdsatker}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/satker/${satker.kdsatker}`)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{formatSatkerDisplayName(satker)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSatkerSubtitle(satker)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Error */}
      {apiError && searchTerm.length >= 2 && currentUser && currentUser.role !== "lainnya" && (
        <Alert className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {apiError}
          </AlertDescription>
        </Alert>
      )}

      {/* No Results */}
      {searchTerm.length >= 2 && 
       apiResults.length === 0 && !apiLoading && !apiError &&
       currentUser && currentUser.role !== "lainnya" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Hasil</h3>
            <p className="text-muted-foreground">
              Tidak ditemukan satker yang sesuai dengan pencarian "{searchTerm}" dalam area akses Anda.
              {currentUser.role === "kanwil_djpb" 
                ? ` Pencarian terbatas pada Kanwil ${currentUser.kdkanwil}.`
                : currentUser.role === "kppn"
                ? ` Pencarian terbatas pada KPPN ${currentUser.kdkppn}.`
                : " Coba gunakan kata kunci yang berbeda."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}