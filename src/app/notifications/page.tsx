"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/lib/auth";
import { listUsers } from "@/lib/users-store";
import {
  markNotificationAsRead,
  createNotification,
  deleteNotification,
  getNotificationStats,
  type Notification,
  type NotificationType,
  type NotificationPriority,
  useAdminNotifications,
  useUserNotifications,
} from "@/lib/notifications-store";

import {
  AlertCircle,
  Bell,
  CheckCircle,
  Info,
  Send,
  Trash2,
  Users,
  AlertTriangle,
  Eye,
  Search,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function NotificationsPage() {
  const { user: currentUser } = useUnifiedAuth();
  const [query, setQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { items: adminItems, mutate: mutateAdmin } = useAdminNotifications();
  const { items: userItems, mutate: mutateUser } = useUserNotifications(
    currentUser?.username
  );
  type ApiEnv = import("@/lib/notifications-store").NotificationsApiResponse;
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [viewMode, setViewMode] = useState<"user" | "admin">("user");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);

  const [stats, setStats] = useState<{
    totalRecipients: number;
    readCount: number;
    readPercentage: number;
  } | null>(null);

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  
  // Multiple delete confirmation dialog state
  const [showMultipleDeleteConfirm, setShowMultipleDeleteConfirm] = useState(false);

  // Load stats when admin opens the stats view for a notification
  useEffect(() => {
    if (showStats && selectedNotification) {
      setStats(null);
      getNotificationStats(selectedNotification.id)
        .then((s) => setStats(s))
        .catch(() =>
          setStats({ totalRecipients: 0, readCount: 0, readPercentage: 0 })
        );
    }
  }, [showStats, selectedNotification]);

  // Auto-mark as read when user opens the detail modal
  useEffect(() => {
    if (
      viewMode === "user" &&
      selectedNotification &&
      currentUser?.username &&
      !selectedNotification.readBy.includes(currentUser.username)
    ) {
      markNotificationAsRead(selectedNotification.id, currentUser.username);
      // Optimistically update SWR cache for user list
      if (viewMode === "user") {
        // Invalidate and refetch user notifications instead of SWR-style mutate
        mutateUser();
      }
    }
  }, [viewMode, selectedNotification, currentUser?.username]);

  // Broadcast form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "info" as NotificationType,
    priority: "medium" as NotificationPriority,
    recipients: "all" as "all" | "specific",
    specificUsers: [] as string[],
    expiresAt: "",
  });

  // Real-time SWR syncing via Socket.io
  const { socket, isConnected } = useSocket();
  useEffect(() => {
    if (!socket || !isConnected) return;

    type SocketNotif = { id: string } & Record<string, unknown>;
    const handleCreated = (resp: { data?: SocketNotif } | SocketNotif) => {
      const notif: SocketNotif =
        resp && (resp as any).data ? (resp as any).data : (resp as any);
      if (!notif?.id) return;
      // Update admin and user lists if present
      mutateAdmin();
      mutateUser();
    };

    const handleDeleted = (resp: any) => {
      const id = resp?.data?.id || resp?.id;
      if (!id) return;
      mutateAdmin();
      mutateUser();
    };

    socket.on("notification:new", handleCreated);
    socket.on("notification:new:v2", handleCreated);
    socket.on("notification:deleted", handleDeleted);

    return () => {
      socket.off("notification:new", handleCreated);
      socket.off("notification:new:v2", handleCreated);
      socket.off("notification:deleted", handleDeleted);
    };
  }, [socket, isConnected, mutateAdmin, mutateUser]);

  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
  const allUsers = listUsers();

  // Force super_admin to admin view (no personal inbox)
  useEffect(() => {
    if (currentUser?.role === "super_admin" && viewMode !== "admin") {
      setViewMode("admin");
    }
  }, [currentUser?.role, viewMode]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return allUsers;
    const searchLower = userSearchQuery.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
    );
  }, [allUsers, userSearchQuery]);

  // Load notifications based on view mode using SWR
  const items: Notification[] = useMemo(() => {
    if (!currentUser?.username) return [];
    if (viewMode === "admin" && isAdmin) return adminItems || [];
    return userItems || [];
  }, [adminItems, userItems, viewMode, isAdmin, currentUser?.username]);

  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter((n) => {
      const matchesQuery = query
        ? n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.message.toLowerCase().includes(query.toLowerCase()) ||
          n.sender.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesUnread = onlyUnread
        ? viewMode === "admin"
          ? n.readBy.length === 0
          : !n.readBy.includes(currentUser?.username || "")
        : true;
      return matchesQuery && matchesUnread;
    });
  }, [items, query, onlyUnread, viewMode, currentUser?.username]);

  const allSelected =
    filtered.length > 0 && filtered.every((n) => selected[n.id]);
  const someSelected = filtered.some((n) => selected[n.id]) && !allSelected;

  function toggleAll(value: boolean) {
    const next = { ...selected };
    for (const n of filtered) next[n.id] = value;
    setSelected(next);
  }

  // markSelected removed: users cannot manually toggle read/unread anymore

  async function deleteSelected() {
    if (!isAdmin || viewMode !== "admin") return;
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (!ids.length) return;

    try {
      // Call backend to delete each notification
      await Promise.all(ids.map((id) => deleteNotification(id)));

      // Revalidate admin list for freshness
      await mutateAdmin();

      setSelected({});
      toast.success(`${ids.length} notifikasi dihapus`);
    } catch (err) {
      // Revalidate to repair state if something failed
      await mutateAdmin();
      const msg = (err as Error)?.message || "Gagal menghapus notifikasi";
      toast.error(msg);
    }
  }

  function handleBroadcast() {
    if (!currentUser?.name) return;

    const recipients: "all" | string[] =
      broadcastForm.recipients === "all" ? "all" : broadcastForm.specificUsers;

    const payload = {
      title: broadcastForm.title,
      message: broadcastForm.message,
      type: broadcastForm.type,
      priority: broadcastForm.priority,
      recipients,
      ...(expiryDate ? { expiresAt: expiryDate.toISOString() } : {}),
    };

    // Call API
    createNotification(payload)
      .then(() => {
        toast.success("Notifikasi berhasil dikirim");
      })
      .catch((e: any) => {
        toast.error(e?.message || "Gagal mengirim notifikasi");
      });

    setShowBroadcast(false);
    setBroadcastForm({
      title: "",
      message: "",
      type: "info",
      priority: "medium",
      recipients: "all",
      specificUsers: [],
      expiresAt: "",
    });
    setExpiryDate(undefined);
    setUserSearchQuery("");

    // Refresh notifications
    if (viewMode === "admin") {
      mutateAdmin();
    }
  }

  function getTypeIcon(type: NotificationType) {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
    }
  }

  function getTypeBadgeClass(type: NotificationType) {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  }

  function getPriorityBadgeClass(priority: NotificationPriority) {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Memuat notifikasi...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Notifikasi</h1>
          {isAdmin && currentUser?.role !== "super_admin" && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "user" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("user")}
              >
                <Bell className="h-4 w-4 mr-1" />
                Notifikasi Saya
              </Button>
              <Button
                variant={viewMode === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("admin")}
              >
                <Users className="h-4 w-4 mr-1" />
                Semua Notifikasi
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Cari notifikasi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-72 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
          <Select
            value={onlyUnread ? "unread" : "all"}
            onValueChange={(v) => setOnlyUnread(v === "unread")}
          >
            <SelectTrigger className="w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 cursor-pointer">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              <SelectItem value="all">Semua notifikasi</SelectItem>
              <SelectItem value="unread">Hanya belum dibaca</SelectItem>
            </SelectContent>
          </Select>
          {/* User manual mark/unmark removed for simpler UX */}
          {viewMode === "admin" && isAdmin && (someSelected || allSelected) ? (
            <Button variant="destructive" onClick={() => setShowMultipleDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Hapus ({Object.keys(selected).filter((k) => selected[k]).length})
            </Button>
          ) : null}
          {isAdmin && (
            <Button
              onClick={() => setShowBroadcast(true)}
              className="ml-auto bg-primary cursor-pointer"
            >
              <Send className="h-4 w-4 mr-1" />
              Broadcast Notifikasi
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table className="[&_th]:px-3 [&_td]:px-3 [&_th]:h-12 [&_td]:h-12 [&_th]:text-center [&_td]:text-center [&_thead]:bg-gray-100 dark:[&_thead]:bg-gray-800 [&_thead_th]:text-gray-700 dark:[&_thead_th]:text-gray-200 [&_thead_th]:font-semibold [&_tbody_tr]:bg-background [&_tbody_tr:nth-child(even)]:bg-muted/30 dark:[&_tbody_tr:nth-child(even)]:bg-muted/10">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Prioritas</TableHead>
              {viewMode === "admin" && <TableHead>Pengirim</TableHead>}
              {viewMode === "admin" && <TableHead>Penerima</TableHead>}
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              {viewMode === "admin" && <TableHead>Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((n, idx) => {
              const isSelected = !!selected[n.id];
              return (
                <TableRow
                  key={n.id}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    (viewMode === "user" || viewMode === "admin") && "group"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      className="cursor-pointer"
                      checked={isSelected}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({ ...s, [n.id]: !!v }))
                      }
                      aria-label={`Select ${n.title}`}
                    />
                  </TableCell>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell
                    className={cn(
                      viewMode === "user" || viewMode === "admin"
                        ? "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 hover:text-primary/90 hover:underline rounded transition-colors"
                        : "",
                      !n.readBy.includes(currentUser?.username || "") &&
                        "font-semibold"
                    )}
                    onClick={() => {
                      setSelectedNotification(n);
                      setShowStats(false);
                      if (
                        viewMode === "user" &&
                        currentUser?.username &&
                        !n.readBy.includes(currentUser.username)
                      ) {
                        markNotificationAsRead(n.id, currentUser.username);
                        // Invalidate and refetch notifications instead of SWR-style mutate
                        mutateUser();
                      }
                    }}
                  >
                    <span className="inline-flex items-center">
                      {n.title}
                      {(viewMode === "user" || viewMode === "admin") && (
                        <Eye className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeClass(n.type)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(n.type)}
                        {n.type}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadgeClass(n.priority)}>
                      {n.priority === "high"
                        ? "Tinggi"
                        : n.priority === "medium"
                        ? "Sedang"
                        : "Rendah"}
                    </Badge>
                  </TableCell>
                  {viewMode === "admin" && <TableCell>{n.sender}</TableCell>}
                  {viewMode === "admin" && (
                    <TableCell>
                      {n.recipients === "all" ? (
                        <Badge variant="outline">Semua User</Badge>
                      ) : (
                        <Badge variant="outline">
                          {n.recipients.length} User
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {viewMode === "admin" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Badge className="bg-gray-200 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                          {n.readBy.length} dibaca
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedNotification(n);
                            setShowStats(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : n.readBy.includes(currentUser?.username || "") ? (
                      <Badge className="bg-green-600 text-white dark:bg-green-500">
                        Sudah dibaca
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-600 text-white dark:bg-orange-500">
                        Belum dibaca
                      </Badge>
                    )}
                  </TableCell>
                  {viewMode === "admin" && (
                    <TableCell>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget(n);
                          setShowDeleteConfirm(true);
                        }}
                        aria-label="Hapus notifikasi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          <TableCaption>{filtered.length} notifikasi</TableCaption>
        </Table>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broadcast Notifikasi</DialogTitle>
            <DialogDescription>
              Kirim notifikasi ke semua pengguna atau pengguna tertentu
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Judul Notifikasi</Label>
                <Input
                  id="title"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Masukkan judul notifikasi"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Pesan</Label>
                <Textarea
                  id="message"
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      message: e.target.value,
                    })
                  }
                  placeholder="Masukkan pesan notifikasi"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipe Notifikasi</Label>
                  <Select
                    value={broadcastForm.type}
                    onValueChange={(v) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        type: v as NotificationType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Peringatan</SelectItem>
                      <SelectItem value="success">Sukses</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prioritas</Label>
                  <Select
                    value={broadcastForm.priority}
                    onValueChange={(v) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        priority: v as NotificationPriority,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Rendah</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tanggal & Waktu Kadaluarsa (Opsional)</Label>
                <DateTimePicker
                  {...(expiryDate ? { date: expiryDate } : {})}
                  onDateChange={setExpiryDate}
                  placeholder="Pilih tanggal kadaluarsa"
                />
                {expiryDate && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">
                      Kadaluarsa:{" "}
                      {expiryDate.toLocaleString("id-ID", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpiryDate(undefined)}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Penerima</Label>
                <Select
                  value={broadcastForm.recipients}
                  onValueChange={(v) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      recipients: v as "all" | "specific",
                    })
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pengguna</SelectItem>
                    <SelectItem value="specific">Pengguna Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {broadcastForm.recipients === "specific" && (
                <div className="grid gap-2">
                  <Label>Pilih Pengguna</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari pengguna berdasarkan nama, username, email, atau role..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9 mb-2"
                    />
                  </div>
                  <div className="border rounded-md p-3 max-h-72 overflow-y-auto space-y-2">
                    {filteredUsers.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="text-sm text-muted-foreground">
                            {filteredUsers.length} pengguna{" "}
                            {userSearchQuery && "ditemukan"}
                          </span>
                          {broadcastForm.specificUsers.length > 0 && (
                            <span className="text-sm font-medium">
                              {broadcastForm.specificUsers.length} dipilih
                            </span>
                          )}
                        </div>
                        {filteredUsers.map((user) => (
                          <div
                            key={user.username}
                            className="flex items-center space-x-2 py-1 hover:bg-muted/50 rounded px-2"
                          >
                            <Checkbox
                              className="cursor-pointer"
                              id={user.username}
                              checked={broadcastForm.specificUsers.includes(
                                user.username
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    specificUsers: [
                                      ...broadcastForm.specificUsers,
                                      user.username,
                                    ],
                                  });
                                } else {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    specificUsers:
                                      broadcastForm.specificUsers.filter(
                                        (u) => u !== user.username
                                      ),
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={user.username}
                              className="cursor-pointer flex-1 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium">{user.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  @{user.username}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {user.role.replace("_", " ")}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Tidak ada pengguna yang ditemukan
                      </div>
                    )}
                  </div>
                  {broadcastForm.specificUsers.length > 0 && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBroadcastForm({
                            ...broadcastForm,
                            specificUsers: [],
                          });
                        }}
                        className="w-full"
                      >
                        Hapus Semua Pilihan (
                        {broadcastForm.specificUsers.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcast(false)}>
              Batal
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={
                !broadcastForm.title ||
                !broadcastForm.message ||
                (broadcastForm.recipients === "specific" &&
                  broadcastForm.specificUsers.length === 0)
              }
            >
              <Send className="h-4 w-4 mr-2" />
              Kirim Notifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (single) */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus notifikasi ini?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Notifikasi:</p>
            <p className="text-sm font-medium">{deleteTarget?.title}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deleteTarget) {
                  try {
                    await deleteNotification(deleteTarget.id);
                    await mutateAdmin();
                    toast.success("Notifikasi dihapus");
                  } catch (err) {
                    await mutateAdmin();
                    const msg =
                      (err as Error)?.message || "Gagal menghapus notifikasi";
                    toast.error(msg);
                  }
                }
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multiple Delete Confirmation Dialog */}
      <Dialog open={showMultipleDeleteConfirm} onOpenChange={setShowMultipleDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Multiple
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {Object.keys(selected).filter((k) => selected[k]).length} notifikasi yang dipilih?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <p className="text-sm font-medium text-red-600">
              {Object.keys(selected).filter((k) => selected[k]).length} notifikasi akan dihapus secara permanen.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMultipleDeleteConfirm(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                await deleteSelected();
                setShowMultipleDeleteConfirm(false);
              }}
            >
              Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Detail Dialog */}
      {selectedNotification && (
        <Dialog
          open={!!selectedNotification}
          onOpenChange={() => setSelectedNotification(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedNotification.type)}
                {selectedNotification.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pesan:</p>
                <p className="text-sm">{selectedNotification.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pengirim:
                  </p>
                  <p className="text-sm font-medium">
                    {selectedNotification.sender}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tanggal:</p>
                  <p className="text-sm">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipe:</p>
                  <Badge
                    className={getTypeBadgeClass(selectedNotification.type)}
                  >
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Prioritas:
                  </p>
                  <Badge
                    className={getPriorityBadgeClass(
                      selectedNotification.priority
                    )}
                  >
                    {selectedNotification.priority === "high"
                      ? "Tinggi"
                      : selectedNotification.priority === "medium"
                      ? "Sedang"
                      : "Rendah"}
                  </Badge>
                </div>
              </div>
              {showStats && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Statistik Pembacaan:
                  </p>
                  <div className="space-y-2">
                    {stats ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Total Penerima:</span>
                          <span className="font-medium">
                            {stats.totalRecipients}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sudah Dibaca:</span>
                          <span className="font-medium">{stats.readCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Persentase:</span>
                          <span className="font-medium">
                            {Number(stats.readPercentage).toFixed(1)}%
                          </span>
                        </div>
                        {selectedNotification.readBy.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">
                              Dibaca oleh:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {selectedNotification.readBy.map((username) => (
                                <Badge
                                  key={username}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {username}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Memuat statistik...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
