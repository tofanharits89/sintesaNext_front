"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import carisatkerData from "@/data/carisatker.json";

export default function SatkerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<typeof carisatkerData>([]);
  const router = useRouter();

  const handleSearch = () => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = carisatkerData.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.kdsatker.toLowerCase().includes(searchLower) ||
        item.nmsatker.toLowerCase().includes(searchLower)
      );
    }).slice(0, 20); // Limit to 20 results

    setSearchResults(filtered);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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

      {/* Search */}
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

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Hasil Pencarian ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((satker) => (
                <div
                  key={satker.kdsatker}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/satker/${satker.kdsatker}`)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{satker.nmsatker}</p>
                      <p className="text-sm text-muted-foreground">
                        Kode: {satker.kdsatker}
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

      {/* No Results */}
      {searchTerm.length >= 2 && searchResults.length === 0 && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Hasil</h3>
            <p className="text-muted-foreground">
              Tidak ditemukan satker yang sesuai dengan pencarian "{searchTerm}".
              Coba gunakan kata kunci yang berbeda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}