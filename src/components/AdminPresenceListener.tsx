"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import useSocket from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_ROLES = new Set(["super_admin", "co_admin"]);

export function AdminPresenceListener() {
  const { user: me } = useAuth();
  const { on, off } = useSocket();

  const isAdmin = useMemo(() => !!me && ADMIN_ROLES.has(me.role as string), [me]);

  useEffect(() => {
    if (!isAdmin || !me) return;

    const handleOnline = (payload: any) => {
      try {
        const u = payload?.user || payload?.data?.user || payload;
        const targetId = u?.id || u?.user?.id;
        const targetName = u?.name || u?.username || u?.user?.name || u?.user?.username;
        if (!targetId || targetId === me.id) return;
        toast.info(`User ${targetName} logged in`, { duration: 4000 });
        // The list refresh is handled by use-online-users via presence listeners
      } catch {}
    };

    on("user:online", handleOnline);
    on("user:login", handleOnline);

    return () => {
      off("user:online", handleOnline);
      off("user:login", handleOnline);
    };
  }, [isAdmin, me, on, off]);

  return null;
}
