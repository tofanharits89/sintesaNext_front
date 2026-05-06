"use client";

import { useMemo, useState, useEffect, Fragment } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useLoginHistory } from "@/hooks/use-login-history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  User,
  Menu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMenuUsageTop } from "@/hooks/use-menu-usage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { getRoleDisplayName } from "@/shared/rbac";
import {
  LogUserShellSkeleton,
  LogUserOnlineSkeleton,
  LogUserHistorySkeleton,
  LogUserMenuSkeleton
} from "@/components/ui/loading-fallback";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import kanwilData from "@/data/kdkanwil.json";
import kppnData from "@/data/kdkppn.json";

// Simple tabs using local state
const TABS = [
  { key: "online", label: "User Online", icon: Users },
  { key: "history", label: "Log User History", icon: Clock },
  { key: "menu", label: "Log Menu History", icon: Menu },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function LogUserPage() {
  const { user: currentUser, canManageUsers, isLoading } = useAuth();
  const [active, setActive] = useState<TabKey>("online");
  const {
    onlineUsers,
    isConnected,
    userCount,
    refreshUsers,
    connectionStatus,
    reconnectSocket,
  } = useOnlineUsers();
  const {
    weeklyStats,
    loginHistory,
    pagination,
    isLoading: isLoadingStats,
    error: statsError,
    fetchWeeklyStats,
    fetchLoginHistory,
  } = useLoginHistory();

  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 20;

  // Guard: only super_admin and co_admin
  const allowed =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";

  // Fetch login history when tab is active or page changes
  useEffect(() => {
    if (allowed && active === "history") {
      console.log(`[LogUser] Fetching login history page ${historyPage}...`);
      fetchLoginHistory(itemsPerPage, (historyPage - 1) * itemsPerPage);
    }
  }, [allowed, active, historyPage, fetchLoginHistory]);

  // Debug: Data state changes
  useEffect(() => {
    // Data state monitoring
  }, [
    onlineUsers,
    isConnected,
    connectionStatus,
    loginHistory,
    weeklyStats,
    isLoadingStats,
    statsError,
  ]);

  // Process weekly login data for chart display
  const weeklyLogins = useMemo(() => {
    type ChartData = {
      day: string;
      date: string;
      count: number;
      fullDate: string;
    };

    if (!weeklyStats || weeklyStats.length === 0) {
      // Fallback to show empty chart structure for the last 7 days
      const days: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
        const dateStr = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
        });
        days.push({
          day: dayName,
          date: dateStr,
          count: 0,
          fullDate: date.toISOString().split("T")[0] ?? "",
        });
      }
      return days;
    }

    // Convert API data to chart format with actual dates
    return weeklyStats
      .map((stat) => {
        const date = new Date(stat.date);
        const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
        const dateStr = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
        });
        return {
          day: dayName,
          date: dateStr,
          count: stat.distinctUsers,
          fullDate: stat.date,
        };
      }); // Keep API order (oldest → newest) so chart reads left → right
  }, [weeklyStats]);

  const maxCount = Math.max(...weeklyLogins.map((d) => d.count), 1);

  // Format login date and time with validation
  const formatLoginDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate duration since login
  const calculateLoginDuration = (loginTimestamp: string) => {
    const now = new Date();
    const loginTime = new Date(loginTimestamp);
    const diffMs = now.getTime() - loginTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Baru login";
    if (diffMins < 60) return `${diffMins} menit`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const remainingMins = diffMins % 60;
      return remainingMins > 0
        ? `${diffHours} jam ${remainingMins} menit`
        : `${diffHours} jam`;
    }
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return remainingHours > 0
      ? `${diffDays} hari ${remainingHours} jam`
      : `${diffDays} hari`;
  };

  // Format connection time with validation (keep for backward compatibility if needed)
  const formatConnectionTime = (timestamp: string) => {
    try {
      const now = new Date();
      const connected = new Date(timestamp);

      if (isNaN(connected.getTime())) {
        return "Invalid time";
      }

      const diffMs = now.getTime() - connected.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} hari yang lalu`;
    } catch (error) {
      return "Invalid time";
    }
  };

  // Get connection status info
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case "connected":
        return { icon: Wifi, color: "text-green-500", text: "Terhubung" };
      case "connecting":
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          text: "Menghubungkan...",
        };
      case "disconnected":
        return { icon: WifiOff, color: "text-gray-500", text: "Terputus" };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          text: "Error Koneksi",
        };
      default:
        return {
          icon: WifiOff,
          color: "text-gray-500",
          text: "Tidak Terhubung",
        };
    }
  };

  const statusInfo = getConnectionStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Real menu usage aggregation
  const {
    data: menuAgg,
    month: menuMonth,
    setMonth: setMenuMonth,
    isLoading: isLoadingMenu,
    fetchTop: refreshMenu,
  } = useMenuUsageTop();

  function refreshHistory() {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Page Header - Always Visible */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">
          Log User
        </h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300",
            statusInfo.color,
            "bg-white/50 dark:bg-slate-900/50"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === "connected" ? "bg-green-500 animate-pulse" :
                connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-slate-400"
            )} />
            <span className="text-xs font-semibold hidden md:inline">{statusInfo.text}</span>
          </div>

          <Button
            onClick={() => {
              refreshUsers();
              refreshHistory();
              refreshMenu();
            }}
            variant="outline"
            size="icon"
            className="rounded-lg hover:rotate-180 transition-transform duration-500 h-9 w-9 bg-white/50 dark:bg-slate-900/50"
            disabled={isLoading || isLoadingStats || isLoadingMenu}
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || isLoadingStats || isLoadingMenu) && "animate-spin")} />
          </Button>
        </div>
      </div>
      <Tabs value={active} onValueChange={(v) => setActive(v as TabKey)} className="w-full">
        <div className="border-b border-border/50 pb-3 mb-0">
          <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="h-12 md:h-full px-4 py-0 md:px-5 md:py-0 text-sm md:text-base flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="animate-in fade-in duration-500">
              {active === "online" && <LogUserOnlineSkeleton />}
              {active === "history" && <LogUserHistorySkeleton />}
              {active === "menu" && <LogUserMenuSkeleton />}
            </div>
          ) : !canManageUsers() ? (
            <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-2 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-8 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-sm">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold">Akses Ditolak</h2>
                <p className="text-sm text-balance max-w-xs mx-auto text-rose-600/80 dark:text-rose-400/80">
                  Halaman ini hanya dapat diakses oleh Super Admin dan Co-Admin.
                </p>
              </div>
            </div>
          ) : (
            <TabsContents>
              <TabsContent value="online">
                <div className="space-y-4">
                  {/* Online Users List */}
                  {!isConnected && connectionStatus === "connecting" ? (
                    <LogUserOnlineSkeleton />
                  ) : !isConnected ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>User Online (Real-time)</span>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Koneksi Terputus</p>
                            <p className="text-sm">Tidak dapat menampilkan user online. Status: {statusInfo.text}</p>
                            {(connectionStatus === "disconnected" || connectionStatus === "error") && (
                              <div className="mt-3">
                                <Button onClick={reconnectSocket} variant="default" size="sm" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                                  <Wifi className="h-4 w-4" />
                                  Coba Koneksi Ulang
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Pastikan Anda sudah login dan coba refresh halaman jika masalah berlanjut
                                </p>
                              </div>
                            )}
                          </div>
                        </Alert>
                      </CardContent>
                    </Card>
                  ) : onlineUsers.length === 0 ? (
                    <Alert>
                      <Users className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Tidak Ada User Online</p>
                        <p className="text-sm">Belum ada user yang sedang online saat ini.</p>
                      </div>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>User Online (Real-time)</span>
                            <Badge variant="secondary" className="ml-2">
                              {userCount} Online
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                <TableRow>
                                  <TableHead className="text-center font-bold">Nama Lengkap</TableHead>
                                  <TableHead className="text-center font-bold">Username</TableHead>
                                  <TableHead className="text-center font-bold">Role</TableHead>
                                  <TableHead className="text-center font-bold">Kanwil</TableHead>
                                  <TableHead className="text-center font-bold">KPPN</TableHead>
                                  <TableHead className="text-center font-bold">Lokasi</TableHead>
                                  <TableHead className="text-center font-bold">Waktu Login</TableHead>
                                  <TableHead className="text-center font-bold">Durasi Login</TableHead>
                                  <TableHead className="text-center font-bold">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {onlineUsers.map((userInfo) => (
                                  <TableRow key={userInfo.socketId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell className="font-medium text-center">{userInfo.user.name || "Unknown"}</TableCell>
                                    <TableCell className="font-mono text-sm text-center">{userInfo.user.username || "Unknown"}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className="text-xs">
                                        {getRoleDisplayName(userInfo.user.role as any)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-center">
                                      {userInfo.user.kdkanwil ? (kanwilData.find(k => k.kdkanwil === userInfo.user.kdkanwil)?.nmkanwil || userInfo.user.nmkanwil || "-") : "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-center">
                                      {userInfo.user.kdkppn ? (kppnData.find(k => k.kdkppn === userInfo.user.kdkppn)?.nmkppn || userInfo.user.nmkppn || "-") : "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-center">{userInfo.location || "Tidak diketahui"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-center">{userInfo.loginAt ? formatLoginDateTime(userInfo.loginAt) : "Tidak diketahui"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground text-center">{userInfo.loginAt ? calculateLoginDuration(userInfo.loginAt) : "Tidak diketahui"}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-600">
                                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                        Online
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-3">
                            {onlineUsers.map((userInfo) => (
                              <Card key={userInfo.socketId} className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <p className="font-medium">{userInfo.user.name || "Unknown"}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{userInfo.user.username || "Unknown"}</p>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">{getRoleDisplayName(userInfo.user.role as any)}</Badge>
                                      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-600">
                                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                        Online
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground"><span className="font-medium">Kanwil:</span> {userInfo.user.kdkanwil ? (kanwilData.find(k => k.kdkanwil === userInfo.user.kdkanwil)?.nmkanwil || userInfo.user.nmkanwil || "-") : "-"}</p>
                                      <p className="text-xs text-muted-foreground"><span className="font-medium">KPPN:</span> {userInfo.user.kdkppn ? (kppnData.find(k => k.kdkppn === userInfo.user.kdkppn)?.nmkppn || userInfo.user.nmkppn || "-") : "-"}</p>
                                      <p className="text-xs text-muted-foreground"><span className="font-medium">Lokasi:</span> {userInfo.location || "Tidak diketahui"}</p>
                                      <p className="text-xs text-muted-foreground"><span className="font-medium">Login:</span> {userInfo.loginAt ? formatLoginDateTime(userInfo.loginAt) : "Tidak diketahui"}</p>
                                      <p className="text-xs text-muted-foreground"><span className="font-medium">Durasi:</span> {userInfo.loginAt ? calculateLoginDuration(userInfo.loginAt) : "Tidak diketahui"}</p>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          {isConnected && (
                            <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Data diperbarui secara real-time melalui WebSocket connection</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history">
                {isLoadingStats ? (
                  <LogUserHistorySkeleton />
                ) : statsError ? (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Error Loading Data</p>
                            <p className="text-sm">{statsError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchWeeklyStats(7)}
                              className="mt-2"
                            >
                              Coba Lagi
                            </Button>
                          </div>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Weekly Login Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Login 7 Hari Terakhir</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchWeeklyStats(7)}
                            disabled={isLoadingStats}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`}
                            />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
                            <BarChart
                              data={weeklyLogins}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const entry = payload[0];
                                    if (!entry) return null;
                                    const data = entry.payload;
                                    return (
                                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium">{label}</p>
                                        {data.date && (
                                          <p className="text-sm text-muted-foreground">{data.date}</p>
                                        )}
                                        <p className="text-sm">
                                          <span className="font-medium text-blue-600">{entry.value}</span> login unik
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="fill-blue-500 dark:fill-blue-600" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Menampilkan jumlah login unik per hari dalam 7 hari terakhir.
                          </div>
                          {weeklyStats && weeklyStats.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Total login unik: {weeklyStats.reduce((sum, stat) => sum + stat.distinctUsers, 0)} | Total login: {weeklyStats.reduce((sum, stat) => sum + stat.totalLogins, 0)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Login History */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Riwayat Login Terbaru</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setHistoryPage(1);
                              fetchLoginHistory(itemsPerPage, 0);
                            }}
                            disabled={isLoadingStats}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {loginHistory && loginHistory.length > 0 ? (
                              loginHistory.map((entry) => {
                                const loginTime = new Date(entry.loginTimestamp);
                                const timeAgo = calculateLoginDuration(entry.loginTimestamp);

                                return (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{entry.userName || entry.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {entry.userRole} 
                                          {entry.kdkanwil && ` | Kanwil: ${kanwilData.find(k => k.kdkanwil === entry.kdkanwil)?.nmkanwil || entry.nmkanwil}`}
                                          {entry.kdkppn && ` | KPPN: ${kppnData.find(k => k.kdkppn === entry.kdkppn)?.nmkppn || entry.nmkppn}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Lokasi: {entry.location || "Tidak diketahui"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-mono">IP: {entry.ipAddress || "-"}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-medium">
                                        {loginTime.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8">
                                <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Belum ada riwayat login</p>
                              </div>
                            )}
                          </div>

                          {/* Pagination Controls */}
                          {pagination && pagination.totalPages > 1 && (
                            <div className="pt-4 border-t">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                      className={cn(
                                        "cursor-pointer",
                                        historyPage === 1 && "pointer-events-none opacity-50"
                                      )}
                                    />
                                  </PaginationItem>

                                  {/* Show a limited number of page numbers */}
                                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (pagination.totalPages > 5) {
                                      if (historyPage > 3) {
                                        pageNum = historyPage - 2 + i;
                                        if (pageNum > pagination.totalPages) {
                                          pageNum = pagination.totalPages - 4 + i;
                                        }
                                      }
                                    }
                                    if (pageNum <= 0 || pageNum > pagination.totalPages) return null;
                                    return (
                                      <PaginationItem key={pageNum}>
                                        <PaginationLink
                                          isActive={historyPage === pageNum}
                                          onClick={() => setHistoryPage(pageNum)}
                                          className="cursor-pointer"
                                        >
                                          {pageNum}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  })}

                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => setHistoryPage((p) => Math.min(pagination.totalPages, p + 1))}
                                      className={cn(
                                        "cursor-pointer",
                                        historyPage === pagination.totalPages && "pointer-events-none opacity-50"
                                      )}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                              <div className="text-center mt-2 text-xs text-muted-foreground">
                                Halaman {historyPage} dari {pagination.totalPages} ({pagination.totalItems} total entri)
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="menu">
                {isLoadingMenu ? (
                  <LogUserMenuSkeleton />
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Bulan:</div>
                          <Select
                            value={menuMonth}
                            onValueChange={(val) => {
                              setMenuMonth(val);
                              // Refresh after changing month
                              refreshMenu(val);
                            }}
                          >
                            <SelectTrigger size="sm">
                              <SelectValue placeholder="Pilih bulan" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }).map((_, idx) => {
                                // Anchor to the first day to avoid month rollover (e.g., 31st → next month)
                                const d = new Date();
                                d.setDate(1);
                                d.setMonth(d.getMonth() - idx);

                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, "0");
                                const val = `${year}-${month}`;
                                const label = d.toLocaleString("id-ID", { month: "long", year: "numeric" });
                                return (
                                  <SelectItem key={val} value={val}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => refreshMenu()}>
                          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                        </Button>
                      </div>

                      <CardTitle>Menu Paling Sering Diakses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-md border bg-white dark:bg-neutral-900">
                        <Table>
                          <TableHeader className="bg-slate-600 dark:bg-slate-800 [&_th]:text-white">
                            <TableRow>
                              <TableHead>Menu</TableHead>
                              <TableHead className="w-32 text-right">Akses</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {menuAgg.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2}>
                                  <div className="py-6 text-center text-sm text-muted-foreground">Tidak ada data untuk bulan {menuMonth}</div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              menuAgg.map((parent) => (
                                <Fragment key={parent?.menu || Math.random()}>
                                  <TableRow key={parent?.menu || Math.random()} className="bg-muted/40">
                                    <TableCell className="font-medium">{parent?.menu || "Unknown"}</TableCell>
                                    <TableCell className="text-right font-medium">{parent?.total || 0}</TableCell>
                                  </TableRow>
                                  {(parent?.items || []).map((it) => (
                                    <TableRow key={`${parent?.menu}__${it?.submenu || Math.random()}`}>
                                      <TableCell className="pl-8 text-sm text-muted-foreground">{it?.submenu || "Unknown"}</TableCell>
                                      <TableCell className="text-right text-sm text-muted-foreground">{it?.count || 0}</TableCell>
                                    </TableRow>
                                  ))}
                                </Fragment>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        Catatan: Ganti dengan data agregasi log akses menu dari backend.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </TabsContents>
          )}
        </div>
      </Tabs>
    </div>
  );
}

export const dynamic = "force-dynamic";
