"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUnifiedAuth } from "@/lib/auth";
import { getUserAccessDescription } from "@/utils/satker-rbac";
import { User, Shield, Building2 } from "lucide-react";

export function RBACDemo() {
  const { user: currentUser, isLoading } = useUnifiedAuth();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status Akses Satker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Silakan login untuk melihat level akses Anda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Status Akses Satker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentUser.name}</span>
          <Badge variant="outline">{currentUser.role}</Badge>
        </div>
        
        {currentUser.kdkanwil && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Kanwil: {currentUser.kdkanwil} 
              {currentUser.nmkanwil && ` (${currentUser.nmkanwil})`}
            </span>
          </div>
        )}

        {currentUser.kdkppn && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              KPPN: {currentUser.kdkppn} 
              {currentUser.nmkppn && ` (${currentUser.nmkppn})`}
            </span>
          </div>
        )}

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Level Akses:</p>
          <p className="text-sm text-muted-foreground">
            {getUserAccessDescription(currentUser)}
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Keterangan:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Super Admin & Co-Admin: Akses ke semua satker</li>
            <li>Kantor Pusat: Akses ke semua satker</li>
            <li>Kanwil DJPb: Hanya satker dalam kanwil yang sama</li>
            <li>KPPN: Hanya satker dalam KPPN yang sama</li>
            <li>User Lainnya: Tidak ada akses ke data satker</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}