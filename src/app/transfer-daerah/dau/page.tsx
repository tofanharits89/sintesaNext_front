"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { DataKmkTab } from "@/components/transfer-daerah/data-kmk-tab";
import { DataTransaksiTab } from "@/components/transfer-daerah/data-transaksi-tab";
import { RekonsiliasiDataTab } from "@/components/transfer-daerah/rekonsilisasi-data-tab";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DAUPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("data-kmk");
  const [rekonHeaderAction, setRekonHeaderAction] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      const isAdmin = user.role === "super_admin" || user.role === "co_admin";
      const isDitpa = user.role === "ditpa";
      if (!isAdmin && !isDitpa) {
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  // Normalize role detection
  const userRole = String(user?.role || "").toLowerCase();
  const isKppnUser = userRole === "kppn" || userRole === "3";
  const isKanwilUser =
    userRole === "kanwil_djpb" ||
    userRole === "kanwil" ||
    userRole === "2" ||
    userRole.includes("kanwil");

  // KdKanwil normalization: some users might have it as kd_kanwil or kdkanwil
  const userKdKanwil = user?.kdkanwil || (user as any)?.kd_kanwil;
  const userKdKppn = user?.kdkppn || (user as any)?.kd_kppn;

  const unitLabel = useMemo(() => {
    if (isKanwilUser) {
      const nm = user?.nmkanwil || (user as any)?.nm_kanwil || "";
      if (nm) {
        return nm.toUpperCase().startsWith("KANWIL DJPB") ? nm : `Kanwil DJPb ${nm}`;
      }
      return `Kanwil DJPb ${userKdKanwil || ""}`;
    }
    if (isKppnUser) {
      return user?.nmkppn || (user as any)?.nm_kppn || `KPPN ${userKdKppn || ""}`;
    }
    return "";
  }, [isKanwilUser, isKppnUser, user, userKdKanwil, userKdKppn]);

  // Parameters to pass to child components - enforced based on role
  const scopeParams = useMemo(() => ({
    kdkanwil: isKanwilUser ? userKdKanwil : undefined,
    kdkppn: isKppnUser ? userKdKppn : undefined,
  }), [isKanwilUser, isKppnUser, userKdKanwil, userKdKppn]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "super_admin" || user.role === "co_admin";
  const isDitpa = user.role === "ditpa";
  if (!isAdmin && !isDitpa) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dana Alokasi Umum
          </h1>
          <p className="text-sm text-muted-foreground">
            {unitLabel ? `Unit: ${unitLabel}` : "Kelola data DAU, transaksi, dan rekonsilisasi"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "rekonsilisasi-data" && rekonHeaderAction ? (
            <div className="flex items-center gap-2">
              {rekonHeaderAction}
            </div>
          ) : null}
        </div>
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
            <DataKmkTab 
              kdkanwil={scopeParams.kdkanwil} 
              kdkppn={scopeParams.kdkppn} 
            />
          </TabsContent>

          <TabsContent value="data-transaksi">
            <DataTransaksiTab 
              kdkanwil={scopeParams.kdkanwil} 
              kdkppn={scopeParams.kdkppn} 
            />
          </TabsContent>

          <TabsContent value="rekonsilisasi-data">
            <RekonsiliasiDataTab 
              onHeaderActionChange={setRekonHeaderAction} 
              kdkanwil={scopeParams.kdkanwil} 
              kdkppn={scopeParams.kdkppn}
            />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

