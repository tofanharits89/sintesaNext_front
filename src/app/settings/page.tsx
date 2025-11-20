"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  Lock,
  MessageCircle,
} from "lucide-react";
import { WhatsAppSettingsTab } from "./whatsapp-settings-tab";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const u = user as { name?: string; email?: string; role?: string; location?: string } | undefined;
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("id");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true,
    sound: false,
  });

  // Guard against cases where the profile query finished but user data isn't available yet
  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
        <div className="h-64 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2">
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
                          setNotifications((prev) => ({
                            ...prev,
                            email: checked,
                          }))
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
                          setNotifications((prev) => ({ ...prev, push: checked }))
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
                          setNotifications((prev) => ({
                            ...prev,
                            desktop: checked,
                          }))
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
                          setNotifications((prev) => ({
                            ...prev,
                            sound: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* WhatsApp Settings Tab */}
          <TabsContent value="whatsapp">
            <WhatsAppSettingsTab />
          </TabsContent>

          {/* System Settings Tab */}
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
        </TabsContents>
      </Tabs>


    </div>
  );
}
