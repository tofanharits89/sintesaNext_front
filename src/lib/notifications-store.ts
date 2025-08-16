import { apiPath } from "./base-path";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { mutate as swrMutate } from "swr";

export type NotificationType = "info" | "warning" | "success" | "error";
export type NotificationPriority = "low" | "medium" | "high";

export type NotificationApiItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  sender?: string | { name?: string };
  senderName?: string;
  recipients: string[] | "all";
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  expiresAt?: string | null;
  expires_at?: string | null;
  reads?: Array<{
    user?: { username?: string } | null;
    username?: string | null;
  }>;
  read?: boolean;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  sender: string; // Display name of sender
  recipients: string[] | "all"; // usernames or "all"
  createdAt: string;
  expiresAt?: string;
  readBy: string[]; // usernames who have read
};

// Helpers
async function fetchJSON(input: RequestInfo, init?: RequestInit) {
  const resp = await fetch(input, init);
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.success === false) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}

function mapFromBackendItem(
  item: NotificationApiItem,
  currentUsername?: string
): Notification {
  // item may come from different endpoints; normalize
  const senderName =
    (typeof item.sender === "object" && item.sender?.name) ||
    item.senderName ||
    (typeof item.sender === "string" ? item.sender : "") ||
    "";
  const recipients =
    item.recipients === "all"
      ? "all"
      : Array.isArray(item.recipients)
      ? item.recipients
      : [];
  const createdAt =
    item.createdAt ||
    item.created_at ||
    item.timestamp ||
    new Date().toISOString();
  const expiresAt = item.expiresAt || item.expires_at || undefined;
  // Backend list-my returns read:boolean; admin list returns reads:[] with nested user
  let readBy: string[] = [];
  if (Array.isArray(item.reads)) {
    const usernames = item.reads
      .map(
        (r: { user?: { username?: string }; username?: string }) =>
          r?.user?.username || r?.username || null
      )
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    // de-duplicate usernames
    readBy = Array.from(new Set(usernames));
  } else if (typeof item.read === "boolean" && currentUsername) {
    readBy = item.read ? [currentUsername] : [];
  }
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    priority: item.priority,
    sender: senderName,
    recipients,
    createdAt,
    expiresAt,
    readBy,
  };
}

// Get notifications for current user (via Next API -> backend)
export async function getNotificationsForUser(
  username: string
): Promise<Notification[]> {
  const data = await fetchJSON(apiPath("/notifications"), {
    cache: "no-store",
  });
  const items = data?.data?.notifications || [];
  return items.map((it: NotificationApiItem) =>
    mapFromBackendItem(it, username)
  );
}

export async function getUnreadNotificationsForUser(
  username: string
): Promise<Notification[]> {
  const all = await getNotificationsForUser(username);
  return all.filter((n) => !n.readBy.includes(username));
}

export async function getUnreadNotificationCount(
  username: string
): Promise<number> {
  const data = await fetchJSON(apiPath("/notifications/unread-count"), {
    cache: "no-store",
  });
  return data?.data?.unread ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string,
  _username: string
): Promise<boolean> {
  await fetchJSON(apiPath(`/notifications/${notificationId}/read`), {
    method: "PUT",
  });
  return true;
}

export async function markAllNotificationsAsRead(
  _username: string
): Promise<void> {
  await fetchJSON(apiPath("/notifications/read/all"), { method: "PUT" });
}

export async function createNotification(notification: {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipients: string[] | "all";
  expiresAt?: string;
  sender?: string; // ignored by backend
}): Promise<Notification> {
  const body = {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    recipients: notification.recipients,
    expiresAt: notification.expiresAt,
  };
  const data = await fetchJSON(apiPath("/notifications"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const item = data?.data?.notification || data?.data || body;
  return mapFromBackendItem(item);
}

export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  await fetchJSON(apiPath(`/notifications/${notificationId}`), {
    method: "DELETE",
  });
  return true;
}

export async function getAllNotifications(): Promise<Notification[]> {
  const data = await fetchJSON(apiPath("/notifications/admin"), {
    cache: "no-store",
  });
  const items = data?.data?.notifications || [];
  return items.map((it: NotificationApiItem) => mapFromBackendItem(it));
}

export async function getNotificationStats(notificationId: string): Promise<{
  totalRecipients: number;
  readCount: number;
  readPercentage: number;
} | null> {
  // Fetch admin list and compute
  const data = await fetchJSON(apiPath("/notifications/admin"), {
    cache: "no-store",
  });
  const items = data?.data?.notifications || [];
  const item = items.find((x: any) => x.id === notificationId);
  if (!item) return null;
  const recipients =
    item.recipients === "all"
      ? "all"
      : Array.isArray(item.recipients)
      ? item.recipients
      : [];
  let totalRecipients = 0;
  if (recipients === "all") {
    // Fetch users count
    const usersResp = await fetchJSON(apiPath("/users"), { cache: "no-store" });
    totalRecipients = Array.isArray(usersResp?.data)
      ? usersResp.data.length
      : usersResp?.data?.users?.length || 0;
  } else {
    totalRecipients = recipients.length;
  }
  const readCount = Array.isArray(item.reads) ? item.reads.length : 0;
  const readPercentage =
    totalRecipients > 0 ? (readCount / totalRecipients) * 100 : 0;
  return { totalRecipients, readCount, readPercentage };
}

// SWR utilities
const swrFetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

// Admin notifications list hooks
export function useAdminNotifications() {
  const key = apiPath("/notifications/admin");
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher);
  const items = (data?.data?.notifications || []).map(
    (it: NotificationApiItem) => mapFromBackendItem(it)
  );
  return { items, error, isLoading, mutate } as const;
}

export function useDeleteNotificationMutation() {
  // Key for invalidation should match the list key(s)
  const listKey = apiPath("/notifications/admin");
  const { trigger, isMutating, error } = useSWRMutation(
    (id: string) => apiPath(`/notifications/${id}`),
    async (
      key: (id: string) => string,
      { arg: _ }: Readonly<{ arg: never }>
    ) => {
      const url = key as unknown as string;
      const resp = await fetch(url, { method: "DELETE" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data?.success === false) {
        throw new Error(data?.message || "Request failed");
      }
      await swrMutate(listKey);
      return true;
    }
  );
  return { trigger, isMutating, error } as const;
}

// User notifications list hooks
export function useUserNotifications(username?: string) {
  const key = username ? apiPath("/notifications") : null;
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher);
  const items = (data?.data?.notifications || []).map(
    (it: NotificationApiItem) => mapFromBackendItem(it, username)
  );
  return { items, error, isLoading, mutate } as const;
}

// Export an API response envelope type for SWR mutate typing
export type NotificationsApiResponse = {
  data?: { notifications?: NotificationApiItem[] };
};
