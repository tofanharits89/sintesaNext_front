"use client";

import { useMemo, useState, useEffect, Fragment } from "react";
import { useUnifiedAuth } from "@/lib/auth";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useLoginHistory } from "@/hooks/use-login-history";
import { Button } from "@/components/ui/button";
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

import { getRoleDisplayName } from "@/lib/rbac";

// Simple tabs using local state
const TABS = [
  { key: "online", label: "User Online" },
  { key: "history", label: "Log User History" },
  { key: "menu", label: "Log Menu History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function LogUserPage() {
  const { user: currentUser } = useUnifiedAuth();
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
    isLoading: isLoadingStats,
    error: statsError,
    fetchWeeklyStats,
    fetchLoginHistory,
  } = useLoginHistory();

  // Guard: only super_admin and co_admin
  const allowed =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";

  // Fetch login history on component mount
  useEffect(() => {
    if (allowed) {
      console.log("[LogUser] Fetching login history...");
      fetchLoginHistory(10);
    }
  }, [allowed, fetchLoginHistory]);

  // Debug: Log data changes
  useEffect(() => {
    console.log("[LogUser] Data state changed:", {
      onlineUsersCount: onlineUsers.length,
      onlineUsers: onlineUsers,
      isConnected,
      connectionStatus,
      loginHistoryCount: loginHistory.length,
      weeklyStatsCount: weeklyStats.length,
      isLoadingStats,
      statsError
    });
  }, [onlineUsers, isConnected, connectionStatus, loginHistory, weeklyStats, isLoadingStats, statsError]);

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
        const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
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
        const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
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
      })
      .reverse(); // Reverse to show oldest to newest
  }, [weeklyStats]);

  const maxCount = Math.max(...weeklyLogins.map((d) => d.count), 1);

  // Format login date and time with validation
  const formatLoginDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid timestamp received: ${timestamp}`);
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
      console.error(`Error formatting timestamp: ${timestamp}`, error);
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
        console.warn(`Invalid connection timestamp: ${timestamp}`);
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
      console.error(`Error formatting connection time: ${timestamp}`, error);
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

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Akses Ditolak
          </h2>
          <p className="text-sm text-muted-foreground">
            Halaman ini hanya untuk Super Admin dan Co-Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Log User</h1>
      </div>

      {/* Tabs header */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={active === t.key ? "default" : "ghost"}
            className={active === t.key ? "" : "text-muted-foreground"}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {active === "history" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    className={`h-4 w-4 ${
                      isLoadingStats ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsError ? (
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
              ) : isLoadingStats ? (
                <div className="flex items-center justify-center h-56">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Memuat data...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyLogins}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  {data.date && (
                                    <p className="text-sm text-muted-foreground">
                                      {data.date}
                                    </p>
                                  )}
                                  <p className="text-sm">
                                    <span className="font-medium text-blue-600">
                                      {payload[0].value}
                                    </span>{" "}
                                    login unik
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          className="fill-blue-500 dark:fill-blue-600"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan jumlah login unik per hari dalam 7 hari
                      terakhir.
                    </div>
                    {weeklyStats && weeklyStats.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Total login unik:{" "}
                        {weeklyStats.reduce(
                          (sum, stat) => sum + stat.distinctUsers,
                          0
                        )}{" "}
                        | Total login:{" "}
                        {weeklyStats.reduce(
                          (sum, stat) => sum + stat.totalLogins,
                          0
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
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
                  onClick={() => fetchLoginHistory(20, 0)}
                  disabled={isLoadingStats}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoadingStats ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsError ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Error Loading Data</p>
                    <p className="text-sm">{statsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLoginHistory(20, 0)}
                      className="mt-2"
                    >
                      Coba Lagi
                    </Button>
                  </div>
                </Alert>
              ) : isLoadingStats ? (
                <div className="flex items-center justify-center h-80">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Memuat data...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {loginHistory && loginHistory.length > 0 ? (
                    loginHistory.map((entry) => {
                      const loginTime = new Date(entry.loginTimestamp);
                      const timeAgo = calculateLoginDuration(
                        entry.loginTimestamp
                      );

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
                              <p className="font-medium text-sm">
                                {entry.userName || entry.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.userRole}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Lokasi: {entry.location || "Tidak diketahui"}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                IP: {entry.ipAddress || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">
                              {loginTime.toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Belum ada riwayat login
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {active === "online" && (
        <div className="space-y-4">
          {/* Connection Status and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <StatusIcon
                    className={`h-5 w-5 ${statusInfo.color} ${
                      connectionStatus === "connecting" ? "animate-spin" : ""
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{statusInfo.text}</p>
                    <p className="text-xs text-muted-foreground">
                      Status Koneksi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{userCount} User</p>
                    <p className="text-xs text-muted-foreground">
                      Sedang Online
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Real-time</p>
                      <p className="text-xs text-muted-foreground">
                        Monitoring Aktif
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshUsers}
                      disabled={!isConnected}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          connectionStatus === "connecting"
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </Button>
                    {(connectionStatus === "disconnected" ||
                      connectionStatus === "error") && (
                      <Button
                        onClick={reconnectSocket}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-8 px-3"
                      >
                        <Wifi className="h-4 w-4" />
                        <span className="text-xs">Reconnect</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Online Users List */}
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
              {!isConnected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Koneksi Terputus</p>
                    <p className="text-sm">
                      Tidak dapat menampilkan user online. Status:{" "}
                      {statusInfo.text}
                    </p>
                    {(connectionStatus === "disconnected" ||
                      connectionStatus === "error") && (
                      <div className="mt-3">
                        <Button
                          onClick={reconnectSocket}
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Wifi className="h-4 w-4" />
                          Coba Koneksi Ulang
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Pastikan Anda sudah login dan coba refresh halaman
                          jika masalah berlanjut
                        </p>
                      </div>
                    )}
                  </div>
                </Alert>
              ) : onlineUsers.length === 0 ? (
                <Alert>
                  <Users className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Tidak Ada User Online</p>
                    <p className="text-sm">
                      Belum ada user yang sedang online saat ini.
                    </p>
                  </div>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-800">
                        <TableRow>
                          <TableHead className="text-center font-bold">
                            Nama Lengkap
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Username
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Role
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Lokasi
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Waktu Login
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Durasi Login
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onlineUsers.map((userInfo) => {
                          // Add null safety check
                          if (!userInfo?.user) return null;

                          return (
                            <TableRow
                              key={userInfo.socketId}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <TableCell className="font-medium text-center">
                                {userInfo.user.name || "Unknown"}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-center">
                                {userInfo.user.username || "Unknown"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleDisplayName(
                                    userInfo.user.role as any
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground text-center">
                                {userInfo.location || "Tidak diketahui"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground text-center">
                                {userInfo.loginAt
                                  ? formatLoginDateTime(userInfo.loginAt)
                                  : "Tidak diketahui"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground text-center">
                                {userInfo.loginAt
                                  ? calculateLoginDuration(userInfo.loginAt)
                                  : "Tidak diketahui"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600 text-xs"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                  Online
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {onlineUsers.map((userInfo) => {
                      // Add null safety check
                      if (!userInfo?.user) return null;

                      return (
                        <Card key={userInfo.socketId} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {userInfo.user.name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {userInfo.user.username || "Unknown"}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleDisplayName(
                                    userInfo.user.role as any
                                  )}
                                </Badge>
                                <Badge
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600 text-xs"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                  Online
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Lokasi:</span>{" "}
                                  {userInfo.location || "Tidak diketahui"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Login:</span>{" "}
                                  {userInfo.loginAt
                                    ? formatLoginDateTime(userInfo.loginAt)
                                    : "Tidak diketahui"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Durasi:</span>{" "}
                                  {userInfo.loginAt
                                    ? calculateLoginDuration(userInfo.loginAt)
                                    : "Tidak diketahui"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {isConnected && (
                <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>
                      Data diperbarui secara real-time melalui WebSocket
                      connection
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {active === "menu" && (
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
                      const d = new Date();
                      d.setMonth(d.getMonth() - idx);
                      const val = `${d.getFullYear()}-${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const label = d.toLocaleString("id-ID", {
                        month: "long",
                        year: "numeric",
                      });
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
                  {isLoadingMenu ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Memuat data menu...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : menuAgg.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Tidak ada data untuk bulan {menuMonth}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    menuAgg.map((parent) => (
                      <Fragment key={parent?.menu || Math.random()}>
                        <TableRow
                          key={parent?.menu || Math.random()}
                          className="bg-muted/40"
                        >
                          <TableCell className="font-medium">
                            {parent?.menu || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {parent?.total || 0}
                          </TableCell>
                        </TableRow>
                        {(parent?.items || []).map((it) => (
                          <TableRow
                            key={`${parent?.menu}__${
                              it?.submenu || Math.random()
                            }`}
                          >
                            <TableCell className="pl-8 text-sm text-muted-foreground">
                              {it?.submenu || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {it?.count || 0}
                            </TableCell>
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
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic";
