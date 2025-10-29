"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Bell,
  Mail,
  Moon,
  Sun,
  Search,
  LogOut,
  Settings,
  UserCircle,
  Users,
  HelpCircle,
  ChevronRight,
  Activity,
  Loader2,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth, canManageUsers, canAccessSettings } from "@/lib/auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
} from "@/lib/stores/notifications-store";
import { useMessagingRQ } from "@/hooks/useMessagingRQ";
import { socketClient } from "@/lib/api/socket-client";
import { useUnreadActions } from "@/stores/unread-badges-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { withBasePath } from "@/lib/config/base-path";
import { apiPath } from "@/lib/config/base-path";
import { SatkerSearch } from "./satker-search";
import { dispatchAuthEvent } from "@/lib/utils/cookieManager";
import { LoginLoading } from "@/components/ui/login-loading";
import { useAuthSessionStore } from "@/stores/session-store";
import { toast } from "sonner";

import type { User } from "@/stores/session-store";

export function Navbar({ initialUser }: { initialUser?: User }) {
  const { theme, setTheme } = useTheme();

  // Fetch user profile data using React Query
  const { data: profileData, isLoading: isLoadingProfile } = useUserProfile();

  // TRUE SSOT - Only use unified auth hook
  const {
    user: displayUser,
    isAuthenticated,
    isLoggingOut,
    logout,
    getRoleDisplayName,
    canManageUsers,
    canAccessSettings,
  } = useUnifiedAuth();

  // Use Zustand data during login/logout transitions, React Query otherwise
  // This prevents showing stale data from React Query during auth state changes
  const isAuthTransition = useAuthSessionStore(state => state.isLoading);
  const currentUser: User | null | undefined = isAuthTransition
    ? displayUser  // Trust Zustand during transitions
    : (profileData &&
        typeof profileData === "object" &&
        "id" in profileData &&
        "username" in profileData
          ? profileData
          : displayUser);
  const router = useRouter();
  interface RecentMessage {
    id: string;
    conversationId: string;
    from: string;
    subject: string;
    time: string;
    unread: boolean;
    otherParticipant?: {
      id: string;
      name: string;
      username: string;
    };
  }

  interface RecentNotification {
    id: string;
    title: string;
    type: string;
    priority: string;
    time: string;
    unread: boolean;
  }

  // recentMessages will be derived below after conversations is declared

  // State for controlling popovers (declare before hooks that depend on it)
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  // Use unified auth loading state (SSOT)
  // const isLoggingOut = isLoggingOut; // Already destructured from useUnifiedAuth

  // Real-time messaging data via React Query + Zustand (enable globally so badges update even when popover is closed)
  const { conversations } = useMessagingRQ({
    enabled: true,
  });
  // Direct socket connection status - bypass complex hook chains
  const isSocketConnected = socketClient.isConnected();
  // Derive recent messages directly from conversations so it updates on every socket/cache change
  const recentMessages: RecentMessage[] = useMemo(() => {
    if (!Array.isArray(conversations) || !currentUser?.id) return [];

    const recentConversations = conversations.filter(
      (conv) => (conv as any).lastMessage && (conv as any).otherParticipant,
    );

    const sorted = recentConversations
      .slice()
      .sort((a: any, b: any) => {
        const aDate = new Date(a.lastMessage?.created_at || a.updated_at);
        const bDate = new Date(b.lastMessage?.created_at || b.updated_at);
        const aTime = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
        const bTime = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((conv: any) => {
        const otherParticipant = conv.otherParticipant;
        if (!otherParticipant) return null;

        const convDate = new Date(
          conv.lastMessage?.created_at || conv.updated_at,
        );
        const timeDiff = isNaN(convDate.getTime())
          ? 0
          : Date.now() - convDate.getTime();
        const minutes = Math.floor(timeDiff / 60000);
        const hours = Math.floor(timeDiff / 3600000);
        const days = Math.floor(timeDiff / 86400000);

        let timeStr: string;
        if (days > 0) timeStr = `${days}h`;
        else if (hours > 0) timeStr = `${hours}j`;
        else timeStr = `${minutes}m`;

        let isUnread = false;
        if (typeof conv.unread_count === "number") {
          isUnread = conv.unread_count > 0;
        } else {
          const lastMessage = conv.lastMessage;
          isUnread = lastMessage
            ? lastMessage.isRead !== undefined
              ? !lastMessage.isRead
              : !lastMessage.is_read
            : false;
        }

        return {
          id: conv.id,
          conversationId: conv.id,
          from: otherParticipant.name || "Unknown User",
          subject: conv.lastMessage?.content || "No messages yet",
          time: timeStr,
          unread: isUnread,
          otherParticipant,
        } as RecentMessage;
      })
      .filter((m: any) => m !== null) as RecentMessage[];

    return sorted;
  }, [conversations, currentUser?.id]);
  const [recentNotifications, setRecentNotifications] = useState<
    RecentNotification[]
  >([]);
  const { bulkUpdateUnreadCounts } = useUnreadActions();
  // Derive total unread directly from conversations so it updates on socket-driven cache changes
  const totalUnreadMessagesCount = useMemo(
    () =>
      Array.isArray(conversations)
        ? conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        : 0,
    [conversations],
  );
  const [totalUnreadNotificationsCount, setTotalUnreadNotificationsCount] =
    useState(0);

  // Listen for live notifications to update badge and list
  useEffect(() => {
    const handleNew = (payload: {
      id: string;
      title: string;
      type: string;
      priority: string;
    }) => {
      setTotalUnreadNotificationsCount((c) => c + 1);
      setRecentNotifications((prev) =>
        [
          {
            id: payload.id,
            title: payload.title,
            type: payload.type,
            priority: payload.priority,
            time: "baru",
            unread: true,
          },
          ...prev,
        ].slice(0, 5),
      );
    };
    const handleNewV2 = (resp: {
      success?: boolean;
      data?: { id: string; title: string; type: string; priority: string };
    }) => {
      if (!resp?.success || !resp?.data) return;
      handleNew(resp.data);
    };
    if (socketClient.getSocket()) {
      socketClient.getSocket()?.on("notification:new", handleNew);
      socketClient.getSocket()?.on("notification:new:v2", handleNewV2);
      return () => {
        socketClient.getSocket()?.off("notification:new", handleNew);
        socketClient.getSocket()?.off("notification:new:v2", handleNewV2);
      };
    }
    return undefined;
  }, []);

  // Load user's messages and notifications
  useEffect(() => {
    if (currentUser?.username) {
      // Load notifications from backend
      getNotificationsForUser(currentUser.username)
        .then((userNotifications) => {
          const recentNotifs = userNotifications.slice(0, 5).map((notif) => {
            const notifDate = new Date(notif.createdAt);
            const timeDiff = isNaN(notifDate.getTime())
              ? 0
              : Date.now() - notifDate.getTime();
            const minutes = Math.floor(timeDiff / 60000);
            const hours = Math.floor(timeDiff / 3600000);
            const days = Math.floor(timeDiff / 86400000);

            let timeStr;
            if (days > 0) timeStr = `${days}h`;
            else if (hours > 0) timeStr = `${hours}j`;
            else timeStr = `${minutes}m`;

            return {
              id: notif.id,
              title: notif.title,
              type: notif.type,
              priority: notif.priority,
              time: timeStr,
              unread: !notif.readBy.includes(currentUser.username),
            };
          });
          setRecentNotifications(recentNotifs);
        })
        .catch(() => setTotalUnreadNotificationsCount(0));

      getUnreadNotificationCount(currentUser.username)
        .then((count) => setTotalUnreadNotificationsCount(count))
        .catch(() => setTotalUnreadNotificationsCount(0));
    }
  }, [currentUser]);

  // The old state/effect approach is removed to ensure immediate updates without stale state

  // Generate initials for avatar fallback
  const initials = useMemo(() => {
    if (!currentUser?.name) return "US";
    const parts = currentUser.name.trim().split(/\s+/);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "US"
    );
  }, [currentUser]);

  return (
    <>
      {/* Full-screen overlay during logout to prevent glimpse of protected content */}
      <LoginLoading isVisible={isLoggingOut} message="Mengeluarkan..." />
      <header
        data-navbar="true"
        className="sticky top-0 z-40 w-full border-b bg-white dark:bg-card"
      >
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          {/* left: logo */}
          <div className="flex items-center gap-2">
            {/* Brand logo – CSS toggles by theme to avoid SSR mismatch and persist on refresh */}
            {/* Dark variant shown on light theme (default), hidden on dark */}
            <Image
              src={withBasePath("/snext_logoonly_dark.svg")}
              alt="sintesaNEXT"
              width={28}
              height={28}
              className="rounded dark:hidden"
              style={{ height: "auto" }}
            />
            {/* Light variant shown on dark theme */}
            <Image
              src={withBasePath("/snext_logoonly_light.svg")}
              alt="sintesaNEXT"
              width={28}
              height={28}
              className="rounded hidden dark:inline"
              style={{ height: "auto" }}
            />
            {/* Wordmark – dark version on light theme */}
            <Image
              src={withBasePath("/snext_typeonly_dark.svg")}
              alt="sintesaNEXT"
              width={110}
              height={20}
              className="dark:hidden"
              style={{ height: "auto" }}
            />
            {/* Wordmark – light version on dark theme */}
            <Image
              src={withBasePath("/snext_typeonly_light.svg")}
              alt="sintesaNEXT"
              width={110}
              height={20}
              className="hidden dark:inline"
              style={{ height: "auto" }}
            />
          </div>

          {/* middle: search - hidden on xs */}
          <SatkerSearch />

          {/* right: icons */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications popover */}
            <Popover
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notifikasi"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {totalUnreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      {totalUnreadNotificationsCount > 9
                        ? "9+"
                        : totalUnreadNotificationsCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b font-medium flex items-center justify-between">
                  <span>Notifikasi terbaru</span>
                  {totalUnreadNotificationsCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {totalUnreadNotificationsCount} belum dibaca
                    </span>
                  )}
                </div>
                <ul className="max-h-64 overflow-auto divide-y">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          href="/notifications"
                          className={`block px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                            n.unread ? "bg-orange-50 dark:bg-orange-950/20" : ""
                          }`}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div
                                className={`text-sm ${
                                  n.unread ? "font-semibold" : "font-medium"
                                }`}
                              >
                                {n.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    n.type === "info"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                      : n.type === "warning"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                                        : n.type === "success"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                                  }`}
                                >
                                  {n.type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {n.time} lalu
                                </span>
                              </div>
                            </div>
                            {n.unread && (
                              <span className="inline-block h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Tidak ada notifikasi
                    </li>
                  )}
                </ul>
                <div className="p-2 border-t bg-muted/50">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full h-auto py-2 px-3 justify-between hover:bg-background"
                  >
                    <Link
                      href="/notifications"
                      className="flex items-center"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <span className="text-sm font-medium">
                        Lihat semua notifikasi
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages popover */}
            <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Pesan"
                  className="relative"
                >
                  <span className="relative inline-block">
                    <Mail className="h-5 w-5" />
                    <span
                      title={
                        isSocketConnected
                          ? "Socket connected"
                          : "Socket disconnected"
                      }
                      className={`absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full ring-2 ring-background ${
                        isSocketConnected ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                  </span>
                  {totalUnreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {totalUnreadMessagesCount > 9
                        ? "9+"
                        : totalUnreadMessagesCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b font-medium flex items-center justify-between">
                  <span>Pesan terbaru</span>
                  {totalUnreadMessagesCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {totalUnreadMessagesCount} belum dibaca
                    </span>
                  )}
                </div>
                <ul className="max-h-64 overflow-auto divide-y">
                  {recentMessages.length > 0 ? (
                    recentMessages.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/messages?conversation=${m.conversationId}`}
                          className={`block px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer ${
                            m.unread ? "bg-blue-50 dark:bg-blue-950/20" : ""
                          }`}
                          onClick={() => setMessagesOpen(false)}
                        >
                          <div className="flex items-start gap-2.5">
                            <Avatar className="h-7 w-7 mt-0.5 flex-shrink-0">
                              <AvatarFallback className="text-[10px]">
                                {m.otherParticipant?.name
                                  ?.slice(0, 2)
                                  .toUpperCase() ||
                                  m.from.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span
                                  className={`text-sm ${
                                    m.unread ? "font-semibold" : "font-medium"
                                  }`}
                                >
                                  {m.from}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {m.time} lalu
                                </span>
                              </div>
                              <div
                                className={`text-sm ${
                                  m.unread ? "font-medium" : ""
                                } text-gray-600 dark:text-gray-400 truncate`}
                              >
                                {m.subject}
                              </div>
                            </div>
                            {m.unread && (
                              <div className="mt-2">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Belum ada pesan
                    </li>
                  )}
                </ul>
                <div className="p-2 border-t bg-muted/50">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full h-auto py-2 px-3 justify-between hover:bg-background"
                  >
                    <Link
                      href="/messages"
                      className="flex items-center"
                      onClick={() => setMessagesOpen(false)}
                    >
                      <span className="text-sm font-medium">
                        Lihat semua pesan
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme toggle switch */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tema"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center gap-2 h-auto py-1.5 px-2 rounded-lg hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={currentUser?.name || "profil"} />
                    <AvatarFallback className="text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">
                      {currentUser?.name || "User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getRoleDisplayName}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email || "user@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Halaman Profil
                    </Link>
                  </DropdownMenuItem>
                  {canManageUsers && (
                    <DropdownMenuItem asChild>
                      <Link href="/users" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Akun Manajemen
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canAccessSettings && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Pengaturan
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(() => {
                    const roleStr = String(
                      currentUser?.role || "",
                    ).toLowerCase();
                    const isAdminLike =
                      roleStr === "super_admin" ||
                      roleStr === "co_admin" ||
                      roleStr === "admin";
                    return isAdminLike;
                  })() && (
                    <DropdownMenuItem asChild>
                      <Link href="/log-user" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        Log User
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(() => {
                    const roleStr = String(
                      currentUser?.role || "",
                    ).toLowerCase();
                    const isAdminLike =
                      roleStr === "super_admin" ||
                      roleStr === "co_admin" ||
                      roleStr === "admin";
                    return isAdminLike;
                  })() && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/monitor-performa"
                        className="flex items-center"
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        Monitor Performa
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="flex items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Bantuan
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                  <DropdownMenuItem
                  className={`text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950 ${
                    isLoggingOut ? "opacity-60 pointer-events-none" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();

                    if (isLoggingOut) {
                      return;
                    }

                    void (async () => {
                      // Disconnect socket immediately and prevent reconnection
                      try {
                        socketClient.disconnect();
                        socketClient.cleanup();
                      } catch (error) {
                        console.error("Socket disconnect failed:", error);
                      }

                      try {
                        // 1) Mark logout-in-progress immediately so middleware short-circuits
                        try {
                          document.cookie = "logout_in_progress=true; Max-Age=15; Path=/; SameSite=Lax";
                        } catch {}

                        // 2) Clear client state (non-auth cookies we can touch, caches, stores)
                        try {
                          // Clear readable CSRF cookie (auth cookies are HttpOnly and cleared by server)
                          document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/; SameSite=Lax";
                        } catch {}
                        try {
                          // Best-effort: set store flags and clear session marker
                          useAuthSessionStore.getState().logout();
                        } catch {}

                        // 3) Fire backend logout in background (don't wait)
                        try {
                          void fetch("/api/auth/logout", {
                            method: "POST",
                            credentials: "include",
                            keepalive: true,
                          }).catch((fetchError) => {
                            console.warn("[Logout] Background logout request failed", fetchError);
                          });
                        } catch (fetchError) {
                          console.warn("[Logout] Failed to issue logout request", fetchError);
                        }

                        // 4) Hard redirect immediately to login (prevents any flash)
                        const redirectUrl = "/login?reason=logout&_t=" + Date.now();
                        window.location.replace(redirectUrl);

                      } catch (error) {
                        console.error("Logout error:", error);
                        toast.error("Terjadi kesalahan saat logout");
                      }
                    })();
                  }}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengeluarkan...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Keluar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
