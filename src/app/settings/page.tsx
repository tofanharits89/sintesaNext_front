"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { attachCSRFToken } from "@/lib/security/csrfManager";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  Shield,
  Lock,
  MessageCircle,
} from "lucide-react";
import { WhatsAppSettingsTab } from "./whatsapp-settings-tab";

export default function SettingsPage() {
  const { user, isLoading, refetch } = useAuth();
  const [allowMultiSession, setAllowMultiSession] = useState<boolean>(false);
  const [isUpdatingMultiSession, setIsUpdatingMultiSession] = useState(false);

  useEffect(() => {
    if (user && "allowMultiSession" in user) {
      setAllowMultiSession((user as any).allowMultiSession === true);
    }
  }, [user]);

  const handleMultiSessionToggle = async (checked: boolean) => {
    setAllowMultiSession(checked);
    setIsUpdatingMultiSession(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      await attachCSRFToken(headers);
      const res = await fetch("/api/v1/users/profile/me", {
        method: "PUT",
        headers,
        body: JSON.stringify({ allowMultiSession: checked }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan pengaturan");
      toast.success("Pengaturan perangkat berhasil diperbarui.");
      refetch();
    } catch (err: any) {
      setAllowMultiSession(!checked);
      toast.error(err.message || "Gagal memperbarui pengaturan");
    } finally {
      setIsUpdatingMultiSession(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2 min-h-9">
        <h1 className="text-xl font-semibold">Pengaturan</h1>
      </div>

      <Tabs defaultValue="general" className="w-full gap-3">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            <TabsTrigger value="general" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="whitespace-nowrap">Umum</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="whitespace-nowrap">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="whitespace-nowrap">Sistem</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContents>
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            {isLoading || !user ? (
              <SettingsContentSkeleton />
            ) : (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Keamanan Akun
                    </CardTitle>
                    <CardDescription>
                      Atur preferensi keamanan akun Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Multi-Device Login</Label>
                        <p className="text-sm text-muted-foreground pr-4">
                          Izinkan akun Anda login di beberapa perangkat secara bersamaan. Jika dinonaktifkan, login baru akan otomatis mengeluarkan akun dari perangkat lain.
                        </p>
                      </div>
                      <Switch
                        checked={allowMultiSession}
                        onCheckedChange={handleMultiSessionToggle}
                        disabled={isUpdatingMultiSession}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* WhatsApp Settings Tab */}
          <TabsContent value="whatsapp">
            {isLoading || !user ? <SettingsContentSkeleton /> : <WhatsAppSettingsTab />}
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            {isLoading || !user ? (
              <SettingsContentSkeleton />
            ) : (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Pengaturan Sistem
                    </CardTitle>
                    <CardDescription>
                      Konfigurasi tingkat sistem (hanya untuk administrator)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Mode Maintenance</Label>
                          <p className="text-sm text-muted-foreground">
                            Aktifkan mode maintenance untuk sistem
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Debug Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Aktifkan mode debug untuk troubleshooting
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Cache TTL (detik)</Label>
                        <Input type="number" placeholder="3600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
}

function SettingsContentSkeleton() {
  return (
    <div className="mt-6 space-y-6 animate-in fade-in duration-500">
      <div className="rounded-lg border p-6 space-y-4 shadow-sm bg-white dark:bg-neutral-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
