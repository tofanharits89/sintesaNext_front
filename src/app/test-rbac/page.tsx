"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RBACDemo } from "@/components/demo/rbac-demo";
import { useUnifiedAuth } from "@/lib/auth";
import { filterSatkerByUserAccess } from "@/utils/satker-rbac";
import carisatkerData from "@/data/carisatker.json";
import { Building2, Users, Shield } from "lucide-react";

export default function TestRBACPage() {
  const { user: currentUser, isLoading } = useUnifiedAuth();

  // Get accessible satkers for current user
  const accessibleSatkers = currentUser 
    ? filterSatkerByUserAccess(carisatkerData, currentUser)
    : [];

  // Get unique kanwil codes from accessible satkers
  const accessibleKanwils = [...new Set(accessibleSatkers.map(s => s.kdkanwil))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Test Role-Based Access Control</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Halaman ini menunjukkan bagaimana sistem RBAC bekerja untuk pencarian satker berdasarkan kdkanwil pengguna.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Access Info */}
        <RBACDemo />

        {/* Access Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Statistik Akses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Satker dalam Database:</span>
                  <span className="text-lg font-bold">{carisatkerData.length.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Satker yang Dapat Diakses:</span>
                  <span className="text-lg font-bold text-primary">
                    {accessibleSatkers.length.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Kanwil yang Dapat Diakses:</span>
                  <span className="text-lg font-bold text-primary">
                    {accessibleKanwils.length}
                  </span>
                </div>

                {currentUser && currentUser.role === "kanwil_djpb" && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Akses Terbatas pada Kanwil {currentUser.kdkanwil}
                    </p>
                    <p className="text-xs text-blue-600">
                      Anda hanya dapat melihat satker yang berada dalam kanwil yang sama dengan Anda.
                    </p>
                  </div>
                )}

                {currentUser && currentUser.role === "kppn" && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Akses Terbatas pada KPPN {currentUser.kdkppn}
                    </p>
                    <p className="text-xs text-blue-600">
                      Anda hanya dapat melihat satker yang berada dalam KPPN yang sama dengan Anda.
                    </p>
                  </div>
                )}

                {currentUser && (currentUser.role === "super_admin" || currentUser.role === "co_admin" || currentUser.role === "kantor_pusat") && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Akses Penuh
                    </p>
                    <p className="text-xs text-green-600">
                      Anda dapat melihat semua satker dalam database.
                    </p>
                  </div>
                )}

                {currentUser && currentUser.role === "lainnya" && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      Tidak Ada Akses
                    </p>
                    <p className="text-xs text-orange-600">
                      Anda tidak memiliki akses untuk melihat data satker.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Accessible Satkers */}
      {accessibleSatkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contoh Satker yang Dapat Diakses (10 pertama)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accessibleSatkers.slice(0, 10).map((satker) => (
                <div
                  key={satker.kdsatker}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{satker.nmsatker}</p>
                  <p className="text-xs text-muted-foreground">
                    Kode: {satker.kdsatker} | Kanwil: {satker.kdkanwil}
                  </p>
                </div>
              ))}
            </div>
            {accessibleSatkers.length > 10 && (
              <p className="text-sm text-muted-foreground mt-3 text-center">
                ... dan {(accessibleSatkers.length - 10).toLocaleString()} satker lainnya
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}