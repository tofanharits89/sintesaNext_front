import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";

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
async function fetchJSON(input: string, init?: RequestInit) {
  // Map Fetch-like init to Axios request config
  const method = (init?.method || "GET") as any;
  const headers = init?.headers as any;
  const data = init?.body ? tryParseJSON(init.body as any) : undefined;
  try {
    const resp = await http.request({ url: input, method, headers, data });
    const payload = resp.data ?? {};
    if (payload?.success === false) {
      const message = payload?.message || "Request failed";
      throw new Error(message);
    }
    return payload;
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e?.message || "Request failed";
    throw new Error(message);
  }
}

function tryParseJSON(body: any) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
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
        (r: {
          user?: { username?: string } | null;
          username?: string | null;
        }) => r?.user?.username || r?.username || null
      )
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    // de-duplicate usernames
    readBy = Array.from(new Set(usernames));
  } else if (typeof item.read === "boolean" && currentUsername) {
    readBy = item.read ? [currentUsername] : [];
  }
  const base: Notification = {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    priority: item.priority,
    sender: senderName,
    recipients,
    createdAt,
    expiresAt: expiresAt || undefined,
    readBy,
  } as Notification;
  if (typeof expiresAt === "string") {
    (base as any).expiresAt = expiresAt;
  }
  return base;
}

// Get notifications for current user (via Next API -> backend)
export async function getNotificationsForUser(
  username: string
): Promise<Notification[]> {
  const resp = await http.get(apiPath(`/notifications`));
  const data = resp.data;
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
  const resp = await http.get(apiPath(`/notifications/unread-count`));
  return resp.data?.data?.unread ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string,
  _username: string
): Promise<boolean> {
  await http.put(apiPath(`/notifications/${notificationId}/read`), {});
  return true;
}

export async function markAllNotificationsAsRead(
  _username: string
): Promise<void> {
  await http.put(apiPath(`/notifications/read/all`), {});
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
  const resp = await http.post(apiPath(`/notifications`), body);
  const data = resp.data;
  const item = data?.data?.notification || data?.data || body;
  return mapFromBackendItem(item);
}

export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  await http.delete(apiPath(`/notifications/${notificationId}`));
  return true;
}

export async function getAllNotifications(): Promise<Notification[]> {
  const resp = await http.get(apiPath(`/notifications/admin`));
  const data = resp.data;
  const items = data?.data?.notifications || [];
  return items.map((it: NotificationApiItem) => mapFromBackendItem(it));
}

export async function getNotificationStats(notificationId: string): Promise<{
  totalRecipients: number;
  readCount: number;
  readPercentage: number;
} | null> {
  // Fetch admin list and compute
  const resp = await http.get(apiPath(`/notifications/admin`));
  const data = resp.data;
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
    const usersResp = await http.get(apiPath(`/users`));
    const uData = usersResp.data;
    totalRecipients = Array.isArray(uData?.data)
      ? uData.data.length
      : uData?.data?.users?.length || 0;
  } else {
    totalRecipients = recipients.length;
  }
  const readCount = Array.isArray(item.reads) ? item.reads.length : 0;
  const readPercentage =
    totalRecipients > 0 ? (readCount / totalRecipients) * 100 : 0;
  return { totalRecipients, readCount, readPercentage };
}

// React Query utilities
const queryFetcher = async (url: string) => {
  const resp = await http.get(apiPath(url));
  return resp.data;
};

// Admin notifications list hooks
export function useAdminNotifications() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => queryFetcher(`/notifications/admin`),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 2 * 60 * 1000, // 2 minutes for notification data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const items = (data?.data?.notifications || []).map(
    (it: NotificationApiItem) => mapFromBackendItem(it)
  );
  
  // Add mutate alias for backward compatibility
  const mutate = refetch;
  
  return { items, error, isLoading, mutate } as const;
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  
  const { mutate: trigger, isPending: isMutating, error } = useMutation({
    mutationFn: async (id: string) => {
      const resp = await http.delete(apiPath(`/notifications/${id}`));
      const data = resp.data ?? {};
      if (data?.success === false) {
        throw new Error(data?.message || "Request failed");
      }
      return true;
    },
    onSuccess: () => {
      // Invalidate admin notifications list
      queryClient.invalidateQueries({
        queryKey: ["admin-notifications"],
      });
    },
  });
  
  return { trigger, isMutating, error } as const;
}

// User notifications list hooks
export function useUserNotifications(username?: string) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["user-notifications", username],
    queryFn: () => queryFetcher(`/notifications`),
    enabled: !!username,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 2 * 60 * 1000, // 2 minutes for notification data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const items = (data?.data?.notifications || []).map(
    (it: NotificationApiItem) => mapFromBackendItem(it, username)
  );
  
  // Add mutate alias for backward compatibility
  const mutate = refetch;
  
  return { items, error, isLoading, mutate } as const;
}

// Mark notification as read mutation hook
export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();
  
  const { mutate: trigger, isPending: isMutating, error } = useMutation({
    mutationFn: async ({ notificationId, username }: { notificationId: string; username: string }) => {
      return await markNotificationAsRead(notificationId, username);
    },
    onSuccess: (_, { username }) => {
      // Invalidate user notifications list
      queryClient.invalidateQueries({
        queryKey: ["user-notifications", username],
      });
      // Also invalidate admin notifications if they exist
      queryClient.invalidateQueries({
        queryKey: ["admin-notifications"],
      });
    },
  });
  
  return { trigger, isMutating, error } as const;
}

// Mark all notifications as read mutation hook
export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();
  
  const { mutate: trigger, isPending: isMutating, error } = useMutation({
    mutationFn: async (username: string) => {
      return await markAllNotificationsAsRead(username);
    },
    onSuccess: (_, username) => {
      // Invalidate user notifications list
      queryClient.invalidateQueries({
        queryKey: ["user-notifications", username],
      });
      // Also invalidate admin notifications if they exist
      queryClient.invalidateQueries({
        queryKey: ["admin-notifications"],
      });
    },
  });
  
  return { trigger, isMutating, error } as const;
}

// Export an API response envelope type for React Query typing
export type NotificationsApiResponse = {
  data?: { notifications?: NotificationApiItem[] };
};
