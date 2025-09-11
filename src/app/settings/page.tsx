"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PerformanceMonitoringDashboard } from "@/components/dashboard/PerformanceMonitoringDashboard";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/rbac";
import { 
  Settings, 
  User, 
  Monitor, 
  Shield, 
  Palette, 
  Bell, 
  Globe, 
  Lock,
  Save
} from "lucide-react";

export default function SettingsPage() {
  const { user, isUserLoading } = useAuth();
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("id");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true,
    sound: false
  });

  // Check if user can access performance monitoring
  const canAccessPerformanceMonitor = user && (user.role === 'super_admin' || user.role === 'co_admin');
  
  // Check if user can access system settings
  const canAccessSystemSettings = user && hasPermission(user, 'settings', 'view');

  if (isUserLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
        <div className="h-64 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola preferensi aplikasi, profil, dan pengaturan sistem Anda.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          {canAccessPerformanceMonitor && (
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitor Performa
            </TabsTrigger>
          )}
          {canAccessSystemSettings && (
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sistem
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Tema Aplikasi
                </CardTitle>
                <CardDescription>
                  Pilih tema yang sesuai dengan preferensi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Tema</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Terang</SelectItem>
                      <SelectItem value="dark">Gelap</SelectItem>
                      <SelectItem value="system">Sistem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Bahasa
                </CardTitle>
                <CardDescription>
                  Pilih bahasa untuk antarmuka aplikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language-select">Bahasa</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifikasi
                </CardTitle>
                <CardDescription>
                  Atur preferensi notifikasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifikasi Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Terima notifikasi melalui email
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email} 
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, email: checked }))
                      } 
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifikasi Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Terima notifikasi push di browser
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push} 
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, push: checked }))
                      } 
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifikasi Desktop</Label>
                      <p className="text-sm text-muted-foreground">
                        Tampilkan notifikasi desktop
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.desktop} 
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, desktop: checked }))
                      } 
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Suara Notifikasi</Label>
                      <p className="text-sm text-muted-foreground">
                        Putar suara saat ada notifikasi
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.sound} 
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, sound: checked }))
                      } 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6">
            {/* Basic Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Profil
                </CardTitle>
                <CardDescription>
                  Kelola informasi dasar profil Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input 
                      id="name" 
                      value={user?.name || ''} 
                      placeholder="Masukkan nama lengkap"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ''} 
                      placeholder="Masukkan email"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{user?.role || 'N/A'}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi</Label>
                    <Input 
                      id="location" 
                      value={user?.location || 'N/A'} 
                      placeholder="Lokasi kerja"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Keamanan
                </CardTitle>
                <CardDescription>
                  Kelola pengaturan keamanan akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full md:w-auto">
                    Ubah Password
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Terakhir diubah: Belum pernah
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Monitor Tab */}
        {canAccessPerformanceMonitor && (
          <TabsContent value="performance" className="space-y-6">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium">Monitor Performa Sistem</h3>
                <p className="text-sm text-muted-foreground">
                  Pantau performa cache, kompresi, dan kesehatan sistem secara real-time.
                </p>
              </div>
              <PerformanceMonitoringDashboard />
            </div>
          </TabsContent>
        )}

        {/* System Settings Tab */}
        {canAccessSystemSettings && (
          <TabsContent value="system" className="space-y-6">
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
          </TabsContent>
        )}
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}

